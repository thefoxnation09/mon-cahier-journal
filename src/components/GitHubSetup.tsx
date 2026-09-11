import { useState, type FormEvent } from 'react';
import { BookOpen, CheckCircle2, GitBranch, Loader2, XCircle } from 'lucide-react';
import { githubSync } from '../services/githubSyncService';
import type { GitHubConfig } from '../types';

interface Props {
  onConnected: () => void;
}

export function GitHubSetup({ onConnected }: Props) {
  const existing = githubSync.getConfig();
  const [token, setToken] = useState(existing?.token ?? '');
  const [repoFull, setRepoFull] = useState(existing ? `${existing.owner}/${existing.repo}` : '');
  const [branch, setBranch] = useState(existing?.branch ?? 'main');
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const parsed = repoFull.trim().split('/');
  const validRepoFormat = parsed.length === 2 && parsed[0] && parsed[1];

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validRepoFormat || !token.trim()) return;
    const [owner, repo] = parsed;
    const cfg: GitHubConfig = { token: token.trim(), owner, repo, branch: branch.trim() || 'main' };

    setTesting(true);
    setResult(null);
    const test = await githubSync.testConnection(cfg);
    setTesting(false);
    setResult(test);
    if (test.ok) {
      githubSync.setConfig(cfg);
      setTimeout(onConnected, 400);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-cream-50 to-leaf-50 px-4 py-10">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl shadow-brand-100/60 border border-brand-100 p-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-xl bg-brand-500 flex items-center justify-center text-white">
            <BookOpen size={22} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-ink-900">Cahier Journal CE1</h1>
            <p className="text-sm text-ink-500">Connectez votre dépôt GitHub</p>
          </div>
        </div>

        <p className="text-sm text-ink-700 mt-4 leading-relaxed">
          Vos données (cahier journal, fiches de prep, rituels) sont enregistrées directement
          dans un dépôt GitHub privé, sous forme de fichiers JSON. Aucun serveur, aucune base de
          données externe : vous gardez la main sur vos données.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">
              Token GitHub (fine-grained)
            </label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="github_pat_..."
              className="w-full rounded-lg border border-ink-500/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              required
            />
            <p className="text-xs text-ink-500 mt-1">
              Créez un token sur GitHub → Settings → Developer settings → Fine-grained tokens,
              avec accès en lecture/écriture au contenu du dépôt choisi.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Dépôt</label>
            <input
              type="text"
              value={repoFull}
              onChange={(e) => setRepoFull(e.target.value)}
              placeholder="mon-utilisateur/mon-cahier-journal"
              className="w-full rounded-lg border border-ink-500/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Branche</label>
            <input
              type="text"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="main"
              className="w-full rounded-lg border border-ink-500/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>

          {result && (
            <div
              className={`flex items-start gap-2 rounded-lg px-3 py-2 text-sm ${
                result.ok ? 'bg-leaf-50 text-leaf-600' : 'bg-coral-50 text-coral-600'
              }`}
            >
              {result.ok ? (
                <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
              ) : (
                <XCircle size={16} className="mt-0.5 shrink-0" />
              )}
              <span>{result.message}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={testing || !validRepoFormat || !token.trim()}
            className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg py-2.5 transition-colors"
          >
            {testing ? <Loader2 size={18} className="animate-spin" /> : <GitBranch size={18} />}
            {testing ? 'Connexion en cours...' : 'Se connecter et démarrer'}
          </button>
        </form>

        <button
          onClick={onConnected}
          className="w-full text-center text-xs text-ink-500 hover:text-ink-700 mt-4 underline underline-offset-2"
        >
          Continuer sans GitHub pour l'instant (données stockées uniquement dans ce navigateur)
        </button>
      </div>
    </div>
  );
}
