# Café Achiri — site vitrine

Site vitrine une page pour le Café Achiri, Hammamet. Astro + Tailwind, statique, sans backend, sans tracker, en français et en anglais.

## Installation

Prérequis : [Node.js](https://nodejs.org) 20 ou plus récent.

```bash
npm install
```

## Développement local

```bash
npm run dev
```

Le site est servi sur `http://localhost:4321`. Les modifications de texte, de données ou de style se rechargent automatiquement.

## Build de production

```bash
npm run build
```

Génère le site statique dans `dist/`. Cette commande doit se terminer sans erreur ni avertissement avant tout déploiement.

Pour prévisualiser le résultat du build :

```bash
npm run preview
```

## Vérifier les photos

```bash
npm run check:images
```

Liste les photos présentes et manquantes dans `public/images/`, et indique clairement lesquelles sont obligatoires. Voir `IMAGES-A-FOURNIR.md` pour le détail de chaque emplacement.

## Déploiement sur Netlify

1. Connectez ce dépôt à Netlify (ou utilisez `netlify deploy`).
2. Netlify utilise automatiquement la configuration de `netlify.toml` :
   - commande de build : `npm run build`
   - dossier publié : `dist`
3. Une fois le site déployé, notez l'URL Netlify réelle et mettez-la à jour dans `astro.config.mjs` (propriété `site`), puis relancez un build. Cette URL sert à générer les liens canoniques, le sitemap et les balises de partage — voir `A-CONFIRMER.md`.

Aucune variable d'environnement, aucune clé API, aucun compte tiers n'est nécessaire.

---

## Modifier le site sans toucher au code

Tout ce qui change souvent (textes, prix, photos) est regroupé dans quelques fichiers simples. Vous n'avez jamais besoin de toucher aux fichiers `.astro` pour ces changements-là.

### Changer un texte

Les textes du site sont dans deux fichiers, un par langue :

- `src/i18n/fr.json` — textes en français
- `src/i18n/en.json` — textes en anglais

Chaque fichier est une liste de `"clé": "texte affiché"`. Cherchez le texte à changer (par exemple `"tagline": "Ouvert dès 5h30, à deux pas de la médina."`), modifiez uniquement la partie après les deux-points, entre guillemets, en gardant les guillemets et la virgule. Sauvegardez, relancez `npm run build`.

### Changer un prix ou un élément de la carte

Tout est dans `src/data/carte.json`. Chaque boisson a la forme :

```json
{
  "id": "cafe-direct",
  "fr": "Café direct",
  "en": "Black coffee",
  "price": null
}
```

- `fr` / `en` : le nom affiché dans chaque langue.
- `price` : laissez `null` tant que le prix n'est pas confirmé (le site affiche alors "Prix à confirmer" / "Price to be confirmed"). Pour ajouter un prix, remplacez par exemple par `"2.500 DT"`.

Pour ajouter une nouvelle boisson, copiez un bloc existant entre `{` et `}`, changez les valeurs, et ajoutez une virgule après le bloc précédent.

### Changer une photo

Voir `IMAGES-A-FOURNIR.md` : chaque emplacement du site attend un fichier précis dans `public/images/` (par exemple `hero-terrasse.webp`). Pour remplacer une photo, déposez un nouveau fichier **avec exactement le même nom**. Pour ajouter la photo manquante (`detail-cafe-turc.webp`), suivez les instructions du même fichier. Vérifiez ensuite avec `npm run check:images`.

### Changer une donnée du café (adresse, téléphone, liens)

Tout est dans `src/data/cafe.json` : adresse, numéro de téléphone (actuellement vide, voir `A-CONFIRMER.md`), lien Facebook, liens Google Maps, note Google. Un seul endroit à modifier, répercuté partout sur le site automatiquement.

---

## Où sont les infos manquantes ?

Tout ce qui n'a pas pu être vérifié (téléphone, horaires précis, prix exacts, wifi, etc.) est listé dans `A-CONFIRMER.md`. Le site fonctionne volontairement sans ces données plutôt que de les inventer.

## Structure du projet

```
src/
  components/    composants réutilisables (photo, en-tête, barre mobile...)
  sections/      une section = un bloc de la page d'accueil
  layouts/       structure HTML commune (head, SEO, JSON-LD)
  pages/         routes du site (/, /en/, /mentions-legales, /en/mentions-legales)
  i18n/          tous les textes, fr.json et en.json
  data/          carte.json (boissons) et cafe.json (coordonnées, liens)
  styles/        feuille de style globale (Tailwind + polices)
  scripts/       check-images.mjs
public/
  images/        toutes les photos du site, rien d'autre
```
