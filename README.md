# TimeSlice

TimeSlice is a cinematic timeline-scrubber. Create projects composed of ordered frames and scrub through time with autoplay and A/B compare.

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
