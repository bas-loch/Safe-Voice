/*
  Configuration Firebase — Dar Beldi
  Remplace les valeurs ci-dessous par celles de ta console Firebase :
  https://console.firebase.google.com/ → ⚙️ Paramètres du projet → Tes applications → Config SDK

  Important : "databaseURL" doit pointer vers ta Realtime Database
  (Firebase Console → Realtime Database → l'URL affichée en haut, du type
  https://<project-id>-default-rtdb.<region>.firebasedatabase.app).

  Tant que apiKey vaut "VOTRE_FIREBASE_API_KEY", l'enregistrement Firebase
  est silencieusement désactivé : le site continue de fonctionner et
  d'envoyer vers WhatsApp normalement.
*/
export const firebaseConfig = {
  apiKey: "VOTRE_FIREBASE_API_KEY",
  authDomain: "VOTRE_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://VOTRE_PROJECT_ID-default-rtdb.firebaseio.com",
  projectId: "VOTRE_PROJECT_ID",
  storageBucket: "VOTRE_PROJECT_ID.appspot.com",
  messagingSenderId: "VOTRE_SENDER_ID",
  appId: "VOTRE_APP_ID",
};

export const FIREBASE_SDK_VERSION = "10.12.0";
