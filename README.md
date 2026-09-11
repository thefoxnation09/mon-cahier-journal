# Cahier Journal CE1

Application web de gestion de classe (cahier journal, fiches de préparation,
rituels quotidiens, impressions) pour une classe de CE1.

## Architecture

- **100 % serverless** : Single Page Application React/Vite déployée
  gratuitement sur GitHub Pages.
- **Git comme base de données** : toutes les données (emploi du temps, cahier
  journal, fiches de prep, rituels) sont stockées sous forme de fichiers JSON
  dans **votre propre dépôt GitHub**, via l'API REST GitHub (`contents`).
- **Cache local** : un cache IndexedDB assure une lecture/écriture instantanée
  côté interface ; les écritures sont synchronisées vers GitHub en arrière-plan
  avec un léger anti-rebond, sans jamais bloquer la saisie.

## Démarrage

```bash
npm install
npm run dev
```

Au premier lancement, l'application demande :

1. Un **token GitHub fine-grained** (Settings → Developer settings → Fine-grained
   tokens) avec un accès en lecture/écriture au contenu du dépôt choisi.
2. Le nom du **dépôt** (`utilisateur/nom-du-depot`), idéalement privé.

Le token est conservé uniquement dans le `localStorage` de votre navigateur.

## Structure des données dans le dépôt

```
data/
  config/
    emploi-du-temps.json   # matières + créneaux récurrents
    templates.json         # journées types réutilisables
  cahier-journal.json      # toutes les journées (séances, bilans, notes)
  rituels.json             # rituels quotidiens et réglages
  fiches-prep/
    index.json             # index des fiches (liste, titres, dates)
    <id>.json              # une fiche de préparation par fichier
```

## Déploiement sur GitHub Pages

Le workflow `.github/workflows/deploy.yml` construit et déploie automatiquement
le site sur GitHub Pages à chaque push sur `main`.

Dans les réglages du dépôt (Settings → Pages), choisissez la source
**GitHub Actions**.

## Stack technique

- React + Vite + TypeScript
- Tailwind CSS v4
- Zustand (état applicatif)
- TipTap (éditeur riche pour les fiches de prep)
- Lucide React (icônes)
- react-router-dom (HashRouter, compatible hébergement statique)
- idb (cache IndexedDB)
