import { v4 as uuid } from 'uuid';
import type {
  EmploiDuTemps,
  GabaritFiche,
  GabaritSequence,
  Rituel,
  RituelsConfig,
  TemplatesData,
  TypeRituel,
} from '../types';

export const MATIERES_DEFAUT = [
  { id: 'francais', nom: 'Français', couleur: '#7fb2e0' },
  { id: 'maths', nom: 'Mathématiques', couleur: '#f0c789' },
  { id: 'qlm', nom: 'Questionner le monde', couleur: '#74c093' },
  { id: 'eps', nom: 'EPS', couleur: '#e592ab' },
  { id: 'arts', nom: 'Arts', couleur: '#ac8fe4' },
  { id: 'anglais', nom: 'Anglais', couleur: '#7fd4c9' },
  { id: 'emc', nom: 'EMC', couleur: '#b9b3cc' },
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

// Liste de référence des rituels fournis par l'application. Sert à la fois à
// générer la config initiale et à compléter automatiquement les rituels
// nouvellement ajoutés (mises à jour de l'appli) chez les utilisateurs qui
// ont déjà une configuration existante dans leur dépôt.
const RITUELS_BASE: { type: TypeRituel; titre: string; actif: boolean }[] = [
  { type: 'date', titre: 'La date', actif: true },
  { type: 'chaque_jour_compte', titre: 'Chaque jour compte', actif: true },
  { type: 'calcul_mental', titre: 'Calcul mental', actif: true },
  { type: 'mot_du_jour', titre: 'Le mot du jour', actif: true },
  { type: 'meteo', titre: 'La météo', actif: false },
  { type: 'devinette', titre: 'La devinette du jour', actif: true },
];

export function rituelsParDefaut(): RituelsConfig {
  const today = new Date();
  const rentree = new Date(today.getFullYear() - (today.getMonth() < 7 ? 1 : 0), 8, 1);
  return {
    dateDebutAnnee: rentree.toISOString().slice(0, 10),
    effectifClasse: 24,
    rituels: RITUELS_BASE.map((r, ordre) => ({
      id: uuid(),
      type: r.type,
      titre: r.titre,
      contenu: '',
      ordre,
      actif: r.actif,
    })),
  };
}

/**
 * Ajoute à une config déjà existante les rituels de base qui n'y figurent
 * pas encore (ex : un rituel introduit par une mise à jour de l'appli après
 * que l'utilisateur a déjà généré sa configuration). Ne modifie ni ne
 * supprime jamais les rituels déjà présents.
 */
export function completerRituelsManquants(config: RituelsConfig): RituelsConfig {
  const typesExistants = new Set(config.rituels.map((r) => r.type));
  const manquants = RITUELS_BASE.filter((r) => !typesExistants.has(r.type));
  if (manquants.length === 0) return config;
  const ordreDepart = config.rituels.length;
  const nouveaux: Rituel[] = manquants.map((r, i) => ({
    id: uuid(),
    type: r.type,
    titre: r.titre,
    contenu: '',
    ordre: ordreDepart + i,
    actif: r.actif,
  }));
  return { ...config, rituels: [...config.rituels, ...nouveaux] };
}

export interface Devinette {
  question: string;
  reponse: string;
}

export const BANQUE_DEVINETTES: Devinette[] = [
  { question: "Je suis un fruit jaune et allongé que les singes adorent manger. Qui suis-je ?", reponse: 'Une banane' },
  { question: "J'ai quatre pattes, une queue, des moustaches, et je fais miaou. Qui suis-je ?", reponse: 'Un chat' },
  { question: "Je suis blanche, je tombe en hiver, et les enfants aiment jouer avec moi. Qui suis-je ?", reponse: 'La neige' },
  { question: "Je suis ronde et orange, je pousse sur un arbre, et on me presse pour faire du jus. Qui suis-je ?", reponse: 'Une orange' },
  { question: "J'ai un très long cou et je vis dans la savane africaine. Qui suis-je ?", reponse: 'Une girafe' },
  { question: "Je vole la nuit et je dors la tête en bas, accrochée à une branche. Qui suis-je ?", reponse: 'Une chauve-souris' },
  { question: "Je suis noir et blanc, je vis en Chine, et j'adore manger du bambou. Qui suis-je ?", reponse: 'Un panda' },
  { question: "Je réveille tout le monde le matin en chantant cocorico. Qui suis-je ?", reponse: 'Un coq' },
  { question: "Je suis très grand, j'ai une longue trompe et de grandes oreilles. Qui suis-je ?", reponse: 'Un éléphant' },
  { question: "Je vis en Australie, je saute très haut, et je porte mon bébé dans une poche. Qui suis-je ?", reponse: 'Un kangourou' },
  { question: "Je suis un légume orange que les lapins adorent grignoter. Qui suis-je ?", reponse: 'Une carotte' },
  { question: "Je suis ronde et rouge, et on me met souvent dans la salade. Qui suis-je ?", reponse: 'Une tomate' },
  { question: "Je brille dans le ciel la nuit et je change parfois de forme. Qui suis-je ?", reponse: 'La lune' },
  { question: "Je suis jaune, je brille le jour, et je réchauffe la Terre. Qui suis-je ?", reponse: 'Le soleil' },
  { question: "J'ai des rayures jaunes et noires, six pattes, et je fabrique du miel. Qui suis-je ?", reponse: 'Une abeille' },
  { question: "Je suis un oiseau noir et blanc, je ne peux pas voler, et je vis sur la banquise. Qui suis-je ?", reponse: 'Un manchot' },
  { question: "Je suis toute petite, grise, et j'ai très peur des chats. Qui suis-je ?", reponse: 'Une souris' },
  { question: "Je vis dans l'eau, j'ai des écailles, et je respire grâce à mes branchies. Qui suis-je ?", reponse: 'Un poisson' },
  { question: "J'ai une carapace sur le dos et je marche très lentement. Qui suis-je ?", reponse: 'Une tortue' },
  { question: "Je suis un petit fruit rouge avec plein de petites graines jaunes sur la peau. Qui suis-je ?", reponse: 'Une fraise' },
  { question: "Je passe du vert à l'orange puis au rouge pour dire aux voitures de s'arrêter. Qui suis-je ?", reponse: 'Un feu tricolore' },
  { question: "Je suis blanc, une poule m'a pondu, et on me mange souvent au petit-déjeuner. Qui suis-je ?", reponse: 'Un œuf' },
  { question: "J'ai des rayures noires et blanches et je ressemble un peu à un cheval. Qui suis-je ?", reponse: 'Un zèbre' },
  { question: "Je suis rouge avec des petits points noirs et je vole dans le jardin. Qui suis-je ?", reponse: 'Une coccinelle' },
  { question: "Je porte ma maison sur mon dos et je me déplace très lentement. Qui suis-je ?", reponse: 'Un escargot' },
  { question: "On me construit en hiver avec de la neige, une carotte pour le nez et des boutons pour les yeux. Qui suis-je ?", reponse: 'Un bonhomme de neige' },
  { question: "Je suis petite et verte, je saute, et je dis « coa coa » près de la mare. Qui suis-je ?", reponse: 'Une grenouille' },
  { question: "J'ai de la laine toute douce sur le dos et je dis « bêê ». Qui suis-je ?", reponse: 'Un mouton' },
  { question: "Je vis à la ferme, j'ai un groin, et je dis « groin groin ». Qui suis-je ?", reponse: 'Un cochon' },
  { question: "Je suis ronde, rouge ou verte, et je pousse sur un pommier. Qui suis-je ?", reponse: 'Une pomme' },
];

export function devinetteDuJour(date: Date): Devinette {
  const debutAnnee = Date.UTC(date.getFullYear(), 0, 1);
  const aujourdhui = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const jourDeLAnnee = Math.floor((aujourdhui - debutAnnee) / 86400000);
  const index = ((jourDeLAnnee % BANQUE_DEVINETTES.length) + BANQUE_DEVINETTES.length) % BANQUE_DEVINETTES.length;
  return BANQUE_DEVINETTES[index];
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
  {
    id: 'calcul-mental-ce1',
    nom: 'Mathématiques — Calcul mental',
    domaine: 'Mathématiques',
    competences: ['Calcul mental : compléments, doubles, encadrement de nombres'],
    objectifs: 'Automatiser la dictée de nombres et l\'encadrement, les compléments à 10, les doubles.',
    materiel: 'Ardoise, craie, chiffon, cartes flash',
    duree: 15,
    etapes: [
      {
        titre: 'Dictée de nombres & encadrement',
        duree: 5,
        deroulement:
          "Dictée de nombres et encadrement (nombre avant/après) : 31 < 32 < 33 · 44 < 45 < 46 · 78 < 79 < 80 · 84 < 85 < 86 · 68 < 69 < 70.\nDifférenciation envisagée : proposer une bande numérique/file numérique sur la table pour les élèves ayant des difficultés de repérage.",
        consigneEnseignant:
          "Montre les nombres avec les doigts, guide l'activité et valide les réponses affichées sur l'ardoise.",
        activiteEleve:
          "Écrit le nombre déchiffré, puis son prédécesseur et enfin son successeur, sur l'ardoise un par un.",
        materiel: 'Ardoise, craie, chiffon',
        modalite: 'collectif',
      },
      {
        titre: 'Additions à 3 termes (compléments à 10)',
        duree: 6,
        deroulement:
          "Calcul d'additions du type a + b + c en repérant d'abord les compléments à 10 : 3+5+7=15 · 8+4+2=14 · 6+3+4=13 · 5+3+5=13 · 3+6+3=12.\nDifférenciation envisagée : entourer visuellement au tableau les deux nombres dont la somme fait 10.",
        consigneEnseignant:
          "Écrit les calculs au tableau, rappelle la stratégie du complément à 10 et observe les démarches des élèves.",
        activiteEleve:
          "Cherche les groupements par 10 pour calculer plus vite, écrit le résultat sur l'ardoise et lève au signal.",
        materiel: 'Ardoise, tableau',
        modalite: 'individuel',
      },
      {
        titre: 'Les doubles (si le temps)',
        duree: 4,
        deroulement: 'Calcul rapide des doubles : 3+3=6 · 6+6=12 · 8+8=16 · 9+9=18.',
        consigneEnseignant: 'Énonce les additions de doubles.',
        activiteEleve: "Restitue de mémoire le résultat du double le plus rapidement possible sur l'ardoise.",
        materiel: 'Ardoise, cartes flash',
        modalite: 'individuel',
      },
    ],
    prolongements: 'Réinvestissement dans des petits problèmes oraux / Jeux de cartes sur les compléments à 10 et les doubles.',
    remediation:
      "Atelier dirigé en groupe restreint pour revoir la décomposition du nombre 10 et l'automatisation des doubles jusqu'à 10+10.",
  },
];

export const GABARITS_SEQUENCES: GabaritSequence[] = [
  {
    id: 'nombres-jusqua-10',
    nom: 'Les nombres jusqu\'à 10',
    cycle: 'Cycle 2',
    domaine: 'Nombres et Calculs',
    objectifGeneral:
      'Comprendre, représenter et manipuler les nombres jusqu\'à 10 (dénombrement, comparaison, décomposition, et calculs simples d\'addition et de soustraction).',
    connaissancesReactivees:
      'La chaîne numérique orale et écrite\nLe dénombrement et la cardinalité\nLe sens des opérations simples : addition, soustraction\nLa décomposition additive des nombres\nLes relations d\'ordre : comparaison, encadrement',
    seances: [
      {
        titre: 'Dire, lire, écrire, dénombrer',
        objectifs:
          'Dire, lire et écrire les nombres.\nDénombrer une collection.\nAssocier un nombre à sa position sur la ligne numérique.',
        duree: 40,
      },
      {
        titre: 'Calculer des sommes et des différences',
        objectifs: 'Calcul en ligne des sommes et des différences.\nIdentifier l\'opération à effectuer.',
        duree: 40,
      },
      {
        titre: 'Situer des objets',
        objectifs:
          'Situer des objets les uns par rapport aux autres en utilisant un vocabulaire approprié : gauche, droite, au-dessus, au-dessous, entre, devant, derrière.',
        duree: 40,
      },
      {
        titre: 'Évaluation des 3 premières séances + Comparer, ranger, encadrer à l\'unité',
        objectifs:
          'Éval n°1 (séances 1 à 3) ≈15-20 min\nComparer et ranger les nombres\nEncadrer les nombres\nEstimer la position d\'un nombre sur une ligne numérique',
        duree: 60,
      },
      {
        titre: 'Décomposer le nombre 10',
        objectifs:
          'Décomposer le nombre 10\nConnaître les compléments à 10\nUtiliser le lien entre addition et soustraction',
        duree: 40,
      },
      {
        titre: 'Décomposer les nombres jusqu\'à 10',
        objectifs:
          'Connaître les compléments à 10\nDécomposer les nombres jusqu\'à 10\nUtiliser le lien entre addition et soustraction',
        duree: 40,
      },
      {
        titre: 'Compléter des additions et des soustractions à trou',
        objectifs: 'Compléter des additions à trous\nCompléter des soustractions à trous',
        duree: 40,
      },
    ],
    evaluationDescriptif:
      'Éval n°1 (séances 1 à 3) ≈15-20 min\nExercice 1 : compter les objets et écrire le nombre en chiffres, puis en lettres.\nExercice 2 : calculer des sommes et des différences.\nExercice 3 : observe l\'image et complète les phrases avec gauche, droite, sur, sous, entre.\n\nÉval n°2 (séances 4 à 7) ≈15-20 min\nExercice 4 : complète avec les symboles < ou >.\nExercice 5 : décomposer le nombre 10 et les compléments.\nExercice 6 : compléter les opérations à trou.',
  },
];
