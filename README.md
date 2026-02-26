# SurfaceLab

SurfaceLab is a tactile surface recipe lab. Mix color, texture, lighting, and finish controls to generate realistic swatches. Save recipes to Neon, duplicate, and export settings JSON.

## Requirements

- Node.js 18+
- Neon Postgres

## Install

```bash
npm install
```

## Environment

```
DATABASE_URL=YOUR_NEON_POSTGRES_URL
PORT=5173
```

## Database

Run `sql/001_init.sql` in Neon.

## Run

```bash
npm run dev
```

Build + preview:

```bash
npm run build
npm run preview
```

## API

Health (DB):

```bash
curl -s http://localhost:5173/api/health
```

## Smoke tests

Android Chrome

1. Load /
2. Choose preset “Carbon Fiber”
3. Move gloss slider; preview changes immediately
4. Save recipe
5. Open /library and confirm it appears
6. Open recipe, edit, save, refresh → persists

Desktop Chrome

1. Duplicate recipe; both appear
2. Delete one; list updates
3. Copy JSON; paste elsewhere; it matches current settings
4. Copy CSS; paste elsewhere; it matches preview
