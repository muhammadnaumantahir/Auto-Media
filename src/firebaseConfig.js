// ─────────────────────────────────────────────────────────────────────────
// Firebase project keys.
// Paste the config object from Firebase Console → Project settings →
// General → "Your apps" → SDK setup and configuration.
// This file is intentionally the single place that holds your Firebase
// keys, as requested. It is listed in .gitignore-example.txt so you don't
// accidentally commit it — copy this file, fill it in, and keep it local.
// ─────────────────────────────────────────────────────────────────────────

export const firebaseConfig = {
  apiKey: "AIzaSyASFAUjjZc8VRhG2IQxtlkP8ODbdJ8vgJM",
  authDomain: "auto-media-a65e2.firebaseapp.com",
  projectId: "auto-media-a65e2",
  storageBucket: "auto-media-a65e2.firebasestorage.app",
  messagingSenderId: "304890643952",
  appId: "1:304890643952:web:9e1286809dd324cd858935",
};

// Optional: a Google Cloud API key with the "Google Sheets API" enabled.
// Used only to read the header row of a public/shared sheet for column
// mapping in Phase 1. Keep this restricted (HTTP referrer + API scope)
// in Google Cloud Console → Credentials.
export const googleSheetsApiKey = "YOUR_GOOGLE_SHEETS_API_KEY";
