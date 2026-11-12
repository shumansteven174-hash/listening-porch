# The Listening Porch — server-backed peer support community

A free, warm, calm place where people can talk about life, ask for help, and
offer a listening ear. Members join with a handle (no real name, no email),
post in discussion circles, and message each other one on one.

**Peer support, not professional counseling. Not a substitute for a therapist
or crisis services. If you are in crisis, call or text 988.**

## What it does

- **Accounts** — sign up with a handle and password (bcrypt-hashed), sessions
  stored in SQLite. Members set a short bio and choose whether to appear as
  available to chat.
- **Discussion circles** — 8 topics: Anxiety, Grief & Loss, Loneliness,
  Stress & Work, Family, Faith & Hope, Recovery, Small Wins. Create threads,
  reply, and tap "You are heard" (toggleable, counted).
- **One-on-one messaging** — inbox, conversations, read states. You can only
  message someone who has marked themselves available to chat, or someone
  you have already talked with.
- **Daily Light** — a daily inspirational quote, spiritual reading, or poem
  that rotates by calendar date (90 entries: 30 per category).
- **Crisis help** — 988, Crisis Text Line (text HOME to 741741), SAMHSA
  1-800-662-4357, NAMI 1-800-950-6264, on every page. If a post, reply, or
  message contains self-harm language, a crisis banner appears immediately.
  No medical advice anywhere in the app.
- **Safety & moderation** — report any post/reply/message; block a user
  (their posts disappear for you and they can't message you); members whose
  handle is listed in `ADMIN_HANDLES` can review reports and hide content.
- **Guided breathing** — client-side box breathing (4 in, 4 hold, 4 out, 4 hold).
- **Seeded content** — a welcome thread from "Porch Team" in every circle,
  so the porch is never empty on first launch.

## Tech

Node.js + Express + SQLite (built-in `node:sqlite`, no native modules).
Server-rendered pages, no build step, no paid services.

## Run it locally

```bash
npm install
cp .env.example .env   # then edit SESSION_SECRET
npm start
```

Open http://localhost:3000. Sign up with any handle and password (min 8
characters). The database file is created at `data/porch.db`.

## Deploy to Render (free tier)

1. Push this folder to a GitHub repo (see the go-live plan for the full
   checklist — `~/workspace/research_notes/listening-porch-go-live-20261111/plan.md`).
2. In Render, create a **Web Service** from the repo. Render reads
   `render.yaml` and fills in the build/start commands, the health check,
   and a generated `SESSION_SECRET`.
3. After your first deploy, create your account on the live site, then set
   the `ADMIN_HANDLES` environment variable in Render to your handle and
   redeploy — that gives you the report-review page at `/admin/reports`.

### Free-tier warning (important)

Render's free tier filesystem is **ephemeral**: the SQLite database is wiped
whenever the service restarts or redeploys. That is fine for a first launch
and testing, but a real community needs its data to survive. Two options:

- **Paid instance ($7/month)** with a persistent disk mounted at the data
  directory, and point `DATABASE_PATH` at it. This is the recommended route.
- Or move the database to a hosted Postgres later (code change required).

The free tier also spins down after inactivity, so the first visit after a
quiet spell takes ~30–60 seconds to wake up.

## Project layout

- `server.js` — the whole app: routes, auth, sessions, rendering.
- `db.js` — schema, seed data, circle definitions.
- `lib/daily.js` — Daily Light library (30 quotes, 30 readings, 30 poems).
- `lib/crisis.js` — self-harm keyword detection.
- `public/style.css`, `public/client.js` — styling and the breathing exercise.
- `render.yaml` — Render service definition.
