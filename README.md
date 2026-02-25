# Micro-Exhibits: Digital Science Museum

Astro + Neon + Netlify Functions project for wings/halls/exhibits.

## Requirements
- Node 20 (Termux)
- PostgreSQL (Neon) connection string

## Termux setup
```bash
pkg update
pkg install nodejs-lts git
```

## Install
```bash
npm install
```

## Data pipeline
Place your canonical dataset into:
- `data/wings.json`
- `data/halls.json`
- `data/exhibits.json`

Then build and validate:
```bash
npm run data:build
npm run data:validate
```

## Dev
```bash
npm run dev -- --host 0.0.0.0 --port 4321
```

## Build
```bash
npm run build
npm run preview
```

## Neon env vars
Create `.env` locally:
```
DATABASE_URL=postgres://USER:PASSWORD@HOST:PORT/DBNAME
PUBLIC_USE_BACKEND=true
```

For Netlify, add the same env vars in the site settings.

## Run SQL migration
Use any Postgres client against Neon:
```sql
\i sql/001_init.sql
```

## Notes
- `npm run data:build` generates `src/generated/museum.ts` and search indices.
- If images are missing in the dataset, `images` remains an empty array and the UI shows a graceful placeholder.
