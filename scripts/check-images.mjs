import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const imagesDir = path.join(__dirname, "..", "public", "images");

// Liste exacte du manifeste — voir IMAGES-A-FOURNIR.md. Toutes obligatoires.
const required = [
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
];

// Doit rester synchronisé avec src/data/tempIllustrations.ts
const tempIllustrations = new Set([
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

let missingCount = 0;
let tempCount = 0;

console.log(`Vérification des photos dans ${path.relative(process.cwd(), imagesDir)}\n`);

for (const name of required) {
  const hasWebp = existsSync(path.join(imagesDir, `${name}.webp`));
  const hasJpg = existsSync(path.join(imagesDir, `${name}.jpg`));
  const isTemp = tempIllustrations.has(name);

  if ((hasWebp && hasJpg) && isTemp) {
    console.log(`  TEMP  ${name} — illustration temporaire, à remplacer par la vraie photo`);
    tempCount++;
  } else if (hasWebp && hasJpg) {
    console.log(`  OK    ${name} (.webp + .jpg)`);
  } else if (hasWebp || hasJpg) {
    console.log(`  WARN  ${name} — ${hasWebp ? ".jpg manquant" : ".webp manquant"}`);
  } else {
    console.log(`  MANQUANT  ${name}.webp / ${name}.jpg`);
    missingCount++;
  }
}

console.log(`\n${required.length - missingCount}/${required.length} photos présentes, dont ${tempCount} illustration(s) temporaire(s) encore à remplacer.`);

if (missingCount > 0) {
  console.log(`\n${missingCount} photo(s) manquante(s). Voir IMAGES-A-FOURNIR.md.`);
  process.exit(1);
}

if (tempCount > 0) {
  console.log(`Rappel : ${tempCount} illustration(s) temporaire(s) à remplacer avant de présenter le site au restaurant.`);
}
