import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import { githubSync } from '../services/githubSyncService';
import { PATHS } from '../data/paths';
import {
  completerRituelsManquants,
  emploiDuTempsParDefaut,
  rituelsParDefaut,
  templatesParDefaut,
} from '../data/defaults';
import { jourSemaineDe, prochainJourOuvre, toDateKey } from '../lib/dates';
import { fileToBase64, slugifyFilename } from '../lib/files';
import type {
  CahierJournal,
  EmploiDuTemps,
  FichePrep,
  FichesIndex,
  ImpressionItem,
  JourCahier,
  JourneeTemplate,
  Rituel,
  RituelsConfig,
  Seance,
  Sequence,
  SequencesIndex,
  StatutSeance,
  SyncState,
  TemplatesData,
} from '../types';

function creerSeanceDepuisCreneau(creneauId: string, matiereId: string, heureDebut: string, heureFin: string): Seance {
  return {
    id: uuid(),
    creneauId,
    matiereId,
    titre: '',
    objectif: '',
    materiel: '',
    phases: [],
    bilan: '',
    statut: 'a_faire',
    impressions: [],
    heureDebut,
    heureFin,
  };
}

interface AppState {
  ready: boolean;
  syncState: SyncState;
  isGitHubConfigured: boolean;

  emploiDuTemps: EmploiDuTemps;
  templates: TemplatesData;
  cahierJournal: CahierJournal;
  rituelsConfig: RituelsConfig;
  fichesIndex: FichesIndex;
  fichesCache: Record<string, FichePrep>;
  sequencesIndex: SequencesIndex;
  sequencesCache: Record<string, Sequence>;

  init: () => Promise<void>;
  refreshGitHubStatus: () => void;

  // Emploi du temps
  setEmploiDuTemps: (edt: EmploiDuTemps) => void;

  // Cahier journal
  getJour: (dateKey: string) => JourCahier;
  ensureJourGenere: (dateKey: string) => JourCahier;
  updateSeance: (dateKey: string, seanceId: string, patch: Partial<Seance>) => void;
  addSeance: (dateKey: string, seance?: Partial<Seance>) => Seance;
  removeSeance: (dateKey: string, seanceId: string) => void;
  setBilanJour: (dateKey: string, bilan: string) => void;
  setNotesJour: (dateKey: string, notes: string) => void;
  reporterSeance: (dateKey: string, seanceId: string) => void;
  toggleImpression: (dateKey: string, seanceId: string, impressionId: string) => void;
  addImpression: (dateKey: string, seanceId: string, impression: Omit<ImpressionItem, 'id' | 'coche'>) => void;
  removeImpression: (dateKey: string, seanceId: string, impressionId: string) => void;
  uploadImpressionFile: (dateKey: string, seanceId: string, impressionId: string, file: File) => Promise<{ ok: boolean; error?: string }>;
  removeImpressionFile: (dateKey: string, seanceId: string, impressionId: string) => Promise<void>;
  getImpressionFileUrl: (cheminFichier: string) => Promise<string | null>;

  // Templates
  enregistrerJourneeCommeTemplate: (dateKey: string, nom: string) => void;
  appliquerTemplate: (dateKey: string, templateId: string) => void;
  supprimerTemplate: (templateId: string) => void;

  // Fiches de prep
  loadFiche: (id: string) => Promise<FichePrep | null>;
  creerFiche: (partial: Partial<FichePrep>) => Promise<FichePrep>;
  updateFiche: (id: string, patch: Partial<FichePrep>) => Promise<void>;
  deleteFiche: (id: string) => Promise<void>;
  uploadFichePdf: (id: string, file: File) => Promise<{ ok: boolean; error?: string }>;
  removeFichePdf: (id: string) => Promise<void>;

  // Séquences
  loadSequence: (id: string) => Promise<Sequence | null>;
  creerSequence: (partial: Partial<Sequence>) => Promise<Sequence>;
  updateSequence: (id: string, patch: Partial<Sequence>) => Promise<void>;
  deleteSequence: (id: string) => Promise<void>;

  // Rituels
  updateRituelsConfig: (patch: Partial<RituelsConfig>) => void;
  addRituel: (rituel: Omit<Rituel, 'id' | 'ordre'>) => void;
  updateRituel: (id: string, patch: Partial<Rituel>) => void;
  removeRituel: (id: string) => void;
  reordonnerRituels: (rituels: Rituel[]) => void;
}

