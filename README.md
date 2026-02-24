# Interactive Terms Translator

A local-first translator that maps restaurant BOH/FOH/ops language to tech/product/engineering equivalents (and reverse). Built with Astro + optional Neon (Postgres) backend. Works fully without a backend using localStorage.

## Features
- Step‑Select flow: Category → Subcategory → Term → Fire
- Live filtering with Rush Mode + Signals toggles
- Direction toggle: Restaurant → Tech or Tech → Restaurant
- Favorites and custom terms (backend if available; local fallback)
- Full terms library, categories browser, and detail pages

## Quick Start (Termux)
```bash
cd /root/althea
npm ci
npm run dev -- --host 0.0.0.0 --port 4321
```
Open: `http://localhost:4321/`

## Build
```bash
npm run build
npm run preview -- --host 0.0.0.0 --port 4321
```

## Environment
Create a `.env` from `.env.example`.

```
DATABASE_URL=postgres://USER:PASSWORD@HOST:PORT/DBNAME?sslmode=require
```

## Neon Setup
1. Create a Neon database.
2. Run migrations:
```bash
psql "$DATABASE_URL" -f sql/001_init.sql
```
3. Deploy with Netlify Functions (see `netlify/` and `netlify.toml`).

## Data Ingestion
The app uses a JSONL dataset stored at:
```
data/boh_to_tech_full_enriched_ultra.jsonl
```
To regenerate content:
```bash
node scripts/generate-terms.mjs
node scripts/build-index.mjs
```

## Folder Structure
```
src/content/terms/      # Markdown term entries
public/data/terms.json  # Search index
netlify/functions/      # API endpoints
sql/                    # DB migrations
```

## Local‑Only Mode
If the backend is unavailable, favorites and custom terms are stored locally in the browser.

## Smoke Tests
- Home: select Category → Subcategory → Term → Fire
- Rush/Signals toggles update available term list
- Full List renders and filters
- Favorites save and persist (local)
- Contribute form saves (local)

