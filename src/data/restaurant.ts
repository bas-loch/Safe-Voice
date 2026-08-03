/**
 * Données factuelles vérifiées uniquement. Ne rien ajouter ici sans confirmation
 * du restaurant — voir A-CONFIRMER.md pour ce qui manque encore.
 */
export const restaurant = {
  name: "Il Paradiso",
  telephone: "+216 51 224 035",
  telephoneHref: "tel:+21651224035",
  whatsappNumber: "21651224035",
  address: {
    street: "Rue des Jasmins",
    postalCode: "8050",
    city: "Hammamet",
    country: "Tunisie",
    countryCode: "TN",
  },
  plusCode: "9JW7+6RF Hammamet",
  googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Il+Paradiso+Hammamet&query_place_id=",
  googleMapsDirectionsUrl: "https://www.google.com/maps/dir/?api=1&destination=Il+Paradiso+Hammamet+9JW7%2B6RF",
  googleReviewsUrl: "https://www.google.com/maps/search/?api=1&query=Il+Paradiso+Hammamet",
  rating: {
    value: 4.4,
    count: 95,
  },
  closingTime: "23:30",
  priceRange: {
    min: 30,
    max: 40,
    currency: "DT",
  },
  cuisine: ["Italienne", "Fruits de mer", "Méditerranéenne"],
  geo: {
    // [À CONFIRMER] coordonnées GPS précises à extraire de la fiche Google Maps
    latitude: null,
    longitude: null,
  },
} as const;
