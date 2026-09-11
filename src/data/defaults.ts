import { v4 as uuid } from 'uuid';
import type {
  EmploiDuTemps,
  GabaritFiche,
  RituelsConfig,
  TemplatesData,
} from '../types';

export const MATIERES_DEFAUT = [
  { id: 'francais', nom: 'Français', couleur: '#5a80e8' },
  { id: 'maths', nom: 'Mathématiques', couleur: '#f59e0b' },
  { id: 'qlm', nom: 'Questionner le monde', couleur: '#22c55e' },
  { id: 'eps', nom: 'EPS', couleur: '#f2665c' },
  { id: 'arts', nom: 'Arts', couleur: '#a78bfa' },
  { id: 'anglais', nom: 'Anglais', couleur: '#06b6d4' },
  { id: 'emc', nom: 'EMC', couleur: '#64748b' },
];

function creneau(jour: EmploiDuTemps['creneaux'][number]['jour'], heureDebut: string, heureFin: string, matiereId: string) {
  return { id: uuid(), jour, heureDebut, heureFin, matiereId };
}

export function emploiDuTempsParDefaut(): EmploiDuTemps {
  return {
    matieres: MATIERES_DEFAUT,
    creneaux: [
      creneau('lundi', '08:30', '09:30', 'francais'),
      creneau('lundi', '09:30', '10:30', 'maths'),
      creneau('lundi', '10:45', '11:30', 'qlm'),
      creneau('lundi', '13:30', '14:30', 'francais'),
      creneau('lundi', '14:30', '15:30', 'eps'),
      creneau('lundi', '15:45', '16:30', 'arts'),

      creneau('mardi', '08:30', '09:30', 'francais'),
      creneau('mardi', '09:30', '10:30', 'maths'),
      creneau('mardi', '10:45', '11:30', 'anglais'),
      creneau('mardi', '13:30', '14:30', 'maths'),
      creneau('mardi', '14:30', '15:30', 'qlm'),
      creneau('mardi', '15:45', '16:30', 'emc'),

      creneau('mercredi', '08:30', '09:30', 'francais'),
      creneau('mercredi', '09:30', '10:30', 'maths'),
      creneau('mercredi', '10:45', '11:30', 'eps'),

      creneau('jeudi', '08:30', '09:30', 'francais'),
      creneau('jeudi', '09:30', '10:30', 'maths'),
      creneau('jeudi', '10:45', '11:30', 'qlm'),
      creneau('jeudi', '13:30', '14:30', 'francais'),
      creneau('jeudi', '14:30', '15:30', 'eps'),
      creneau('jeudi', '15:45', '16:30', 'arts'),

      creneau('vendredi', '08:30', '09:30', 'francais'),
      creneau('vendredi', '09:30', '10:30', 'maths'),
      creneau('vendredi', '10:45', '11:30', 'anglais'),
      creneau('vendredi', '13:30', '14:30', 'maths'),
      creneau('vendredi', '14:30', '15:30', 'francais'),
      creneau('vendredi', '15:45', '16:30', 'emc'),
    ],
  };
}

export function templatesParDefaut(): TemplatesData {
  return { templates: [] };
}

export function rituelsParDefaut(): RituelsConfig {
  const today = new Date();
  const rentree = new Date(today.getFullYear() - (today.getMonth() < 7 ? 1 : 0), 8, 1);
  return {
    dateDebutAnnee: rentree.toISOString().slice(0, 10),
    effectifClasse: 24,
    rituels: [
      { id: uuid(), type: 'date', titre: 'La date', ordre: 0, actif: true },
      {
        id: uuid(),
        type: 'chaque_jour_compte',
        titre: 'Chaque jour compte',
        ordre: 1,
        actif: true,
      },
      {
        id: uuid(),
        type: 'calcul_mental',
        titre: 'Calcul mental',
        contenu: '',
        ordre: 2,
        actif: true,
      },
      { id: uuid(), type: 'mot_du_jour', titre: 'Le mot du jour', contenu: '', ordre: 3, actif: true },
      { id: uuid(), type: 'meteo', titre: 'La météo', ordre: 4, actif: false },
    ],
  };
}

