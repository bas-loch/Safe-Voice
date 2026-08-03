# Notes SEO — Il Paradiso

## Ce qui a été fait sur le site

- **JSON-LD `Restaurant`** sur chaque page (`src/components/RestaurantSchema.astro`) avec uniquement des données réelles : nom, adresse structurée, téléphone, note Google (4,4/5, 95 avis), gamme de prix, cuisines, lien vers la carte, lien vers la fiche Google (`sameAs`).
  - `openingHoursSpecification` et `geo` sont **volontairement absents** : seule la fermeture (23h30) est confirmée, pas les horaires d'ouverture jour par jour ni les coordonnées GPS précises. Publier un JSON-LD avec des horaires inventés serait plus nuisible que ne pas le publier (Google peut afficher "fermé" à tort). À ajouter dès que les horaires sont confirmés — voir `A-CONFIRMER.md`.
- **Titres et meta descriptions** optimisés par langue autour des requêtes cibles : *restaurant poisson Hammamet*, *restaurant italien Hammamet médina*, *où manger près du fort de Hammamet*.
- **H1 unique** par page, hiérarchie de titres propre (H1 > H2 > H3), aucun saut de niveau.
- **`alt` descriptif** en français sur chaque photo (rédigés dans le composant qui appelle `<Photo>`, jamais vides ni génériques).
- **`hreflang`** correct sur les trois langues + `x-default` vers le français, `rel=canonical` sur chaque page.
- **`sitemap.xml`** généré au build (`src/pages/sitemap.xml.ts`) et **`robots.txt`** pointant dessus.
- **Open Graph + Twitter Card** avec une image réelle (`hero-terrasse.jpg`, une fois fournie).
- Site 100% statique, pas de JavaScript bloquant, HTML sémantique (`<main>`, `<nav>`, `<address>`, `<dl>`).

## Ce que le restaurant doit faire de son côté

1. **Compléter la fiche Google Business Profile** : horaires détaillés jour par jour, photos supplémentaires, catégorie précise (restaurant italien + fruits de mer), attributs (terrasse, réservation, etc.).
2. **Répondre aux avis Google**, notamment aux avis mentionnant l'accueil ou la pizza — la réactivité du propriétaire est un signal de confiance fort pour Google et pour les visiteurs.
3. **Publier des photos récentes** sur la fiche Google (Google favorise les fiches actives avec du contenu frais).
4. **Créer une page Facebook/Instagram officielle** (aucune n'a été trouvée à ce jour) et y renvoyer vers le site — des profils sociaux actifs renforcent la crédibilité locale et donnent des liens supplémentaires vers le site.
5. **Vérifier la cohérence NAP** (Nom, Adresse, Téléphone) partout où le restaurant apparaît en ligne (annuaires, TripAdvisor, etc.) — la fiche doit toujours afficher exactement les mêmes coordonnées que le site.
6. **Confirmer les données listées dans `A-CONFIRMER.md`** pour compléter le JSON-LD (horaires, coordonnées GPS) et améliorer encore le référencement local.
7. **Demander des avis** aux clients satisfaits : passer de 95 à plusieurs centaines d'avis, avec un score maintenu ou amélioré, est le levier n°1 pour grimper dans le classement local face aux 371 restaurants de Hammamet.
