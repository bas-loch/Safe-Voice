import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const imagesDir = path.join(__dirname, '..', '..', 'public', 'images');

// Liste unique des photos attendues par le site. Voir IMAGES-A-FOURNIR.md.
const manifest = [
  { file: 'hero-terrasse.webp', required: true, usage: 'Hero (pleine largeur)' },
  { file: 'exterieur-facade.webp', required: true, usage: 'Section "Le café" + repère' },
  { file: 'interieur-salle.webp', required: true, usage: 'Section "Le café" + Galerie' },
  { file: 'galerie-01.webp', required: true, usage: 'Galerie' },
  { file: 'galerie-02.webp', required: true, usage: 'Galerie' },
  { file: 'galerie-03.webp', required: true, usage: 'Galerie + section "Ce qu\'on y boit"' },
  { file: 'detail-cafe-turc.webp', required: false, usage: 'Section "Ce qu\'on y boit" (optionnelle)' },
];

let hasMissingRequired = false;
const present = [];
const missing = [];

for (const entry of manifest) {
  const exists = fs.existsSync(path.join(imagesDir, entry.file));
  if (exists) {
    present.push(entry);
  } else {
    missing.push(entry);
    if (entry.required) hasMissingRequired = true;
  }
}

console.log('\nCafé Achiri — vérification des photos (public/images/)\n');

console.log(`Présentes (${present.length}) :`);
for (const entry of present) {
  console.log(`  ✓ ${entry.file}  —  ${entry.usage}`);
}

console.log(`\nManquantes (${missing.length}) :`);
if (missing.length === 0) {
  console.log('  (aucune)');
} else {
  for (const entry of missing) {
    const tag = entry.required ? 'OBLIGATOIRE' : 'optionnelle';
    console.log(`  ✗ ${entry.file}  —  ${entry.usage}  [${tag}]`);
  }
}

console.log('');

if (hasMissingRequired) {
  console.error('Erreur : au moins une photo obligatoire est manquante. Voir IMAGES-A-FOURNIR.md.');
  process.exit(1);
}

console.log('OK : toutes les photos obligatoires sont présentes.');
