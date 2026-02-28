# Hono Capsule Cache

Namespaced TTL cache service backed by Neon Postgres. Designed for fast JSON caching with strict size limits.

## Features
- Namespaces to isolate keys
- TTL-based expiration with cleanup endpoint
- Payload size caps and hashing
- Neon-backed persistence

## Setup
1. Install dependencies
   - `pnpm install`
2. Create `.env` from `.env.example`
3. Apply SQL in `sql/001_capsule_cache.sql`
4. Run locally
   - `pnpm run dev`

## API
Base: `/api/cache`

- `GET /:namespace/:key`
- `PUT /:namespace/:key?ttlSeconds=300` (JSON body)
- `DELETE /:namespace/:key`

Admin cleanup (protected by `ADMIN_TOKEN`):
- `POST /api/admin/cleanup`
