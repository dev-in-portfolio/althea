# TimeSlice

TimeSlice is a cinematic timeline-scrubber. Create projects composed of ordered frames and scrub through time with autoplay and A/B compare.

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

Dev seed (APP_ENV=development):

```bash
curl -s -X POST http://localhost:5173/api/dev/seed \
  -H "x-user-key: test-user-123"
```

## Shortcuts

- Space: play/pause
- Arrow Left/Right: previous/next frame

## Smoke tests

Android Chrome

1. Create project
2. Add 5 frames with distinct body text
3. Scrub slider; verify content switches instantly
4. Autoplay works; pause works
5. Compare A/B shows two different frames

Desktop Chrome

1. Reorder frames; verify playback order changes
2. Edit a middle frame; refresh page; data persists
3. Delete a frame; order compacts; no gaps
