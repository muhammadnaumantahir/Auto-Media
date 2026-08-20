# Phase 2 — the posting worker

Phase 2 adds a Cloud Function that reads rows marked "ready" from each user's sheet, posts
the video to every platform they've connected, and writes the result back to the sheet.
It runs automatically every 15 minutes, or on demand from the **Run posting job now** button
on the Dashboard page.

## What actually works right now

| Platform  | Status | How it posts |
|-----------|--------|---------------|
| YouTube   | ✅ Working | Streams the video from its URL straight into a resumable upload via the YouTube Data API |
| Instagram | ✅ Working | Creates a Reels container from the video URL, polls until processed, publishes it |
| Facebook  | ✅ Working | Hands the Page a `file_url` — Facebook's servers fetch the video themselves |
| TikTok    | ✅ Working | Uses the Content Posting API's `PULL_FROM_URL` — TikTok fetches the video, you poll for completion |
| Snapchat  | ⛔ Not wired up | Snapchat's own posting API needs a separate Business/Ads Manager allowlist approval from Snap — there's no self-serve path the way there is for the other four. See `functions/lib/platforms/snapchat.js` for what to do once you have that access. |

Two things worth knowing going in, not bugs:
- **TikTok posts stay private (`SELF_ONLY`) until your TikTok developer app passes their
  Content Posting audit.** That's TikTok's rule, not something this code can bypass.
- **TikTok also requires the domain your video URLs live on to be verified** in the TikTok
  Developer Portal (a meta tag or DNS record), or the pull fails with `url_ownership_unverified`.

## 1. Set up the service account (so the job can read *and write* the sheet)

Phase 1's Sheets API key is read-only and fine for column mapping, but writing "posted" back
needs a proper identity:

1. In [Google Cloud Console](https://console.cloud.google.com) (same project as your Firebase
   project) → **IAM & Admin → Service Accounts → Create service account**. Call it something
   like `automedia-sheets`.
2. **Keys → Add key → JSON** — this downloads a file. Replace the contents of
   `functions/serviceAccountKey.json` with it.
3. Copy the service account's email (looks like `automedia-sheets@your-project.iam.gserviceaccount.com`).
4. For **every sheet** users connect in Phase 1, share it with that email as **Editor** — the
   same way you'd share it with a person. Without this, the job can't read or write that sheet.

## 2. Set each platform's credentials

These are the same fields you already filled in on the Connectors page (Step 03) — the worker
reads them straight out of Firestore. Where to get each one:

- **YouTube** — [Google Cloud Console](https://console.cloud.google.com) → OAuth client (Desktop
  app type) → enable the **YouTube Data API v3** → use the [OAuth Playground](https://developers.google.com/oauthplayground)
  or a one-time local script with your client ID/secret to get a refresh token for the target
  channel, scope `https://www.googleapis.com/auth/youtube.upload`.
- **Instagram** — [Meta for Developers](https://developers.facebook.com) app → Instagram Graph
  API → a long-lived access token for the linked IG business account, plus its numeric user ID.
- **Facebook** — same Meta app → a Page access token (`pages_manage_posts`,
  `pages_read_engagement`) and the target Page's ID.
- **TikTok** — [TikTok for Developers](https://developers.tiktok.com) → register an app → add
  the **Content Posting API** product → complete the audit for public posting → verify your
  video-hosting domain.
- **Snapchat** — see the table above; not wired up yet.

## 3. Install and deploy

```bash
npm install -g firebase-tools   # if you don't have it
firebase login
cd social-poster-app
firebase use --add              # pick your Firebase project
cd functions
npm install
cd ..
firebase deploy --only functions,firestore:rules
```

The scheduled function (`scheduledPostingRun`) starts running every 15 minutes automatically
once deployed — no separate cron setup needed, Firebase Scheduler handles it.

## 4. Try it

1. In your Google Sheet, set a row's status cell to whatever you configured as the "ready"
   value in Step 02 (default: `ready`).
2. Open the app's Dashboard for that user and click **Run posting job now** — or just wait up
   to 15 minutes for the schedule.
3. Check the sheet: the status cell should flip to `posted`, or to an `error: ...` message
   naming exactly which platform failed and why.

## Local testing without deploying

```bash
cd functions
npm install
firebase emulators:start --only functions,firestore
```
This runs the same code against the Firestore emulator so you can iterate without redeploying
each time. Point `src/firebase.js`'s `functions` export at the emulator with
`connectFunctionsEmulator` while testing this way (see the
[Firebase emulator docs](https://firebase.google.com/docs/emulator-suite)).
