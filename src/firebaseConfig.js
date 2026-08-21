// ─────────────────────────────────────────────────────────────────────────
// Firebase project keys.
// Paste the config object from Firebase Console → Project settings →
// General → "Your apps" → SDK setup and configuration.
// This file is intentionally the single place that holds your Firebase
// keys, as requested. It is listed in .gitignore-example.txt so you don't
// accidentally commit it — copy this file, fill it in, and keep it local.
// ─────────────────────────────────────────────────────────────────────────

export const firebaseConfig = {
  apiKey: "AIzaSyCikvnyCsIgs01fs_RxWHf1uuwglihaCiU",
  authDomain: "auto-media-8d23e.firebaseapp.com",
  projectId: "auto-media-8d23e",
  storageBucket: "auto-media-8d23e.firebasestorage.app",
  messagingSenderId: "976426695371",
  appId: "1:976426695371:web:1345035c77ba8b85fc394e",
};

// Optional: a Google Cloud API key with the "Google Sheets API" enabled.
// Used only to read the header row of a public/shared sheet for column
// mapping in Phase 1. Keep this restricted (HTTP referrer + API scope)
// in Google Cloud Console → Credentials.
export const googleSheetsApiKey = "AIzaSyCikvnyCsIgs01fs_RxWHf1uuwglihaCiU";
