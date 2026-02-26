# Momentum

Momentum tracks focus energy and flow velocity. Log focus sessions, tag how they felt, and visualize cadence with waves, streaks, and heatmaps.

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
PORT=5175
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

## Tests

```bash
npm run check
```

## API

Health (DB):

```bash
curl -s http://localhost:5175/api/health
```

Export sessions:

```bash
curl -s http://localhost:5175/api/export \
  -H "x-user-key: test-user-123"
```

Import sessions:

```bash
curl -s -X POST http://localhost:5175/api/import \
  -H "content-type: application/json" \
  -H "x-user-key: test-user-123" \
  -d '{"items":[{"startedAt":"2026-02-26T10:00:00.000Z","endedAt":"2026-02-26T10:30:00.000Z","duration":1800,"tag":"Build","feel":1,"notes":"Focus sprint"}]}'
```

## Smoke tests

Android Chrome

1. Start session → stop after ~10 sec → save
2. Reload → session appears
3. Mark feel “Flow” → save
4. Dashboard wave updates

Offline test

1. Disable network
2. Log session
3. Re-enable network
4. Session syncs automatically

Desktop Chrome

1. Create sessions across 3 days (edit timestamps)
2. Confirm streak & heatmap update
