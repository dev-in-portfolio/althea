# Wayfinder

Wayfinder is a calm, walk-first experience built with Astro. Each waypoint opens a dedicated Walk Mode flow (settings → steps → summary). The site is local-first and works fully offline; optional Neon (Postgres) support powers bookmarks/progress when available.

## Key Features
- Walk Mode with 16 step guided sequence.
- Session settings (step length, goal, haptics, tones, ambient).
- Resume last walk (local).
- Session summary with achievements and recent sessions.
- Bookmarks + progress pages (local + optional backend).
- Local settings (contrast, font size, motion).

## Tech
- Astro (Node 20 compatible).
- Netlify Functions backend (optional).
- Postgres via Neon.
- Minimal client JS; localStorage fallback.

## Termux / Local Setup
```sh
npm ci
npm run dev -- --host 0.0.0.0 --port 4321
npm run build
npm run preview
```

Open: `http://127.0.0.1:4321/`

## Environment
Copy `.env.example` to `.env` and set:
```
DATABASE_URL=postgres://USER:PASSWORD@HOST:PORT/DBNAME
```

## SQL Migrations (Neon)
Apply `sql/001_init.sql` in the Neon SQL editor:
```sql
CREATE TABLE IF NOT EXISTS bookmarks (
  user_key text NOT NULL,
  waypoint_slug text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_key, waypoint_slug)
);

CREATE TABLE IF NOT EXISTS progress (
  user_key text PRIMARY KEY,
  last_waypoint_slug text,
  last_scroll_y int,
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

## Backend Endpoints
Netlify Functions:
- `GET /api/bookmarks?userKey=...`
- `POST /api/bookmarks` `{ userKey, waypoint_slug }`
- `DELETE /api/bookmarks` `{ userKey, waypoint_slug }`
- `GET /api/progress?userKey=...`
- `POST /api/progress` `{ userKey, last_waypoint_slug, last_scroll_y }`

## Walk Mode Flow
1. Settings screen: set session goal, step length, ambient, haptics.
2. Steps screen: one step at a time, timer, pause/next.
3. Summary screen: time, achievements, history, links.

## Local Data
Stored in `localStorage`:
- `wayfinder.userKey`
- `wayfinder.bookmarks`
- `wayfinder.progress`
- `wayfinder.settings`
- `wayfinder.sessions`
- `wayfinder.walkSession`

## Smoke Tests
Android Chrome:
1. Open any waypoint; confirm settings → steps → summary flow.
2. Pause/Next/End work and summary appears.
3. Exit and re-open, verify Resume Last Walk (if active).

Desktop Chrome:
1. Toggle haptics/tones/ambient, ensure no errors.
2. Visit `/bookmarks` and `/progress`.
3. Run `npm run build` with no errors.

## Notes
- No external APIs required; all data is local unless backend is configured.
- Walk Mode is the primary experience on waypoint detail pages.
