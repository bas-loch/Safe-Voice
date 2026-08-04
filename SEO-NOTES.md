# Notes SEO — Café Achiri

## Pourquoi ce site change quelque chose (à montrer au patron)

Aujourd'hui, sur la fiche Google du Café Achiri, le champ "Site Web" pointe vers la page Facebook du café. Concrètement, cela veut dire que Café Achiri n'a **aucun site web au sens où Google le comprend** : Facebook est une plateforme fermée, mal indexée sur des recherches précises, et non conçue pour répondre à une requête comme *"café médina Hammamet"* ou *"où boire un café à Hammamet centre"*.

Résultat : quelqu'un qui sort de la médina et cherche un café sur Google ne tombera pas sur le Café Achiri à partir d'une recherche générique, même si l'établissement est à deux minutes à pied et très bien noté (4,3/5). Il ne sera visible que si le touriste ou l'habitant connaît déjà son nom.

Avec seulement 12 avis Google pour un café aussi fréquenté, il y a une marge de progression immédiate et gratuite : chaque avis supplémentaire renforce la fiche Google, et un vrai site (même simple comme celui-ci) donne à Google du contenu texte réel à indexer — adresse, horaires, ce qui est servi — là où Facebook n'offre presque rien d'exploitable pour une recherche locale.

Ce site corrige ce point précis : une page dédiée, avec les bonnes informations, les bons mots-clés locaux, et une structure que Google comprend.

---

## Partie 1 — Ce que le site fait déjà

- **Données structurées (JSON-LD `CafeOrCoffeeShop`)** : nom, adresse complète, note Google (4,3/5, 12 avis), fourchette de prix, heure d'ouverture, lien vers la page Facebook et la fiche Google — pour que Google comprenne immédiatement "c'est un café, voici où il est, voici sa note".
- **Titres et meta descriptions** par langue (FR/EN), construits autour des recherches locales visées : *café Hammamet médina*, *café traditionnel Hammamet*, *où boire un café à Hammamet centre*.
- **Un seul H1 par page**, hiérarchie de titres propre (H1 → H2), pas de titres décoratifs.
- **`alt` rédigés** sur chaque photo, décrivant réellement ce qu'elle montre (pas de mots-clés bourrés).
- **`hreflang` FR/EN** correct, pour que Google serve la bonne langue à la bonne audience.
- **`sitemap.xml`** généré automatiquement au build, **`robots.txt`** autorisant l'indexation.
- **URL canonique** sur chaque page, pour éviter les problèmes de contenu dupliqué FR/EN.
- **Image Open Graph réelle** (la photo du hero, pas une image générique) pour un aperçu correct quand le lien est partagé sur Facebook/WhatsApp.
- **Site rapide** (objectif Lighthouse mobile ≥ 95, JS quasi nul) : la vitesse de chargement est elle-même un facteur de classement Google, surtout sur mobile.

## Partie 2 — Ce que le café doit faire lui-même

Rien de ce qui suit ne peut être fait depuis le site : c'est une action du patron ou de quelqu'un sur place.

1. **Remplacer le lien Facebook par le vrai site** dans le champ "Site Web" de la fiche Google Business Profile. C'est le changement le plus important et le plus rapide.
2. **Compléter la fiche Google Business** : horaires précis (jours + heure de fermeture), téléphone, photos officielles ajoutées directement sur la fiche.
3. **Publier des photos régulièrement** sur la fiche Google (pas seulement sur Facebook) : les établissements avec des photos récentes et nombreuses remontent mieux dans les recherches locales et la carte Google.
4. **Répondre aux avis existants**, même brièvement (un simple remerciement) : Google valorise les fiches actives où le gérant répond.
5. **Demander des avis aux habitués** : avec 12 avis seulement pour un café aussi fréquenté, quelques dizaines d'avis supplémentaires changeraient nettement la visibilité et la crédibilité de la fiche. Le site inclut déjà un bouton discret "Laisser un avis" pour faciliter ça.
6. **Rester cohérent sur le nom et l'adresse** partout (Google, Facebook, site) : "Café Achiri", même orthographe, même adresse — les incohérences nuisent au référencement local (les moteurs recoupent ces informations entre elles).
