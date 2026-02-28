# Hono Gatekeeper

Minimal API gateway for issuing scoped keys, enforcing rate limits, and proxying requests to upstream services.

## Features
- Scoped API keys stored in Neon (hash-only)
- Fixed-window rate limiting per token
- Admin endpoints protected by a master token
- Read/write proxy routing with scope checks

## Setup
1. Install dependencies
   - `pnpm install`
2. Create `.env` from `.env.example`
3. Apply SQL in `sql/001_gatekeeper.sql`
4. Run locally
   - `pnpm run dev`

## Admin API
Use `Authorization: Bearer <MASTER_ADMIN_TOKEN>` for admin endpoints.

- `POST /api/admin/keys` → `{ label, scopes[] }`
- `PATCH /api/admin/keys/:id` → `{ scopes?, isActive? }`
- `GET /api/admin/keys`
- `DELETE /api/admin/keys/:id`

## Proxy API
Use `Authorization: Bearer <issued_token>`

- `GET /api/proxy/*` (requires `read` scope)
- `POST /api/proxy/*` (requires `write` scope)