function persistCahierJournal(state: AppState) {
  githubSync.queueWrite(PATHS.cahierJournal, state.cahierJournal);
}
function persistEmploiDuTemps(state: AppState) {
  githubSync.queueWrite(PATHS.emploiDuTemps, state.emploiDuTemps);
}
function persistTemplates(state: AppState) {
  githubSync.queueWrite(PATHS.templates, state.templates);
}
function persistRituels(state: AppState) {
  githubSync.queueWrite(PATHS.rituels, state.rituelsConfig);
}

export const useAppStore = create<AppState>((set, get) => ({
  ready: false,
  syncState: { status: 'idle', pending: 0 },
  isGitHubConfigured: githubSync.isConfigured(),

  emploiDuTemps: emploiDuTempsParDefaut(),
  templates: templatesParDefaut(),
  cahierJournal: { jours: {} },
  rituelsConfig: rituelsParDefaut(),
  fichesIndex: { fiches: [] },
  fichesCache: {},
  sequencesIndex: { sequences: [] },
  sequencesCache: {},

  init: async () => {
    githubSync.onStateChange((s) => set({ syncState: s }));

    function surRituelsMisAJour(d: RituelsConfig) {
      const complet = completerRituelsManquants(d);
      set({ rituelsConfig: complet });
      if (complet !== d) githubSync.queueWrite(PATHS.rituels, complet);
    }

    const [edt, templates, cahier, rituelsBruts, fichesIndex, sequencesIndex] = await Promise.all([
      githubSync.readFile(PATHS.emploiDuTemps, emploiDuTempsParDefaut(), (d) => set({ emploiDuTemps: d })),
      githubSync.readFile(PATHS.templates, templatesParDefaut(), (d) => set({ templates: d })),
      githubSync.readFile(PATHS.cahierJournal, { jours: {} } as CahierJournal, (d) => set({ cahierJournal: d })),
      githubSync.readFile(PATHS.rituels, rituelsParDefaut(), surRituelsMisAJour),
      githubSync.readFile(PATHS.fichesIndex, { fiches: [] } as FichesIndex, (d) => set({ fichesIndex: d })),
      githubSync.readFile(PATHS.sequencesIndex, { sequences: [] } as SequencesIndex, (d) => set({ sequencesIndex: d })),
    ]);

    const rituels = completerRituelsManquants(rituelsBruts);
    if (rituels !== rituelsBruts) githubSync.queueWrite(PATHS.rituels, rituels);

    set({
      emploiDuTemps: edt,
      templates,
      cahierJournal: cahier,
      rituelsConfig: rituels,
      fichesIndex,
      sequencesIndex,
      ready: true,
      isGitHubConfigured: githubSync.isConfigured(),
    });
  },

  refreshGitHubStatus: () => set({ isGitHubConfigured: githubSync.isConfigured() }),

  setEmploiDuTemps: (edt) =>
    set((state) => {
      const next = { ...state, emploiDuTemps: edt };
      persistEmploiDuTemps(next);
      return { emploiDuTemps: edt };
    }),

  getJour: (dateKey) => {
    return get().cahierJournal.jours[dateKey] ?? { date: dateKey, seances: [] };
  },

  ensureJourGenere: (dateKey) => {
    const state = get();
    const existing = state.cahierJournal.jours[dateKey];
    if (existing) return existing;

    const date = new Date(dateKey + 'T00:00:00');
    const jourSemaine = jourSemaineDe(date);
    const creneaux = jourSemaine
      ? state.emploiDuTemps.creneaux
          .filter((c) => c.jour === jourSemaine)
          .sort((a, b) => a.heureDebut.localeCompare(b.heureDebut))
      : [];

    const seances = creneaux.map((c) =>
      creerSeanceDepuisCreneau(c.id, c.matiereId, c.heureDebut, c.heureFin),
    );

    const jour: JourCahier = { date: dateKey, seances };
    set((s) => {
      const next: AppState = {
        ...s,
        cahierJournal: { jours: { ...s.cahierJournal.jours, [dateKey]: jour } },
      };
      persistCahierJournal(next);
      return { cahierJournal: next.cahierJournal };
    });
    return jour;
  },

  updateSeance: (dateKey, seanceId, patch) =>
    set((state) => {
      const jour = state.cahierJournal.jours[dateKey];
      if (!jour) return state;
      const seances = jour.seances.map((s) => (s.id === seanceId ? { ...s, ...patch } : s));
      const jours = { ...state.cahierJournal.jours, [dateKey]: { ...jour, seances } };
      const next = { ...state, cahierJournal: { jours } };
      persistCahierJournal(next);
      return { cahierJournal: { jours } };
    }),

  addSeance: (dateKey, seance) => {
    const nouvelle: Seance = {
      id: uuid(),
      matiereId: seance?.matiereId ?? get().emploiDuTemps.matieres[0]?.id ?? '',
      titre: seance?.titre ?? '',
      phases: seance?.phases ?? [],
      statut: 'a_faire',
      impressions: seance?.impressions ?? [],
      ...seance,
    };
    set((state) => {
      const jour = state.cahierJournal.jours[dateKey] ?? { date: dateKey, seances: [] };
      const jours = { ...state.cahierJournal.jours, [dateKey]: { ...jour, seances: [...jour.seances, nouvelle] } };
      const next = { ...state, cahierJournal: { jours } };
      persistCahierJournal(next);
      return { cahierJournal: { jours } };
    });
    return nouvelle;
  },

  removeSeance: (dateKey, seanceId) =>
    set((state) => {
      const jour = state.cahierJournal.jours[dateKey];
      if (!jour) return state;
      const jours = {
        ...state.cahierJournal.jours,
        [dateKey]: { ...jour, seances: jour.seances.filter((s) => s.id !== seanceId) },
      };
      const next = { ...state, cahierJournal: { jours } };
      persistCahierJournal(next);
      return { cahierJournal: { jours } };
    }),

  setBilanJour: (dateKey, bilan) =>
    set((state) => {
      const jour = state.cahierJournal.jours[dateKey] ?? { date: dateKey, seances: [] };
      const jours = { ...state.cahierJournal.jours, [dateKey]: { ...jour, bilanJour: bilan } };
      const next = { ...state, cahierJournal: { jours } };
      persistCahierJournal(next);
      return { cahierJournal: { jours } };
    }),

  setNotesJour: (dateKey, notes) =>
    set((state) => {
      const jour = state.cahierJournal.jours[dateKey] ?? { date: dateKey, seances: [] };
      const jours = { ...state.cahierJournal.jours, [dateKey]: { ...jour, notes } };
      const next = { ...state, cahierJournal: { jours } };
      persistCahierJournal(next);
      return { cahierJournal: { jours } };
    }),

  reporterSeance: (dateKey, seanceId) => {
    const state = get();
    const jour = state.cahierJournal.jours[dateKey];
    const seance = jour?.seances.find((s) => s.id === seanceId);
    if (!jour || !seance) return;

    const dateActuelle = new Date(dateKey + 'T00:00:00');
    const dateCible = toDateKey(prochainJourOuvre(dateActuelle));

    const statutMaj: StatutSeance = 'reportee';
    const seanceReportee: Seance = {
      ...seance,
      id: uuid(),
      creneauId: undefined,
      statut: 'a_faire',
      reporteeDepuis: dateKey,
    };

    set((s) => {
      const jourSource = { ...jour, seances: jour.seances.map((x) => (x.id === seanceId ? { ...x, statut: statutMaj } : x)) };
      const jourCible = s.cahierJournal.jours[dateCible] ?? { date: dateCible, seances: [] };
      const jours = {
        ...s.cahierJournal.jours,
        [dateKey]: jourSource,
        [dateCible]: { ...jourCible, seances: [...jourCible.seances, seanceReportee] },
      };
      const next = { ...s, cahierJournal: { jours } };
      persistCahierJournal(next);
      return { cahierJournal: { jours } };
    });
  },

  toggleImpression: (dateKey, seanceId, impressionId) =>
    set((state) => {
      const jour = state.cahierJournal.jours[dateKey];
      if (!jour) return state;
      const seances = jour.seances.map((s) =>
        s.id === seanceId
          ? { ...s, impressions: s.impressions.map((i) => (i.id === impressionId ? { ...i, coche: !i.coche } : i)) }
          : s,
      );
      const jours = { ...state.cahierJournal.jours, [dateKey]: { ...jour, seances } };
      const next = { ...state, cahierJournal: { jours } };
      persistCahierJournal(next);
      return { cahierJournal: { jours } };
    }),

  addImpression: (dateKey, seanceId, impression) =>
    set((state) => {
      const jour = state.cahierJournal.jours[dateKey];
      if (!jour) return state;
      const nouvelle: ImpressionItem = { id: uuid(), coche: false, ...impression };
      const seances = jour.seances.map((s) =>
        s.id === seanceId ? { ...s, impressions: [...s.impressions, nouvelle] } : s,
      );
      const jours = { ...state.cahierJournal.jours, [dateKey]: { ...jour, seances } };
      const next = { ...state, cahierJournal: { jours } };
      persistCahierJournal(next);
      return { cahierJournal: { jours } };
    }),

  removeImpression: (dateKey, seanceId, impressionId) =>
    set((state) => {
      const jour = state.cahierJournal.jours[dateKey];
      if (!jour) return state;
      const seances = jour.seances.map((s) =>
        s.id === seanceId ? { ...s, impressions: s.impressions.filter((i) => i.id !== impressionId) } : s,
      );
      const jours = { ...state.cahierJournal.jours, [dateKey]: { ...jour, seances } };
      const next = { ...state, cahierJournal: { jours } };
      persistCahierJournal(next);
      return { cahierJournal: { jours } };
    }),

  uploadImpressionFile: async (dateKey, seanceId, impressionId, file) => {
    const nomFichier = slugifyFilename(file.name);
    const cheminFichier = PATHS.impressionFichier(dateKey, seanceId, impressionId, nomFichier);
    const base64 = await fileToBase64(file);
    const result = await githubSync.putBinaryFile(
      cheminFichier,
      base64,
      `chore: ajout du document ${nomFichier}`,
    );
    if (result.ok) {
      get().updateSeance(dateKey, seanceId, {
        impressions: (get().cahierJournal.jours[dateKey]?.seances.find((s) => s.id === seanceId)?.impressions ?? []).map(
          (i) => (i.id === impressionId ? { ...i, cheminFichier, nomFichier: file.name } : i),
        ),
      });
    }
    return result;
  },

  removeImpressionFile: async (dateKey, seanceId, impressionId) => {
    const jour = get().cahierJournal.jours[dateKey];
    const impression = jour?.seances.find((s) => s.id === seanceId)?.impressions.find((i) => i.id === impressionId);
    if (!impression?.cheminFichier) return;
    await githubSync.deleteBinaryFile(impression.cheminFichier, `chore: suppression du document ${impression.nomFichier ?? ''}`);
    get().updateSeance(dateKey, seanceId, {
      impressions: (jour?.seances.find((s) => s.id === seanceId)?.impressions ?? []).map((i) =>
        i.id === impressionId ? { ...i, cheminFichier: undefined, nomFichier: undefined } : i,
      ),
    });
  },

  getImpressionFileUrl: async (cheminFichier) => githubSync.getBinaryFileUrl(cheminFichier),

  enregistrerJourneeCommeTemplate: (dateKey, nom) =>
    set((state) => {
      const jour = state.cahierJournal.jours[dateKey];
      if (!jour) return state;
      const template: JourneeTemplate = {
        id: uuid(),
        nom,
        seances: jour.seances.map(({ id: _id, statut: _statut, impressions: _impressions, reporteeDepuis: _r, ...rest }) => rest),
      };
      const templates = { templates: [...state.templates.templates, template] };
      const next = { ...state, templates };
      persistTemplates(next);
      return { templates };
    }),

  appliquerTemplate: (dateKey, templateId) =>
    set((state) => {
      const template = state.templates.templates.find((t) => t.id === templateId);
      if (!template) return state;
      const seances: Seance[] = template.seances.map((s) => ({
        ...s,
        id: uuid(),
        statut: 'a_faire',
        impressions: [],
      }));
      const jour = state.cahierJournal.jours[dateKey] ?? { date: dateKey, seances: [] };
      const jours = { ...state.cahierJournal.jours, [dateKey]: { ...jour, seances: [...jour.seances, ...seances] } };
      const next = { ...state, cahierJournal: { jours } };
      persistCahierJournal(next);
      return { cahierJournal: { jours } };
    }),

  supprimerTemplate: (templateId) =>
    set((state) => {
      const templates = { templates: state.templates.templates.filter((t) => t.id !== templateId) };
      const next = { ...state, templates };
      persistTemplates(next);
      return { templates };
    }),

  loadFiche: async (id) => {
    const cached = get().fichesCache[id];
    if (cached) return cached;
    const fiche = await githubSync.readFile<FichePrep | null>(PATHS.fiche(id), null);
    if (fiche) set((state) => ({ fichesCache: { ...state.fichesCache, [id]: fiche } }));
    return fiche;
  },

  creerFiche: async (partial) => {
    const now = new Date().toISOString();
    const fiche: FichePrep = {
      id: uuid(),
      titre: partial.titre ?? 'Nouvelle fiche',
      domaine: partial.domaine ?? '',
      competences: partial.competences ?? [],
      niveau: partial.niveau ?? 'CE1',
      objectifs: partial.objectifs ?? '',
      materiel: partial.materiel ?? '',
      duree: partial.duree ?? 45,
      seanceId: partial.seanceId,
      jourDate: partial.jourDate,
      sequenceId: partial.sequenceId,
      contenuHtml: partial.contenuHtml ?? '',
      etapes: partial.etapes ?? [],
      observations: partial.observations,
      prolongements: partial.prolongements,
      remediation: partial.remediation,
      createdAt: now,
      updatedAt: now,
    };
    githubSync.queueWrite(PATHS.fiche(fiche.id), fiche);
    set((state) => {
      const fichesIndex = {
        fiches: [
          ...state.fichesIndex.fiches,
          {
            id: fiche.id,
            titre: fiche.titre,
            domaine: fiche.domaine,
            niveau: fiche.niveau,
            seanceId: fiche.seanceId,
            jourDate: fiche.jourDate,
            updatedAt: fiche.updatedAt,
          },
        ],
      };
      githubSync.queueWrite(PATHS.fichesIndex, fichesIndex);
      return {
        fichesIndex,
        fichesCache: { ...state.fichesCache, [fiche.id]: fiche },
      };
    });
    return fiche;
  },

  updateFiche: async (id, patch) => {
    const state = get();
    const current = state.fichesCache[id] ?? (await get().loadFiche(id));
    if (!current) return;
    const updated: FichePrep = { ...current, ...patch, updatedAt: new Date().toISOString() };
    githubSync.queueWrite(PATHS.fiche(id), updated);
    set((s) => {
      const fichesIndex = {
        fiches: s.fichesIndex.fiches.map((f) =>
          f.id === id
            ? { ...f, titre: updated.titre, domaine: updated.domaine, updatedAt: updated.updatedAt }
            : f,
        ),
      };
      githubSync.queueWrite(PATHS.fichesIndex, fichesIndex);
      return {
        fichesIndex,
        fichesCache: { ...s.fichesCache, [id]: updated },
      };
    });
  },

  deleteFiche: async (id) => {
    set((state) => {
      const fichesIndex = { fiches: state.fichesIndex.fiches.filter((f) => f.id !== id) };
      githubSync.queueWrite(PATHS.fichesIndex, fichesIndex);
      const fichesCache = { ...state.fichesCache };
      delete fichesCache[id];
      return { fichesIndex, fichesCache };
    });
  },

  uploadFichePdf: async (id, file) => {
    const nomFichier = slugifyFilename(file.name);
    const cheminFichierPdf = PATHS.fichePdf(id, nomFichier);
    const base64 = await fileToBase64(file);
    const result = await githubSync.putBinaryFile(cheminFichierPdf, base64, `chore: ajout du document ${nomFichier}`);
    if (result.ok) {
      await get().updateFiche(id, { cheminFichierPdf, nomFichierPdf: file.name });
    }
    return result;
  },

  removeFichePdf: async (id) => {
    const fiche = get().fichesCache[id] ?? (await get().loadFiche(id));
    if (!fiche?.cheminFichierPdf) return;
    await githubSync.deleteBinaryFile(fiche.cheminFichierPdf, `chore: suppression du document ${fiche.nomFichierPdf ?? ''}`);
    await get().updateFiche(id, { cheminFichierPdf: undefined, nomFichierPdf: undefined });
  },

  loadSequence: async (id) => {
    const cached = get().sequencesCache[id];
    if (cached) return cached;
    const sequence = await githubSync.readFile<Sequence | null>(PATHS.sequence(id), null);
    if (sequence) set((state) => ({ sequencesCache: { ...state.sequencesCache, [id]: sequence } }));
    return sequence;
  },

  creerSequence: async (partial) => {
    const now = new Date().toISOString();
    const sequence: Sequence = {
      id: uuid(),
      titre: partial.titre ?? 'Nouvelle séquence',
      cycle: partial.cycle ?? 'Cycle 2',
      niveau: partial.niveau ?? 'CE1',
      domaine: partial.domaine ?? '',
      objectifGeneral: partial.objectifGeneral ?? '',
      connaissancesReactivees: partial.connaissancesReactivees ?? '',
      seances: partial.seances ?? [],
      evaluationDescriptif: partial.evaluationDescriptif ?? '',
      createdAt: now,
      updatedAt: now,
    };
    githubSync.queueWrite(PATHS.sequence(sequence.id), sequence);
    set((state) => {
      const sequencesIndex: SequencesIndex = {
        sequences: [
          ...state.sequencesIndex.sequences,
          {
            id: sequence.id,
            titre: sequence.titre,
            domaine: sequence.domaine,
            niveau: sequence.niveau,
            nombreSeances: sequence.seances.length,
            updatedAt: sequence.updatedAt,
          },
        ],
      };
      githubSync.queueWrite(PATHS.sequencesIndex, sequencesIndex);
      return {
        sequencesIndex,
        sequencesCache: { ...state.sequencesCache, [sequence.id]: sequence },
      };
    });
    return sequence;
  },

  updateSequence: async (id, patch) => {
    const current = get().sequencesCache[id] ?? (await get().loadSequence(id));
    if (!current) return;
    const updated: Sequence = { ...current, ...patch, updatedAt: new Date().toISOString() };
    githubSync.queueWrite(PATHS.sequence(id), updated);
    set((s) => {
      const sequencesIndex: SequencesIndex = {
        sequences: s.sequencesIndex.sequences.map((seq) =>
          seq.id === id
            ? {
                ...seq,
                titre: updated.titre,
                domaine: updated.domaine,
                niveau: updated.niveau,
                nombreSeances: updated.seances.length,
                updatedAt: updated.updatedAt,
              }
            : seq,
        ),
      };
      githubSync.queueWrite(PATHS.sequencesIndex, sequencesIndex);
      return {
        sequencesIndex,
        sequencesCache: { ...s.sequencesCache, [id]: updated },
      };
    });
  },

  deleteSequence: async (id) => {
    set((state) => {
      const sequencesIndex = { sequences: state.sequencesIndex.sequences.filter((s) => s.id !== id) };
      githubSync.queueWrite(PATHS.sequencesIndex, sequencesIndex);
      const sequencesCache = { ...state.sequencesCache };
      delete sequencesCache[id];
      return { sequencesIndex, sequencesCache };
    });
  },

  updateRituelsConfig: (patch) =>
    set((state) => {
      const rituelsConfig = { ...state.rituelsConfig, ...patch };
      const next = { ...state, rituelsConfig };
      persistRituels(next);
      return { rituelsConfig };
    }),

  addRituel: (rituel) =>
    set((state) => {
      const nouveau: Rituel = { ...rituel, id: uuid(), ordre: state.rituelsConfig.rituels.length };
      const rituelsConfig = { ...state.rituelsConfig, rituels: [...state.rituelsConfig.rituels, nouveau] };
      const next = { ...state, rituelsConfig };
      persistRituels(next);
      return { rituelsConfig };
    }),

  updateRituel: (id, patch) =>
    set((state) => {
      const rituelsConfig = {
        ...state.rituelsConfig,
        rituels: state.rituelsConfig.rituels.map((r) => (r.id === id ? { ...r, ...patch } : r)),
      };
      const next = { ...state, rituelsConfig };
      persistRituels(next);
      return { rituelsConfig };
    }),

  removeRituel: (id) =>
    set((state) => {
      const rituelsConfig = { ...state.rituelsConfig, rituels: state.rituelsConfig.rituels.filter((r) => r.id !== id) };
      const next = { ...state, rituelsConfig };
      persistRituels(next);
      return { rituelsConfig };
    }),

  reordonnerRituels: (rituels) =>
    set((state) => {
      const rituelsConfig = { ...state.rituelsConfig, rituels: rituels.map((r, i) => ({ ...r, ordre: i })) };
      const next = { ...state, rituelsConfig };
      persistRituels(next);
      return { rituelsConfig };
    }),
}));
