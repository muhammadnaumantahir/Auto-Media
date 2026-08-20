# Auto Media

Free, multi-user video automation platform. Users connect a Google Sheet listing
their videos (Google Drive links or direct URLs); Auto Media reads that sheet,
posts each video to YouTube, Facebook, Snapchat and TikTok, and writes the
result (status, posted link, timestamp) back into the same sheet.

No database. The Google Sheet itself is the source of truth for each user's
videos. A single master "Users" Google Sheet (owned by whoever runs the app)
stores accounts and encrypted platform tokens.

## Repo layout

```
auto-media/
  backend/     Node.js + Express API
  frontend/    React + Vite dashboard
```

## Status: Phase 1

This first push contains Phase 1 only:

- Email/password auth (JWT) + Google OAuth login
- Multi-user support (Users stored as rows in a master Google Sheet)
- Dashboard shell + "connect your video sheet" flow
- Column-mapping so any sheet layout works (user tells us which column is
  the video link, title, status, platforms)

Later phases (see `/backend/docs/ROADMAP.md`) add: actual per-platform
posting, AI-generated titles/descriptions via local Ollama, scheduling,
analytics.

## Quick start

See `backend/README.md` and `frontend/README.md` for setup steps.
