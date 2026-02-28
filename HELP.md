# Compression

Deterministic multi-layer text compression with a minimal Express + EJS UI and Neon Postgres history.

## Requirements

- Node.js 20
- Neon Postgres database

## Install

```bash
npm ci
```

## Environment

Create `.env` from `.env.example` and set:

```
DATABASE_URL=YOUR_NEON_POSTGRES_URL
PORT=3000
NODE_ENV=development
```

## Database setup

Run the SQL:

```bash
psql "$DATABASE_URL" -f sql/001_init.sql
```

## Run

Development:

```bash
npm run dev
```

Production:

```bash
npm run start
```

## Smoke tests

Android Chrome

1. Open `/`.
2. Paste 8–12 sentences, run compression.
3. Verify layers show different lengths and are non-empty.
4. Open `/history`, ensure run saved.
5. Open `/run/:id` directly, verify loads.

Desktop Chrome

1. Repeat with 50+ sentences (within max).
2. Confirm response < 1s locally.
3. Delete a run; verify it disappears from history.

## Notes

- API routes require the `x-user-key` header (handled by the client script).
- Outputs are deterministic and explainable (no AI dependency).
