# Paradox Vault

Paradox Vault is a browsable archive of paradoxes, thought experiments, systems, and riddles. It is local‑first and works offline; an optional Neon backend adds bookmarks and notes.

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
Run `sql/001_init.sql` in the Neon SQL editor:
```sql
CREATE TABLE IF NOT EXISTS bookmarks (
  user_key text NOT NULL,
  entry_slug text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_key, entry_slug)
);

CREATE TABLE IF NOT EXISTS notes (
  id bigserial PRIMARY KEY,
  user_key text NOT NULL,
  entry_slug text NOT NULL,
  note_text text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notes_user_entry_idx ON notes (user_key, entry_slug);
```

## Backend Endpoints
Netlify Functions:
- `GET /api/bookmarks?userKey=...`
- `POST /api/bookmarks` `{ userKey, entry_slug }`
- `DELETE /api/bookmarks` `{ userKey, entry_slug }`
- `GET /api/notes?userKey=...&entry_slug=...`
- `POST /api/notes` `{ userKey, entry_slug, note_text, id? }`
- `DELETE /api/notes` `{ userKey, id }`

## Build Index
The search index is generated at build time:
```
npm run build:index
```

## Smoke Tests
Android Chrome:
1. Open `/vault`, search for “liar” and confirm filter results.
2. Open an entry, add a note, and confirm it appears in `/notes`.
3. Bookmark an entry and confirm it appears in `/bookmarks`.

Desktop Chrome:
1. Filter `/vault` by type and tag; verify URL params update.
2. Open `/tags` and verify tag pages render.
3. Run `npm run build` without errors.
