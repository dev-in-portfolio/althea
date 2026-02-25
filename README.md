# Radar of One

Radar of One is a personal pattern-discovery engine. Log small events with tags and optional context, then review a lightweight timeline and a text-first Signals page that surfaces emerging patterns without turning into a heavy journaling system.

## Features
- Fast event logging with tags and optional context
- Timeline with tag filters and pagination
- Signals page with explainable pattern detection
- Context correlations (place/energy/mode) in signals
- Inline event editing in the timeline
- Import JSON events in Settings
- Local anonymous identity stored in `localStorage`
- Neon Postgres backend for storage and signals caching

## Routes
- `/` Log events
- `/timeline` Timeline and tag filters
- `/signals` Pattern summaries
- `/settings` User key + export/import

## API
- `POST /api/events`
- `GET /api/events?userKey=&cursor=&limit=&tags=`
- `DELETE /api/events/:id?userKey=`
- `GET /api/signals?userKey=&window=30d`

## Setup

### Termux
```bash
pkg install nodejs
npm install
npm run dev
```

### Environment
Create `.env.local`:
```bash
DATABASE_URL=postgres://USER:PASSWORD@HOST:PORT/DATABASE
```

### Database
Run the migrations in `sql/001_init.sql` and `sql/002_signals_cache_events_updated.sql` against your Neon database.

## Notes
- Tags are normalized to lowercase kebab-case.
- Signals are cached per user for up to 1 hour.
- The Signals engine is deterministic and explainable.
- If the backend is not configured, the UI will show a banner prompt.
