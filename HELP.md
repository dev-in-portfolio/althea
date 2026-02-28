# Hono Intake

Validated ingestion service with dedupe hashing and quarantine workflows backed by Neon Postgres.

## Features
- Strict validation + per-kind requirements
- Stable hashing for idempotent ingestion
- Quarantine storage with retry
- Size caps on payloads

## Setup
1. Install dependencies
   - `pnpm install`
2. Create `.env` from `.env.example`
3. Apply SQL in `sql/001_hono_intake.sql`
4. Run locally
   - `pnpm run dev`

## API
Base: `/api/intake`

- `POST /` → accepted, duplicate, or quarantined
- `GET /records?kind=&limit=50`
- `GET /quarantine?kind=&limit=50`

Admin:
- `POST /api/admin/quarantine/:id/retry` (requires `ADMIN_TOKEN`)
