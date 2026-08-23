# Auto-Media

A local multi-platform video posting workspace. A React dashboard for setup
(users, sheet mapping, platform credentials) plus a local Node server that
does the actual work: reads your Google Sheet, downloads or locates each
video, posts it, and writes the result back into the sheet.

## Run it

Requires Node 22+ (the Reddit poster uses the built-in `WebSocket`
client). Two processes, both on your own machine:

```bash
npm install
npm run dev      # the dashboard — http://localhost:5173
npm run server   # the posting engine — http://localhost:8787
```

Both need to be running for posting to work — the dashboard just calls the
server's API.

## One-time setup

1. **Firebase** (for the dashboard's own data): put your web config in
   `src/firebaseConfig.js` (see the comments in that file).
2. **Google service account** (so the server can read *and write* your
   sheet): create one in Google Cloud Console, enable the Sheets API, and
   copy `server/.env.example` to `server/.env`, filling in the service
   account's email + private key (or point `GOOGLE_SERVICE_ACCOUNT_KEY_FILE`
   at the downloaded JSON key).
3. **Share every Google Sheet you connect** with that service account's
   email as Editor — the server can't write "posted" back into a sheet it
   only has read access to.

## Workflow

1. Add a user.
2. On the Sheet page: paste the sheet URL + tab name, optionally set a
   local video folder, read the columns, map Video/Title/Status/Platforms
   (etc.) to your sheet's actual column names.
3. On Connectors: pick which platforms this user posts to, and enter
   credentials. YouTube needs its Client ID/Secret entered once (shared by
   every user) plus each user's own refresh token + channel ID.
4. On Dashboard: pick a batch size (1 / 5 / 10 / all) and click "Post ready
   video(s) now."

## How posting actually works

For each row where the mapped status column reads exactly `ready`, one at
a time:

1. Resolve the video — a direct URL, a Google Drive share link, or (if no
   URL) a filename matched inside the sheet's configured local video
   folder, any extension.
2. Post it to every platform listed in that row's platforms column
   (comma-separated) that the user has connected.
3. Record each platform's outcome in `server/data/results.json`, kept
   separate from the sheet so the sheet only ever shows one overall status.
4. Write that overall status (`posted`, or `failed: <platform>`) back into
   the sheet — this is what stops the same video from being posted again
   next run.
5. Move to the next ready row.

YouTube, Telegram, Discord, Facebook (Pages), LinkedIn, Pinterest,
Reddit, and X actually post right now. Other platforms show up in
results as "not built yet" rather than silently pretending to succeed.

- **Telegram**: needs a bot token (from @BotFather) + a chat ID. No app
  review, works immediately.
- **Discord**: needs a channel webhook URL. No app/bot needed. Note
  Discord's own attachment limit (8MB, 25MB on a boosted server) — larger
  videos will fail with Discord's real error.
- **Facebook**: needs a Page ID + a long-lived Page access token. Works
  without App Review as long as you're an admin/developer/tester on the
  Facebook app used to generate the token.
- **LinkedIn**: needs an access token (w_member_social scope) + your
  author URN (`urn:li:person:...`). Getting that token still requires
  creating a LinkedIn app and completing its OAuth flow once — this app
  takes the resulting token pasted in, the same way Facebook's card does,
  rather than doing the OAuth dance itself.
- **Pinterest**: needs an access token (pins:write scope, works
  immediately under "Trial Access" — no review wait) + a board ID. One of
  the few non-YouTube platforms that also accepts your local video
  folder, not just URLs — Pinterest takes a direct upload rather than
  fetching from a link.
- **Reddit**: needs a Reddit "script" app's client ID/secret plus the
  posting account's own username/password (no interactive OAuth
  redirect), and a subreddit. Reddit's own API requires a poster/
  thumbnail image on every video post — make sure the sheet's thumbnail
  column is mapped to a real image URL, or Reddit rejects the post.
  Uses Node's built-in WebSocket client to wait for Reddit's processing
  confirmation before returning the final post link.
- **X**: needs an API key/secret and an access token/secret (all four,
  generated for your own account under "Keys and tokens" — make sure the
  app has Read+Write access, not Read-only). The only platform here using
  OAuth 1.0a request signing (HMAC-SHA1) instead of a bearer token; this
  app signs each request itself. Uploads in 4MB chunks and polls for
  processing before posting the tweet.

## Data storage

The dashboard's own data (users, sheet mappings, connector credentials,
platform selections) lives in the browser's local storage
(`automedia_data_v1`). Posting results live in `server/data/results.json`
on disk. Clearing browser site data removes the former — use the "Sync
now" / backup export in the app for a copy.

## Security note

Connector credentials are stored in plaintext (browser local storage on
the dashboard side, a local JSON file on the server side). That's an
accepted tradeoff for a single-operator local tool — don't expose either
process to the open internet as-is.

## Extending to another platform

Add a poster function alongside `postRowToYoutube` in `server/run.mjs`
and register it in the `POSTERS` map there. The setup guide for each
platform lives in `src/lib/guides.js`.
