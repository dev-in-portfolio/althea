# Interactive Terms Translator

Maps restaurant BOH/FOH/ops language to tech/product/engineering equivalents (and reverse). Local‑first with optional Neon backend for favorites and custom terms.

## Requirements
- Node.js 20+
- npm

## Termux quick start
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
Create `.env` from `.env.example`:
```
DATABASE_URL=postgres://USER:PASSWORD@HOST:PORT/DBNAME
```

## Neon setup
```bash
psql "$DATABASE_URL" -f sql/001_init.sql
```

## Scripts
- `node scripts/generate-terms.mjs` → seed content files
- `node scripts/build-index.mjs` → build search index

## Smoke tests
Android Chrome:
1. `/` translator: type “86”, toggle direction, verify results.
2. `/terms` filter and search.
3. Favorite a term; check `/favorites`.
4. Submit `/contribute` and verify local-only save if backend missing.

Desktop Chrome:
1. Check URL params `?q=` and `?dir=`.
2. Confirm term detail page shows definitions and examples.
3. Run `npm run build` without errors.
