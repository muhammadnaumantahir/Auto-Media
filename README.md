# Relay — Sheet to Social (Phase 1)

A web app that connects a user's Google Sheet (video name / link / status columns) to a set
of social platform connectors, so a future posting job can read "ready" rows and publish them
out to YouTube, Instagram, Facebook, TikTok, and Snapchat.

**Phase 1 scope** (this build):
1. Add / manage users
2. Connect a Google Sheet and map its columns
3. Save each platform's API keys per user
4. A dashboard summarizing what's connected

All data is stored in Firebase Firestore. Firebase project keys live in one file:
`src/firebaseConfig.js`.

Actually *posting* videos out to each platform is Phase 2 — it needs a server (Firebase Cloud
Functions is the natural fit) because platform OAuth flows and long-lived tokens shouldn't be
handled fully client-side. Phase 1 gets everything set up and stored so that job has what it
needs.

---

## 1. Create the Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) → **Add project**.
2. Once created, go to **Build → Firestore Database → Create database** → start in **test mode**
   (good enough for local dev; see the security note at the bottom).
3. Go to **Project settings → General → Your apps → Add app → Web (`</>`)**. Register the app —
   you don't need Firebase Hosting for this.
4. Copy the `firebaseConfig` object it gives you.

## 2. Add your keys to the project

Open `src/firebaseConfig.js` and paste in the values from step 1:

```js
export const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "...",
};
```

This is the one file that holds your Firebase keys, as requested — nothing else in the project
needs editing to get it running. It's listed in `.gitignore` once you fill it in, so it's safe
from an accidental commit.

### Optional: Google Sheets read access

To let the app read a sheet's header row for column-mapping (Step 02), also fill in:

```js
export const googleSheetsApiKey = "...";
```

Get one at [console.cloud.google.com](https://console.cloud.google.com):
**APIs & Services → Library → enable "Google Sheets API"**, then
**APIs & Services → Credentials → Create credentials → API key**. Restrict it to the Sheets API.

The sheet itself needs to be shared as **"Anyone with the link – Viewer"** for this API-key-only
read to work (no OAuth needed for Phase 1). If you'd rather keep sheets private, that's a Phase 2
change (OAuth + a server-side call).

## 3. Install and run

Requires [Node.js](https://nodejs.org) 18+.

```bash
cd social-poster-app
npm install
npm run dev
```

Open the URL it prints (usually `http://localhost:5173`).

## 4. Using it

1. **Users** — add a name + email. This becomes the active user for the rest of the flow.
2. **Sheet** — paste the sheet's URL (or just its ID) and its tab name, click **Read column
   headers**, then match `Video name`, `Video link`, and `Status` to the sheet's actual columns.
   Your sheet just needs those three ideas as headers in row 1 — call them whatever you like.
3. **Connectors** — paste each platform's credentials. What's asked for per platform:
   - **YouTube** — OAuth client ID/secret + refresh token (from a Google Cloud OAuth app with
     the YouTube Data API v3 enabled) + channel ID
   - **Instagram** — a Graph API access token + the IG business account ID
   - **Facebook** — a Page access token + Page ID
   - **TikTok** — client key/secret + access token (Content Posting API)
   - **Snapchat** — client ID/secret + access token (Marketing/Creative API)

   None of these need to be filled in to try the rest of the app — connect whichever platforms
   you're ready for.
4. **Dashboard** — a summary of the sheet mapping and which platforms are connected for the
   active user, plus the pipeline visual.

Switch users any time from the dropdown at the bottom of the sidebar — each one has their own
sheet connection and connector keys.

## Firestore data shape

```
users/{userId}
  name, email, createdAt, sheetConnected

users/{userId}/config/sheet
  sheetUrl, sheetId, tabName, headers[], mapping { videoName, videoLink, status }

users/{userId}/connectors/{platform}
  platform, status, ...credential fields
```

## Security note before this goes anywhere beyond your own machine

`firestore.rules` in this project is wide open (`allow read, write: if true`) so Phase 1 works
without setting up Firebase Auth first. Before deploying this anywhere reachable by anyone but
you:

1. Add [Firebase Authentication](https://firebase.google.com/docs/auth) (email/password or
   Google sign-in).
2. Tighten `firestore.rules` to check `request.auth.uid` against the document being read/written.
3. Move long-lived platform tokens (YouTube refresh token, page tokens, etc.) behind a Cloud
   Function instead of writing them straight from the browser, so they're never exposed to
   client-side JS.

## Project structure

```
src/
  firebaseConfig.js     — your Firebase + Sheets API keys (edit this)
  firebase.js           — Firebase app/Firestore init
  lib/firestore.js       — all Firestore reads/writes
  context/AppContext.jsx — tracks the active user across pages
  components/            — Sidebar, PipelineHero (dashboard visual), PlatformCard
  pages/                 — Users, SheetSetup, Connectors, Dashboard
```
