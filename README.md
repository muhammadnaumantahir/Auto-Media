# Auto-Media

A local-first multi-platform video publishing workspace. No Express server and no `/api` proxy are required.

## Run
```bash
npm install
npm run dev
```
Build with `npm run build`.

## Data storage
All application data is stored in one browser persistence record:
`automedia_data_v1`.
It contains users, sheet mappings, connector settings, queue items and preferences. Refreshing the app reloads this data immediately. Clearing browser site data will remove the local copy, so use the Firebase sync option for backup/cross-device use.

## Workflow
1. Create/select a user.
2. Add a Google Sheet URL and tab name.
3. Enable Google Sheets API and put the API key in `src/firebaseConfig.js`.
4. Share the sheet appropriately for the selected API-key approach, then read row-1 headers.
5. Map Video, Title, Description, Tags, Thumbnail, Schedule, Platforms and Status to any columns you use.
6. Select connectors and follow each connector's setup checklist.
7. Add/validate content in Queue and track Draft, Ready, Scheduled, Publishing, Published or Failed.

## Firebase / Google login
Google login is optional. Configure the Firebase web config in `src/firebaseConfig.js`, enable Google sign-in in Firebase Authentication and create Firestore as required by your project. Local storage remains the primary app store; Firebase is used for optional profile backup/sync.

## Connector setup model
Each Auto-Media user configures their own platform account and developer application. The app stores connector metadata locally and provides the workflow; real publishing requires that platform's approved OAuth/API access.

### YouTube
Create a Google Cloud project, enable YouTube Data API, configure the OAuth consent screen and client, then authorize the account used for uploads. The API's `videos.insert` upload flow can set metadata. New/unverified API projects may have uploaded videos restricted to private visibility until the required audit/verification conditions are met. citeturn0search5

### TikTok
Create a TikTok developer app, add Content Posting API, configure authorization and obtain the required publishing authorization. Direct posting uses `video.publish`; video can be transferred as a file or pulled from a verified URL/domain. TikTok returns a `publish_id` for status tracking, and unaudited clients can face private-only restrictions. citeturn0search0turn0search2

### Pinterest
Create a Pinterest developer account/app and follow the API app connection and review requirements before implementing Pin/video publishing. citeturn0search8

### Meta platforms: Facebook, Instagram, Threads
Create and configure the user's own Meta developer app, add the relevant product/permissions, configure redirect URLs and authorize the target Page/Instagram/Threads account. Keep scopes and publishing permissions platform-specific.

### LinkedIn, X, Snapchat, Bluesky, Reddit, Telegram, Discord, Google Business and Mastodon
Each connector requires the user's own developer/app credentials where applicable and an account with the relevant posting permission. Use the official developer portal for current scopes, approval and API availability.

## Security note
Do not publish client secrets, refresh tokens or long-lived access tokens in public source control. A browser-only app is useful for prototypes and guided configuration, but production OAuth secrets/token exchange should be handled by a secure trusted environment.

## Troubleshooting
- **Data disappeared:** check browser site data; local storage is browser/device-specific.
- **Google login fails:** verify Firebase config, authorized domains and Google provider.
- **Sheet headers fail:** verify sheet ID/tab, Sheets API key and sharing/API restrictions.
- **Connector cannot publish:** verify the platform's current scopes, app approval, account eligibility and OAuth token.

## Portable video downloading / YouTube Shorts
The browser must not fetch a YouTube page directly. YouTube does not expose the CORS headers required by a browser app, so the app now uses a portable video-source adapter:

- **Direct video / Google Drive:** still fetched from the browser as before.
- **YouTube:** sent to `/api/video` by default.
- **Local development:** run `npm run video-proxy` with `yt-dlp` installed, then set `VITE_VIDEO_PROXY_URL=http://localhost:8787/api/video` in `.env.local`.
- **Cloudflare Pages:** `functions/api/video.js` is deployed automatically. Set `VIDEO_RESOLVER_URL` (and optionally `VIDEO_RESOLVER_TOKEN`) in Cloudflare Pages environment variables. Cloudflare Workers cannot run a native `yt-dlp` process, so the Pages Function delegates YouTube extraction to your configured resolver service.
- **Other hosts:** set `VITE_VIDEO_PROXY_URL` to any compatible HTTPS endpoint. The React app does not contain a localhost-only URL.

The resolver contract is simple: `POST` JSON `{ "url": "<youtube-url>" }` and return either `{ "url": "<direct-video-url>" }` or the video bytes with a video content type.
