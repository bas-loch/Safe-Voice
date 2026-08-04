# Photos — Café Achiri

Toutes les photos vivent dans `public/images/` et nulle part ailleurs. Le composant `src/components/Photo.astro` charge le fichier attendu s'il existe ; sinon, il affiche un bloc neutre avec le nom du fichier manquant en clair. **Aucune image de banque, générée par IA ou d'un autre établissement n'est jamais utilisée en remplacement.**

Plafond du site : **8 photos maximum**. 6 sont utilisées actuellement, 1 est prévue mais pas encore fournie (voir statut ci-dessous).

## État actuel

| Fichier | Statut | Emplacement(s) | Format | Ratio | Contenu |
|---|---|---|---|---|---|
| `hero-terrasse.webp` | ✅ Fournie | Hero (pleine largeur) | WebP | 4:3 | Terrasse du café en soirée, adossée aux remparts de la kasbah |
| `exterieur-facade.webp` | ✅ Fournie | "Le café" + Galerie | WebP | 3:4 | Terrasse extérieure en journée, vue sur la rue |
| `interieur-salle.webp` | ✅ Fournie | Galerie | WebP | 3:4 | Salle intérieure, plafond en canisses, banquettes |
| `galerie-01.webp` | ✅ Fournie | Galerie | WebP | 3:4 | Coin intérieur, présentoir de fruits/jus |
| `galerie-02.webp` | ✅ Fournie | Galerie | WebP | 3:4 | Pâtisseries tunisiennes et thé, gros plan table |
| `galerie-03.webp` | ✅ Fournie | Galerie + "Ce qu'on y boit" | WebP | 3:4 | Thé versé sur la terrasse, fin de journée |
| `detail-cafe-turc.webp` | ❌ Manquante | "Ce qu'on y boit" | WebP | 3:4 (ratio recommandé) | Un café turc/direct servi, gros plan — aucune des photos reçues ne montrait clairement ce plan, le site affiche donc le bloc "photo manquante" en attendant |

Vérifiez l'état à tout moment avec :

```
npm run check:images
```

## Pour ajouter la photo manquante (ou en remplacer une)

1. Prenez ou récupérez une photo réelle du café (prise sur place, page Facebook, fiche Google).
2. Recadrez/exportez-la en **WebP**, environ 600 à 900 px de large (les fichiers actuels font 560–900 px de large pour rester légers — voir "Poids" ci-dessous).
3. Nommez le fichier **exactement** comme dans le tableau ci-dessus (respect strict de la casse et des tirets).
4. Déposez-le dans `public/images/`.
5. Lancez `npm run check:images` pour confirmer qu'il est bien détecté, puis `npm run build`.

Aucune ligne de code à toucher : le composant `<Photo>` détecte automatiquement le fichier.

## Recommandations pour de futures photos (qualité)

Les photos actuellement fournies sont des exports de téléphone à ~720 px de large : suffisant pour le web, mais toute nouvelle photo destinée au hero gagnera à être fournie en plus haute résolution (1600 px de large ou plus) pour rester nette même sur grand écran — le site la redimensionnera automatiquement à la compression.

## Poids

Le poids total des 6 photos actuelles est d'environ 255 Ko (compressées en WebP, qualité 62–76 selon l'usage), pour rester sous le budget de 500 Ko de poids total de la page d'accueil (voir critère d'acceptation). Si vous ajoutez ou remplacez une photo, vérifiez que le fichier WebP ne dépasse pas ~80 Ko pour une vignette de galerie, ~100 Ko pour le hero.
