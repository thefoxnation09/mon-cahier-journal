export const PATHS = {
  emploiDuTemps: 'data/config/emploi-du-temps.json',
  templates: 'data/config/templates.json',
  cahierJournal: 'data/cahier-journal.json',
  rituels: 'data/rituels.json',
  fichesIndex: 'data/fiches-prep/index.json',
  fiche: (id: string) => `data/fiches-prep/${id}.json`,
  sequencesIndex: 'data/sequences/index.json',
  sequence: (id: string) => `data/sequences/${id}.json`,
  impressionFichier: (dateKey: string, seanceId: string, impressionId: string, nomFichier: string) =>
    `data/impressions/${dateKey}/${seanceId}-${impressionId}-${nomFichier}`,
  fichePdf: (ficheId: string, nomFichier: string) => `data/fiches-prep/pdf/${ficheId}-${nomFichier}`,
};
