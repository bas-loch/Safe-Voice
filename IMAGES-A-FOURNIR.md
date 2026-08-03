# Photos à fournir — Il Paradiso

Toutes les photos vivent dans `public/images/`. La règle de base du projet reste : aucune photo de banque d'images ni d'un autre restaurant sur le site final — voir la règle §3 du brief.

## État actuel : photos temporaires (stock, pas Il Paradiso)

Les 12 emplacements sont pour l'instant remplis par des **photos stock trouvées en ligne**, à la demande explicite du client, le temps d'avoir les vraies photos du restaurant. Ce ne sont **pas** des photos d'Il Paradiso. Chacune porte un badge visible "Photo temporaire" sur le site pour qu'on ne les confonde jamais avec les vraies.

**Avant toute présentation au restaurant ou mise en ligne définitive**, chaque photo temporaire doit être remplacée par la vraie photo correspondante :
1. Déposer `<nom>.webp` et `<nom>.jpg` dans `public/images/` (voir tableau ci-dessous), en écrasant les fichiers temporaires.
2. Retirer le nom correspondant de `src/data/tempPlaceholders.ts` (et de la liste dupliquée dans `scripts/check-images.mjs`) pour faire disparaître le badge.

`npm run check:images` indique à tout moment ce qui manque encore et ce qui est encore une photo temporaire (`TEMP`).

Pour chaque emplacement, fournir **deux fichiers** : un `.webp` (format principal) et un `.jpg` de secours (même image, même nom de base). Si un fichier venait à manquer complètement (aucune photo du tout), la page afficherait un bloc gris avec le nom en clair — jamais une autre image à sa place.

## Manifeste (12 photos maximum)

| # | Nom de fichier (base) | Formats | Dimensions min. | Ratio | Emplacement | Contenu attendu |
|---|---|---|---|---|---|---|
| 1 | `hero-terrasse` | .webp + .jpg | 2000×1200 px | 16:9 | Hero (pleine largeur) | Terrasse ou façade, lumière naturelle, plan large. Sert aussi d'image Open Graph (partage sur réseaux sociaux). |
| 2 | `exterieur-facade` | .webp + .jpg | 1600×1200 px | 4:3 | Section "Nous trouver" + Galerie | Façade / entrée du restaurant, reconnaissable depuis la rue. |
| 3 | `plat-loup-grille` | .webp + .jpg | 1200×900 px | 4:3 | Section "Les signatures" | Loup grillé, plan serré, assiette entière visible. |
| 4 | `plat-spaghetti-vongole` | .webp + .jpg | 1200×900 px | 4:3 | Section "Les signatures" | Spaghetti alle vongole, plan serré. |
| 5 | `plat-frutti-di-mare` | .webp + .jpg | 1200×900 px | 4:3 | Section "Les signatures" | Spaghetti ai frutti di mare, plan serré. |
| 6 | `plat-frittura-mista` | .webp + .jpg | 1200×900 px | 4:3 | Section "Les signatures" | Frittura mista di mare, plan serré. |
| 7 | `salle-interieur-01` | .webp + .jpg | 1600×1067 px | 3:2 | Galerie | Salle intérieure, ambiance générale. |
| 8 | `terrasse-ambiance` | .webp + .jpg | 1600×1067 px | 3:2 | Galerie | Terrasse en service, ambiance chaleureuse. |
| 9 | `galerie-01` | .webp + .jpg | 1200×1200 px | 1:1 | Galerie | Détail (table dressée, four à pizza, cuisine…). |
| 10 | `galerie-02` | .webp + .jpg | 1200×1200 px | 1:1 | Galerie | Détail (produits frais, comptoir poissons…). |
| 11 | `galerie-03` | .webp + .jpg | 1200×1200 px | 1:1 | Galerie | Ambiance soirée / clientèle (si autorisation obtenue). |
| 12 | `galerie-04` | .webp + .jpg | 1200×1200 px | 1:1 | Galerie | Vue depuis la terrasse (rue, médina, mer selon disponibilité). |

## Notes

- La section Galerie affiche 7 photos (`terrasse-ambiance`, `salle-interieur-01`, `exterieur-facade`, `galerie-01` à `galerie-04`) en réutilisant des fichiers déjà comptés ailleurs : pas de 13e fichier nécessaire.
- Pas de prix, pas de logo à intégrer dans les photos elles-mêmes : le site ajoute son propre habillage (dégradés, cadres).
- Convertir en WebP : n'importe quel outil (Squoosh, `cwebp`, export Photoshop/Lightroom) fait l'affaire. Le `.jpg` est un simple export classique de la même photo, en qualité 80-85 suffit.
- Ne pas recadrer serré à l'avance : les photos sont recadrées automatiquement dans les grilles (`object-fit: cover`). Fournir l'image la plus large et la plus nette possible, au ratio le plus proche indiqué.
