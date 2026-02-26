# SurfaceLab

SurfaceLab is a tactile surface recipe lab. Mix color, texture, lighting, and finish controls to generate realistic swatches. Save recipes to Neon, duplicate, and export settings JSON.

## Requirements

- Node.js 18+
- Postgres (Neon recommended)

## Install

```bash
npm install
```

## Build Prereqs (SvelteKit)

Required files/configs for this app to run:

- `src/app.html` (SvelteKit app template)
- `svelte.config.js` with `svelte-preprocess` enabled for `lang="ts"`
- `tsconfig.json` with `verbatimModuleSyntax: true`
- `@sveltejs/vite-plugin-svelte` in `devDependencies`

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

If `DATABASE_URL` is missing, API calls will return `503` and the UI will show a DB-unavailable message (no crash).

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
