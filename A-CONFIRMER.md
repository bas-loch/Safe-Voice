# Données à confirmer auprès du restaurant

Le site n'utilise que les données vérifiées listées dans le brief. Tout le reste est absent du site ou clairement marqué "à confirmer" — rien n'est inventé. Voici ce qu'il reste à obtenir auprès d'Il Paradiso pour compléter le site :

## Horaires

- **Horaires d'ouverture jour par jour** (heure d'ouverture, pas seulement la fermeture à 23h30 déjà connue).
- **Jour(s) de fermeture hebdomadaire**, s'il y en a.
- Impact : `src/data/openingHours.ts` a une structure `schedule` prête à remplir ; tant qu'elle est `null`, le site n'affiche pas de badge "Ouvert / Fermé" (voir le composant `StickyInfoBar.astro`). Le JSON-LD `Restaurant` n'a pas non plus d'`openingHoursSpecification` tant que ces horaires ne sont pas confirmés.

## Contact et identité légale

- **Adresse e-mail** du restaurant (aucune trouvée à ce jour).
- **Forme juridique**, numéro d'immatriculation (registre du commerce) et **responsable de la publication** du site, pour les mentions légales (`src/pages/mentions-legales.astro` et équivalents IT/EN).
- **Nom du chef ou du propriétaire** — non mentionné nulle part sur le site tant que non confirmé.
- **Année de création / d'ouverture** du restaurant — pas de "depuis XXXX" inventé.

## Carte et prix

- **Prix exacts des plats** — la carte (`src/data/menu.json`) est structurée et prête, mais tous les prix sont à `null` et affichés "à confirmer".
- **Carte complète** (antipasti, pizzas, desserts) — seuls les 4 plats signatures et les 2 pâtes citées dans les avis sont renseignés ; le reste est un exemple de structure marqué `[À CONFIRMER]`.

## Localisation

- **Coordonnées GPS précises** (latitude/longitude) de la fiche Google — utile pour un JSON-LD `geo` plus précis. Le site s'appuie pour l'instant sur le Plus Code (`9JW7+6RF Hammamet`) pour la carte intégrée et l'itinéraire, ce qui fonctionne mais un lien Google Maps avec `place_id` exact serait plus fiable.

## Services proposés (non affichés tant que non confirmés)

- Parking sur place ou à proximité.
- Acceptation des cartes bancaires.
- Service de boissons alcoolisées.
- Capacité de la salle / de la terrasse (nombre de couverts).

## Réseaux sociaux

- Aucune page Facebook ou Instagram officielle trouvée. Si le restaurant en crée une, l'ajouter au footer et au JSON-LD (`sameAs`).
