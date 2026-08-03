/**
 * Noms de fichiers actuellement remplis par des photos temporaires (photos
 * stock trouvées en ligne, pas des photos d'Il Paradiso) en attendant les
 * vraies photos du restaurant. Dès qu'un vrai fichier `<nom>.webp`/`<nom>.jpg`
 * remplace la photo temporaire dans public/images/, retirer son nom de cette
 * liste pour que le badge "Photo temporaire" disparaisse.
 */
export const TEMP_PLACEHOLDER_PHOTOS = new Set([
  "hero-terrasse",
  "exterieur-facade",
  "plat-loup-grille",
  "plat-spaghetti-vongole",
  "plat-frutti-di-mare",
  "plat-frittura-mista",
  "salle-interieur-01",
  "terrasse-ambiance",
  "galerie-01",
  "galerie-02",
  "galerie-03",
  "galerie-04",
]);
