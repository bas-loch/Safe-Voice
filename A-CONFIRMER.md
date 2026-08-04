# À confirmer

Ce fichier liste tout ce qui n'est **pas** une donnée vérifiée dans le brief d'origine. Rien de ce qui suit n'a été inventé : le site est écrit pour fonctionner sans ces informations, et les marqueurs `[À CONFIRMER]` correspondants sont visibles dans le code (recherchez `[À CONFIRMER]` ou `À CONFIRMER` dans `src/`).

## Coordonnées

| Donnée | Statut | Où c'est utilisé |
|---|---|---|
| Numéro de téléphone | Inconnu | Bouton "Appeler" (hero + barre mobile) : actuellement désactivé, affiche "Numéro à confirmer". Dès que vous avez le numéro, ajoutez-le dans `src/data/cafe.json` → `telephone` (format `+216XXXXXXXX`), le bouton s'activera automatiquement. |
| Adresse e-mail | Inconnue | Mentions légales |

## Horaires

| Donnée | Statut |
|---|---|
| Heure d'ouverture | Confirmée : 5h30 |
| Heure de fermeture | Inconnue |
| Jours d'ouverture (tous les jours ? fermeture hebdomadaire ?) | Inconnus |

Conséquence : le site n'affiche pas de badge "ouvert / fermé" en temps réel (cela nécessiterait de connaître l'heure de fermeture et les jours d'ouverture). Le bandeau affiche "Ouvert dès 5h30" (fait vérifié) et "Horaires précis à confirmer". Une fois les horaires complets connus, on pourra ajouter un vrai statut dynamique.

## Établissement

- Année de création / ancienneté : inconnue — aucune mention d'histoire n'a été écrite sur le site.
- Nom du patron / gérant : inconnu.
- Wifi : inconnu.
- Terrasse couverte ou non : inconnu (les photos fournies montrent une terrasse extérieure et une salle intérieure, mais rien ne permet de confirmer une couverture fixe).
- Chicha : inconnu.
- Petit-déjeuner servi : inconnu.
- Paiement par carte : inconnu (le ticket moyen de 1 à 10 DT suggère un fonctionnement probablement en espèces, mais ce n'est pas vérifié — non mentionné sur le site).

## Carte et prix

Tous les prix de `src/data/carte.json` sont marqués "Prix à confirmer", à une exception : le café direct affiche "≈ 2,2 DT (indicatif, à vérifier)", car ce chiffre vient d'un avis client réel — traité explicitement comme indicatif, pas comme un prix officiel.

Les 6 boissons listées (café direct, café turc, capucin, express, thé aux pignons, jus) sont des boissons standards de café tunisien, pas une carte confirmée du Café Achiri. À valider ou à corriger dans `src/data/carte.json`.

## Photos

- `detail-cafe-turc.webp` : aucune photo fournie ne montrait clairement un café turc/direct en gros plan. La section "Ce qu'on y boit" affiche donc le bloc "photo manquante" prévu par le protocole, plutôt que de forcer une photo qui ne correspond pas. Voir `IMAGES-A-FOURNIR.md`.
- Une photo supplémentaire fournie (vue ancienne, style carte postale, d'un fort/kasbah en bord de mer) n'a pas été utilisée sur le site : son lien avec le Café Achiri n'est pas confirmé, et le brief interdit toute fausse histoire ou photo dont l'origine n'est pas certaine. Si cette photo est bien liée au café (ancienne façade, par exemple), dites-le et elle pourra être intégrée avec la légende appropriée.
- La photo utilisée en thé (`galerie-03.webp`, section "Ce qu'on y boit") montre un service de thé versé, mais la présence de pignons n'est pas clairement visible sur la photo : la légende reste donc volontairement générique ("thé versé sur la terrasse") plutôt que d'affirmer "thé aux pignons".

## Légal / administratif

- Raison sociale exacte, forme juridique, matricule fiscal : inconnus (page Mentions légales).
- Ces informations sont nécessaires pour une mention légale complète en Tunisie ; à fournir par le patron.

## Technique

- `astro.config.mjs` utilise `https://cafe-achiri.netlify.app` comme URL de site (nécessaire pour générer les liens canoniques, hreflang, sitemap et Open Graph). **À remplacer par la vraie URL Netlify une fois le site déployé** (fichier `astro.config.mjs`, propriété `site`).
- Coordonnées GPS précises (latitude/longitude) : non incluses dans le JSON-LD, faute de coordonnées vérifiées. L'adresse texte suffit pour le référencement local ; les coordonnées pourront être ajoutées plus tard si besoin.
