# Il Paradiso — site vitrine

Site vitrine du restaurant Il Paradiso (Hammamet, Tunisie). Astro + Tailwind CSS, 100% statique, trois langues (FR/IT/EN).

## Installation

```bash
npm install
```

## Développement

```bash
npm run dev
```

Ouvre `http://localhost:4321`.

## Build de production

```bash
npm run build
```

Génère le site statique dans `dist/`. `npm run build` lance aussi `astro check` (vérification des types) avant de compiler.

Pour prévisualiser le build localement :

```bash
npm run preview
```

## Vérifier les photos manquantes

```bash
npm run check:images
```

Liste les 12 photos attendues (voir `IMAGES-A-FOURNIR.md`), indique lesquelles sont présentes, et sort en erreur si une photo obligatoire manque.

## Déploiement Netlify

Le dépôt inclut `netlify.toml` (commande de build `npm run build`, dossier publié `dist/`, en-têtes de cache). Il suffit de connecter le dépôt à Netlify : aucune configuration manuelle supplémentaire n'est nécessaire, aucune variable d'environnement, aucune clé API.

## Où modifier les textes

Tous les textes du site sont centralisés dans trois fichiers, un par langue :

- `src/i18n/fr.json` (français, langue de référence)
- `src/i18n/it.json` (italien)
- `src/i18n/en.json` (anglais)

Aucun texte n'est écrit en dur dans les composants `.astro`. Pour changer une phrase, éditer la clé correspondante dans les trois fichiers (la structure est identique dans les trois).

Les données factuelles (adresse, téléphone, note Google, horaires…) sont centralisées séparément dans `src/data/restaurant.ts` — une seule source de vérité, partagée par toutes les langues.

La carte du restaurant vit dans `src/data/menu.json`, avec les noms/descriptions déjà traduits par plat (`name.fr`, `name.it`, `name.en`, etc.) et un champ `price` (`null` tant que le prix n'est pas confirmé).

## Où déposer les photos

Toutes les photos vont dans `public/images/`, au format `.webp` + `.jpg` de secours, avec les noms de fichiers exacts listés dans `IMAGES-A-FOURNIR.md`. Tant qu'une photo manque, le site affiche un bloc gris portant son nom en clair à la place — jamais une autre image.

Les 12 emplacements sont actuellement remplis par des **illustrations vectorielles temporaires** (pas des photos), marquées d'un badge "Illustration temporaire" visible sur le site. Voir `IMAGES-A-FOURNIR.md` pour la marche à suivre pour les remplacer par les vraies photos.

## Horaires d'ouverture

`src/data/openingHours.ts` contient une structure `schedule` prête à recevoir les horaires jour par jour, actuellement `null` (horaires non confirmés — seule la fermeture à 23h30 l'est). Une fois les horaires obtenus, remplir `schedule` selon le format documenté en commentaire dans le fichier ; le bandeau d'information et le JSON-LD `Restaurant` s'en serviront automatiquement.

## Stack technique

- [Astro](https://astro.build) (sortie statique)
- [Tailwind CSS v4](https://tailwindcss.com) (via `@tailwindcss/vite`)
- Polices auto-hébergées : [Fraunces](https://fonts.google.com/specimen/Fraunces) (titres) et [Inter](https://fonts.google.com/specimen/Inter) (texte), via les packages `@fontsource/*`
- Zéro JavaScript côté client hors nécessité réelle : révélation au scroll (`IntersectionObserver`) et lightbox de la galerie (élément natif `<dialog>`), sans dépendance externe
- Aucune dépendance payante, aucune clé API, aucun backend

## Autres documents utiles

- `IMAGES-A-FOURNIR.md` — manifeste photo complet
- `A-CONFIRMER.md` — données à valider auprès du restaurant
- `SEO-NOTES.md` — ce qui a été fait pour le SEO local et ce qu'il reste à faire côté restaurant
