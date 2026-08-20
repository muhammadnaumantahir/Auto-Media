# Auto Media - Backend

Node.js + Express API. No database — a master Google Sheet ("Users" tab)
stores accounts, and each user's own Google Sheet stores their videos and
posting status.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` and fill in every value.
3. **Create the Google service account** (one-time):
   - Go to https://console.cloud.google.com/ → create/select a project.
   - Enable the "Google Sheets API".
   - Create a Service Account → create a JSON key → download it.
   - Copy `client_email` into `GOOGLE_SERVICE_ACCOUNT_EMAIL` and
     `private_key` into `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` in `.env`.
4. **Create the master Users sheet:**
   - Create a new blank Google Sheet.
   - Share it with the service account's email (found in the JSON key) as
     **Editor**.
   - Copy the sheet ID from its URL into `MASTER_SHEET_ID`.
   - The app creates a "Users" tab with the right headers automatically on
     first run.
5. **Set up Google OAuth login** (for the "Login with Google" button):
   - In the same Cloud project, go to APIs & Services → Credentials →
     Create Credentials → OAuth Client ID → Web application.
   - Add `http://localhost:5000/api/auth/google/callback` as an authorized
     redirect URI.
   - Copy the client ID/secret into `.env`.
6. `npm run dev`

## Note on each user's own video sheet

When a user connects their video sheet in the dashboard, they must first
share that sheet with the same service account email as **Editor** —
otherwise the backend can't read or write it. The UI explains this step.

## Endpoints (Phase 1)

```
POST /api/auth/register        { email, password, firstName, lastName }
POST /api/auth/login           { email, password }
GET  /api/auth/me              (requires Bearer token)
GET  /api/auth/google          redirects to Google's consent screen
GET  /api/auth/google/callback Google redirects back here

POST /api/sheets/preview       { sheetUrl } -> { headers } for column mapping UI
POST /api/sheets/connect       { sheetUrl, columnMapping }
POST /api/sheets/disconnect

GET  /api/videos               list videos read live from the user's sheet
```
