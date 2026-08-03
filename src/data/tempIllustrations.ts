/**
 * Noms de fichiers actuellement remplis par des illustrations temporaires
 * (dessin vectoriel, pas une photo) en attendant les vraies photos du
 * restaurant. Dès qu'un vrai fichier `<nom>.webp`/`<nom>.jpg` remplace
 * l'illustration dans public/images/, retirer son nom de cette liste pour
 * que le badge "Illustration temporaire" disparaisse.
 */
export const TEMP_ILLUSTRATIONS = new Set([
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
