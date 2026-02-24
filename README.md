# Paradox Vault

Paradox Vault is a curated, local‑first archive of paradoxes, thought experiments, systems, and riddles. It includes a Brutalist UI, searchable catalog, and local bookmarks/notes with optional Neon sync.

## Requirements
- Node.js 20+
- npm 9+

## Quick start (Termux-friendly)
```bash
npm install
npm run dev
```
Open: `http://127.0.0.1:4321/`

## Build + preview
```bash
npm run build
npm run preview -- --host 127.0.0.1 --port 4321
```

## Environment
Copy `.env.example` to `.env` and set:
```
DATABASE_URL=postgres://USER:PASSWORD@HOST:PORT/DBNAME
```

## SQL migrations (Neon)
Run:
```bash
psql "$DATABASE_URL" -f sql/001_init.sql
```

## Backend endpoints
Netlify Functions:
- `GET /api/bookmarks?userKey=...`
- `POST /api/bookmarks` `{ userKey, entry_slug }`
- `DELETE /api/bookmarks` `{ userKey, entry_slug }`
- `GET /api/notes?userKey=...&entry_slug=...`
- `POST /api/notes` `{ userKey, entry_slug, note_text, id? }`
- `DELETE /api/notes` `{ userKey, id }`

## Dataset tooling
Curated ingestion and QA scripts:

- `node scripts/fetch-curated.mjs`  
  Pulls curated entries from Wikipedia lists and entry extracts.

- `node scripts/filter-curated.mjs`  
  Filters non‑paradox entries into `src/content/_rejected` and writes `public/data/curation-report.json`.

- `node scripts/enrich-sources.mjs`  
  Adds SEP / IEP sources when available.

- `node scripts/build-index.mjs`  
  Builds `public/data/index.json` for search.

- `node scripts/fix-curated.mjs` / `node scripts/normalize-slugs.mjs`  
  YAML cleanup and slug normalization (use only if needed).

## Smoke tests
Android Chrome:
1. `/` → Random Entry works.
2. `/vault` → Search, filter, Load More.
3. `/vault/[slug]` → Bookmark + edit notes.
4. `/bookmarks` and `/notes` show empty states when empty.

Desktop Chrome:
1. `/vault` filters update URL params.
2. `/tags` and `/tags/[tag]` render.
3. `npm run build` completes without errors.
