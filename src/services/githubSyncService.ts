import { openDB, type IDBPDatabase } from 'idb';
import type { GitHubConfig, SyncState } from '../types';

// ---------------------------------------------------------------------------
// Stockage du token / dépôt (localStorage)
// ---------------------------------------------------------------------------

const CONFIG_KEY = 'cahier-journal:github-config';
const DEFAULT_BRANCH = 'main';
const DB_NAME = 'cahier-journal-db';
const STORE_NAME = 'files';
const DEBOUNCE_MS = 1200;

interface CachedFile<T = unknown> {
  path: string;
  data: T;
  sha: string | null;
  dirty: boolean;
  updatedAt: string;
}

function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

function base64ToUtf8(b64: string): string {
  const binary = atob(b64.replace(/\n/g, ''));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function encodePath(path: string): string {
  return path.split('/').map(encodeURIComponent).join('/');
}

class GitHubSyncService {
  private dbPromise: Promise<IDBPDatabase>;
  private timers = new Map<string, ReturnType<typeof setTimeout>>();
  private inFlight = new Set<string>();
  private listeners = new Set<(state: SyncState) => void>();
  private state: SyncState = { status: 'idle', pending: 0 };

  constructor() {
    this.dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'path' });
        }
      },
    });
  }

  // --- Configuration -------------------------------------------------------

  getConfig(): GitHubConfig | null {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return null;
    try {
      const cfg = JSON.parse(raw) as GitHubConfig;
      return { ...cfg, branch: cfg.branch || DEFAULT_BRANCH };
    } catch {
      return null;
    }
  }

  setConfig(cfg: GitHubConfig): void {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
  }

  clearConfig(): void {
    localStorage.removeItem(CONFIG_KEY);
  }

  isConfigured(): boolean {
    const cfg = this.getConfig();
    return !!(cfg && cfg.token && cfg.owner && cfg.repo);
  }

  async testConnection(cfg: GitHubConfig): Promise<{ ok: boolean; message: string }> {
    try {
      const res = await fetch(`https://api.github.com/repos/${cfg.owner}/${cfg.repo}`, {
        headers: this.headers(cfg),
      });
      if (res.status === 200) {
        const json = await res.json();
        const canPush = json?.permissions?.push;
        if (canPush === false) {
          return {
            ok: false,
            message: "Le dépôt est accessible mais le token n'a pas les droits d'écriture.",
          };
        }
        return { ok: true, message: `Connecté à ${json.full_name}.` };
      }
      if (res.status === 401) return { ok: false, message: 'Token invalide ou expiré.' };
      if (res.status === 404)
        return { ok: false, message: "Dépôt introuvable (vérifiez le nom et l'accès du token)." };
      return { ok: false, message: `Erreur GitHub (${res.status}).` };
    } catch {
      return { ok: false, message: 'Impossible de contacter GitHub (réseau).' };
    }
  }

  // --- État de synchronisation ----------------------------------------------

  onStateChange(cb: (state: SyncState) => void): () => void {
    this.listeners.add(cb);
    cb(this.state);
    return () => this.listeners.delete(cb);
  }

  private setState(patch: Partial<SyncState>): void {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((cb) => cb(this.state));
  }

  // --- Lecture ---------------------------------------------------------------

  /**
   * Retourne immédiatement la donnée en cache local si elle existe, puis
   * rafraîchit depuis GitHub en arrière-plan (onUpdate est rappelé si la
   * donnée distante diffère). Si aucun cache, va chercher sur GitHub avant
   * de résoudre (et initialise le fichier distant avec defaultValue si absent).
   */
  async readFile<T>(path: string, defaultValue: T, onUpdate?: (data: T) => void): Promise<T> {
    const cached = await this.getCached<T>(path);
    if (cached) {
      if (this.isConfigured()) {
        void this.refreshFromRemote(path, onUpdate);
      }
      return cached.data;
    }

    if (!this.isConfigured()) {
      await this.setCached(path, defaultValue, null, false);
      return defaultValue;
    }

    const remote = await this.fetchRemote<T>(path);
    if (remote) {
      await this.setCached(path, remote.data, remote.sha, false);
      return remote.data;
    }

    await this.setCached(path, defaultValue, null, false);
    return defaultValue;
  }

  private async refreshFromRemote<T>(
    path: string,
    onUpdate?: (data: T) => void,
  ): Promise<void> {
    const local = await this.getCached<T>(path);
    if (local?.dirty) return; // ne pas écraser des modifications locales non envoyées

    const remote = await this.fetchRemote<T>(path);
    if (!remote) return;
    const localStr = local ? JSON.stringify(local.data) : null;
    const remoteStr = JSON.stringify(remote.data);
    if (localStr !== remoteStr) {
      await this.setCached(path, remote.data, remote.sha, false);
      onUpdate?.(remote.data);
    } else if (local && local.sha !== remote.sha) {
      await this.setCached(path, local.data, remote.sha, false);
    }
  }

  private async fetchRemote<T>(path: string): Promise<{ data: T; sha: string } | null> {
    const cfg = this.getConfig();
    if (!cfg) return null;
    try {
      const res = await fetch(
        `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${encodePath(path)}?ref=${cfg.branch || DEFAULT_BRANCH}`,
        { headers: this.headers(cfg) },
      );
      if (res.status === 404) return null;
      if (!res.ok) {
        this.setState({ status: 'error', error: `Lecture impossible (${res.status})` });
        return null;
      }
      const json = await res.json();
      const content = base64ToUtf8(json.content as string);
      return { data: JSON.parse(content) as T, sha: json.sha as string };
    } catch {
      this.setState({ status: 'offline', error: 'Hors ligne' });
      return null;
    }
  }

  // --- Écriture ---------------------------------------------------------------

  /**
   * Écrit immédiatement dans le cache local (lecture instantanée, UI non
   * bloquée) puis planifie un commit GitHub avec un léger anti-rebond.
   */
  queueWrite<T>(path: string, data: T): void {
    void this.setCached(path, data, undefined, true).then(() => {
      this.setState({ pending: this.state.pending + 1 });
      const existing = this.timers.get(path);
      if (existing) clearTimeout(existing);
      const timer = setTimeout(() => {
        this.timers.delete(path);
        void this.flush(path);
      }, DEBOUNCE_MS);
      this.timers.set(path, timer);
    });
  }

  /** Force l'envoi immédiat de toutes les écritures en attente. */
  async flushAll(): Promise<void> {
    const db = await this.dbPromise;
    const all = (await db.getAll(STORE_NAME)) as CachedFile[];
    await Promise.all(
      all.filter((f) => f.dirty).map((f) => {
        const t = this.timers.get(f.path);
        if (t) clearTimeout(t);
        this.timers.delete(f.path);
        return this.flush(f.path);
      }),
    );
  }

  private async flush(path: string, attempt = 0): Promise<void> {
    const cfg = this.getConfig();
    const cached = await this.getCached(path);
    if (!cached || !cached.dirty) return;
    if (!cfg) {
      this.setState({ status: 'offline' });
      return;
    }
    if (this.inFlight.has(path)) return;
    this.inFlight.add(path);
    this.setState({ status: 'syncing' });

    try {
      const body: Record<string, unknown> = {
        message: `chore: mise à jour ${path}`,
        content: utf8ToBase64(JSON.stringify(cached.data, null, 2)),
        branch: cfg.branch || DEFAULT_BRANCH,
      };
      if (cached.sha) body.sha = cached.sha;

      const res = await fetch(
        `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${encodePath(path)}`,
        {
          method: 'PUT',
          headers: this.headers(cfg),
          body: JSON.stringify(body),
        },
      );

      if (res.status === 409 || res.status === 422) {
        if (attempt < 1) {
          const remote = await this.fetchRemote(path);
          await this.setCached(path, cached.data, remote?.sha ?? null, true);
          this.inFlight.delete(path);
          return this.flush(path, attempt + 1);
        }
        this.setState({ status: 'error', error: 'Conflit de synchronisation.' });
        this.inFlight.delete(path);
        return;
      }

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        this.setState({ status: 'error', error: `Échec de synchronisation (${res.status}) ${text}` });
        this.inFlight.delete(path);
        return;
      }

      const json = await res.json();
      await this.setCached(path, cached.data, json.content.sha as string, false);
      this.inFlight.delete(path);
      this.setState({
        status: 'synced',
        lastSyncedAt: new Date().toISOString(),
        pending: Math.max(0, this.state.pending - 1),
        error: undefined,
      });
    } catch {
      this.inFlight.delete(path);
      this.setState({ status: 'offline', error: 'Hors ligne, synchronisation différée.' });
    }
  }

  // --- Cache local (IndexedDB) -------------------------------------------------

  private async getCached<T>(path: string): Promise<CachedFile<T> | undefined> {
    const db = await this.dbPromise;
    return (await db.get(STORE_NAME, path)) as CachedFile<T> | undefined;
  }

  private async setCached<T>(
    path: string,
    data: T,
    sha: string | null | undefined,
    dirty: boolean,
  ): Promise<void> {
    const db = await this.dbPromise;
    const existing = (await db.get(STORE_NAME, path)) as CachedFile<T> | undefined;
    const entry: CachedFile<T> = {
      path,
      data,
      sha: sha === undefined ? (existing?.sha ?? null) : sha,
      dirty,
      updatedAt: new Date().toISOString(),
    };
    await db.put(STORE_NAME, entry);
  }

  private headers(cfg: GitHubConfig): HeadersInit {
    return {
      Authorization: `Bearer ${cfg.token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    };
  }

  // --- Fichiers binaires (PDF à imprimer) -------------------------------------

  /** Dépose un fichier (contenu déjà encodé en base64, sans préfixe data:) dans le dépôt de données. */
  async putBinaryFile(
    path: string,
    base64Content: string,
    message: string,
  ): Promise<{ ok: boolean; error?: string }> {
    const cfg = this.getConfig();
    if (!cfg) return { ok: false, error: "GitHub n'est pas connecté." };
    try {
      const res = await fetch(
        `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${encodePath(path)}`,
        {
          method: 'PUT',
          headers: this.headers(cfg),
          body: JSON.stringify({ message, content: base64Content, branch: cfg.branch || DEFAULT_BRANCH }),
        },
      );
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        return { ok: false, error: `Échec de l'envoi du fichier (${res.status}) ${text}` };
      }
      return { ok: true };
    } catch {
      return { ok: false, error: 'Hors ligne, réessayez plus tard.' };
    }
  }

  /** Récupère un fichier binaire du dépôt et retourne une URL de blob local utilisable dans <a>/<iframe>. */
  async getBinaryFileUrl(path: string, mimeType = 'application/pdf'): Promise<string | null> {
    const cfg = this.getConfig();
    if (!cfg) return null;
    try {
      const res = await fetch(
        `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${encodePath(path)}?ref=${cfg.branch || DEFAULT_BRANCH}`,
        { headers: this.headers(cfg) },
      );
      if (!res.ok) return null;
      const json = await res.json();
      const binary = atob((json.content as string).replace(/\n/g, ''));
      const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: mimeType });
      return URL.createObjectURL(blob);
    } catch {
      return null;
    }
  }

  /** Supprime un fichier binaire du dépôt de données. */
  async deleteBinaryFile(path: string, message: string): Promise<boolean> {
    const cfg = this.getConfig();
    if (!cfg) return false;
    try {
      const getRes = await fetch(
        `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${encodePath(path)}?ref=${cfg.branch || DEFAULT_BRANCH}`,
        { headers: this.headers(cfg) },
      );
      if (!getRes.ok) return false;
      const json = await getRes.json();
      const delRes = await fetch(
        `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${encodePath(path)}`,
        {
          method: 'DELETE',
          headers: this.headers(cfg),
          body: JSON.stringify({ message, sha: json.sha, branch: cfg.branch || DEFAULT_BRANCH }),
        },
      );
      return delRes.ok;
    } catch {
      return false;
    }
  }
}

export const githubSync = new GitHubSyncService();

// Tente d'envoyer les écritures en attente avant fermeture de l'onglet.
window.addEventListener('beforeunload', () => {
  void githubSync.flushAll();
});
