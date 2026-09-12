// ---------------------------------------------------------------------------
// Domaine : Cahier journal CE1
// ---------------------------------------------------------------------------

export type JourSemaine = 'lundi' | 'mardi' | 'mercredi' | 'jeudi' | 'vendredi';

export const JOURS_SEMAINE: JourSemaine[] = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'];

export type ModaliteTravail = 'collectif' | 'binome' | 'individuel' | 'groupes';

export const MODALITES: { value: ModaliteTravail; label: string }[] = [
  { value: 'collectif', label: 'Collectif' },
  { value: 'binome', label: 'Binôme' },
  { value: 'individuel', label: 'Individuel' },
  { value: 'groupes', label: 'Groupes' },
];

export interface Matiere {
  id: string;
  nom: string;
  couleur: string; // hex
}

export interface Creneau {
  id: string;
  jour: JourSemaine;
  heureDebut: string; // "HH:MM"
  heureFin: string; // "HH:MM"
  matiereId: string;
}

export interface EmploiDuTemps {
  matieres: Matiere[];
  creneaux: Creneau[];
}

export type StatutSeance = 'a_faire' | 'en_cours' | 'terminee' | 'reportee';

export interface PhaseSeance {
  id: string;
  titre: string;
  duree: number; // minutes
  consigneEnseignant: string;
  activiteEleve: string;
  modalite: ModaliteTravail;
}

export type TypeImpression = 'individuel' | 'binome' | 'groupe' | 'affichage';

export interface ImpressionItem {
  id: string;
  nom: string;
  type: TypeImpression;
  nbExemplaires?: number;
  coche: boolean;
  cheminFichier?: string; // chemin du PDF dans le dépôt de données
  nomFichier?: string; // nom original du fichier déposé
}

export interface Seance {
  id: string;
  creneauId?: string;
  matiereId: string;
  titre: string;
  modalites?: string;
  objectif?: string;
  materiel?: string;
  fichePrepId?: string;
  phases: PhaseSeance[];
  bilan?: string;
  statut: StatutSeance;
  impressions: ImpressionItem[];
  reporteeDepuis?: string;
  heureDebut?: string;
  heureFin?: string;
}

export interface JourCahier {
  date: string; // YYYY-MM-DD
  seances: Seance[];
  bilanJour?: string;
  notes?: string;
}

export interface CahierJournal {
  jours: Record<string, JourCahier>;
}

export interface JourneeTemplate {
  id: string;
  nom: string;
  seances: Array<Omit<Seance, 'id' | 'statut' | 'impressions' | 'reporteeDepuis'>>;
}

export interface TemplatesData {
  templates: JourneeTemplate[];
}

// ---------------------------------------------------------------------------
// Domaine : Fiches de préparation
// ---------------------------------------------------------------------------

export interface EtapeFiche {
  id: string;
  titre: string;
  duree: number;
  deroulement?: string;
  consigneEnseignant: string;
  activiteEleve: string;
  materiel?: string;
  modalite: ModaliteTravail;
}

export interface FichePrep {
  id: string;
  titre: string;
  domaine: string;
  competences: string[];
  niveau: string;
  objectifs: string;
  materiel: string;
  duree: number;
  seanceId?: string;
  jourDate?: string;
  sequenceId?: string;
  contenuHtml: string;
  etapes: EtapeFiche[];
  observations?: string;
  prolongements?: string;
  remediation?: string;
  cheminFichierPdf?: string;
  nomFichierPdf?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FichePrepSummary {
  id: string;
  titre: string;
  domaine: string;
  niveau: string;
  seanceId?: string;
  jourDate?: string;
  updatedAt: string;
}

export interface FichesIndex {
  fiches: FichePrepSummary[];
}

export interface GabaritFiche {
  id: string;
  nom: string;
  domaine: string;
  competences: string[];
  objectifs: string;
  materiel: string;
  duree: number;
  etapes: Array<Omit<EtapeFiche, 'id'>>;
  prolongements?: string;
  remediation?: string;
}

// ---------------------------------------------------------------------------
// Domaine : Fiches de séquence
// ---------------------------------------------------------------------------

export interface SequenceSeance {
  id: string;
  titre: string;
  objectifs: string;
  duree: number;
  fichePrepId?: string;
}

export interface Sequence {
  id: string;
  titre: string;
  cycle: string;
  niveau: string;
  domaine: string;
  objectifGeneral: string;
  connaissancesReactivees: string;
  seances: SequenceSeance[];
  evaluationDescriptif: string;
  createdAt: string;
  updatedAt: string;
}

export interface SequenceSummary {
  id: string;
  titre: string;
  domaine: string;
  niveau: string;
  nombreSeances: number;
  updatedAt: string;
}

export interface SequencesIndex {
  sequences: SequenceSummary[];
}

export interface GabaritSequence {
  id: string;
  nom: string;
  cycle: string;
  domaine: string;
  objectifGeneral: string;
  connaissancesReactivees: string;
  seances: Array<Omit<SequenceSeance, 'id' | 'fichePrepId'>>;
  evaluationDescriptif: string;
}

// ---------------------------------------------------------------------------
// Domaine : Rituels
// ---------------------------------------------------------------------------

export type TypeRituel =
  | 'date'
  | 'calcul_mental'
  | 'mot_du_jour'
  | 'chaque_jour_compte'
  | 'meteo'
  | 'devinette'
  | 'custom';

export interface Rituel {
  id: string;
  type: TypeRituel;
  titre: string;
  contenu?: string;
  ordre: number;
  actif: boolean;
}

export interface RituelsConfig {
  rituels: Rituel[];
  dateDebutAnnee: string; // YYYY-MM-DD
  effectifClasse: number;
}

// ---------------------------------------------------------------------------
// Config GitHub / Synchronisation
// ---------------------------------------------------------------------------

export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  branch: string;
}

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

export interface SyncState {
  status: SyncStatus;
  lastSyncedAt?: string;
  error?: string;
  pending: number;
}