export const GABARITS_FICHES: GabaritFiche[] = [
  {
    id: 'francais-lecture',
    nom: 'Français — Lecture / Compréhension',
    domaine: 'Français',
    competences: [
      'Lire et comprendre un texte adapté à son âge',
      'Repérer les informations explicites d’un texte',
    ],
    objectifs: 'Comprendre un texte court et répondre à des questions de compréhension.',
    materiel: 'Texte support (1 par élève), cahier de lecture, crayon à papier',
    duree: 45,
    etapes: [
      {
        titre: 'Rituel / rappel',
        duree: 5,
        consigneEnseignant: 'Rappeler la séance précédente, annoncer l’objectif du jour.',
        activiteEleve: 'Rappellent ce qui a été appris précédemment.',
        modalite: 'collectif',
      },
      {
        titre: 'Découverte du texte',
        duree: 10,
        consigneEnseignant: 'Lire le texte à voix haute, faire émettre des hypothèses sur le sens.',
        activiteEleve: 'Écoutent, suivent sur leur texte, formulent des hypothèses.',
        modalite: 'collectif',
      },
      {
        titre: 'Lecture individuelle',
        duree: 10,
        consigneEnseignant: 'Faire relire silencieusement, circuler pour étayer les élèves en difficulté.',
        activiteEleve: 'Relisent le texte silencieusement.',
        modalite: 'individuel',
      },
      {
        titre: 'Questions de compréhension',
        duree: 15,
        consigneEnseignant: 'Distribuer la fiche de questions, aider à la reformulation si besoin.',
        activiteEleve: 'Répondent aux questions par écrit, seuls ou en binôme.',
        modalite: 'binome',
      },
      {
        titre: 'Mise en commun',
        duree: 5,
        consigneEnseignant: 'Corriger collectivement, valoriser les stratégies de compréhension.',
        activiteEleve: 'Corrigent leurs réponses, justifient leurs choix.',
        modalite: 'collectif',
      },
    ],
  },
  {
    id: 'maths-numeration',
    nom: 'Mathématiques — Numération',
    domaine: 'Mathématiques',
    competences: [
      'Comprendre et utiliser la numération décimale de position',
      'Composer et décomposer les nombres jusqu’à 100 (ou 1000)',
    ],
    objectifs: 'Décomposer un nombre en dizaines et unités.',
    materiel: 'Matériel de numération (base 10), ardoises, fiche d’exercices',
    duree: 45,
    etapes: [
      {
        titre: 'Calcul mental',
        duree: 5,
        consigneEnseignant: 'Proposer 5 calculs rapides à l’oral.',
        activiteEleve: 'Répondent sur l’ardoise.',
        modalite: 'individuel',
      },
      {
        titre: 'Rappel de la notion',
        duree: 5,
        consigneEnseignant: 'Rappeler dizaines/unités avec le matériel de manipulation.',
        activiteEleve: 'Manipulent le matériel, verbalisent.',
        modalite: 'collectif',
      },
      {
        titre: 'Recherche',
        duree: 15,
        consigneEnseignant: 'Proposer une situation-problème de décomposition.',
        activiteEleve: 'Cherchent en binôme, manipulent si besoin.',
        modalite: 'binome',
      },
      {
        titre: 'Entraînement',
        duree: 15,
        consigneEnseignant: 'Distribuer la fiche d’exercices différenciée, étayer.',
        activiteEleve: 'Réalisent les exercices individuellement.',
        modalite: 'individuel',
      },
      {
        titre: 'Bilan',
        duree: 5,
        consigneEnseignant: 'Institutionnaliser la règle, faire verbaliser la méthode.',
        activiteEleve: 'Formulent la règle avec leurs mots.',
        modalite: 'collectif',
      },
    ],
  },
  {
    id: 'qlm-decouverte',
    nom: 'Questionner le monde — Découverte',
    domaine: 'Questionner le monde',
    competences: ['Se repérer dans le temps et l’espace', 'Pratiquer une démarche d’investigation'],
    objectifs: 'Découvrir une notion à partir d’une situation concrète.',
    materiel: 'Supports documentaires, affiche collective, feutres',
    duree: 45,
    etapes: [
      {
        titre: 'Mise en route',
        duree: 5,
        consigneEnseignant: 'Présenter la situation déclenchante (image, objet, question).',
        activiteEleve: 'Observent, réagissent, formulent des questions.',
        modalite: 'collectif',
      },
      {
        titre: 'Hypothèses',
        duree: 10,
        consigneEnseignant: 'Recueillir les représentations initiales des élèves.',
        activiteEleve: 'Formulent des hypothèses en groupes.',
        modalite: 'groupes',
      },
      {
        titre: 'Investigation',
        duree: 15,
        consigneEnseignant: 'Faire manipuler ou chercher dans les documents fournis.',
        activiteEleve: 'Cherchent, expérimentent, notent leurs observations.',
        modalite: 'groupes',
      },
      {
        titre: 'Mise en commun',
        duree: 10,
        consigneEnseignant: 'Organiser la restitution des groupes, structurer les apports.',
        activiteEleve: 'Présentent leurs résultats au groupe classe.',
        modalite: 'collectif',
      },
      {
        titre: 'Trace écrite',
        duree: 5,
        consigneEnseignant: 'Co-construire la trace écrite avec les élèves.',
        activiteEleve: 'Copient ou complètent la trace écrite.',
        modalite: 'individuel',
      },
    ],
  },
];
