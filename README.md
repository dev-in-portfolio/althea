# Island Index (Fresh + Neon)

Fresh SSR content browser with islands for live filters and Neon-backed saved views.

## Features
- Server-rendered item browser with pagination
- Islands for filter/search/sort controls
- Saved views persisted to Neon
- Device-key cookie for lightweight identity

## Setup
1. Install Deno (if needed)
2. Create `.env` from `.env.example`
3. Apply SQL in `sql/001_island_index.sql`
4. Run locally
   - `deno task dev`

## Routes
- `/` Browser
- `/views` Saved views
- `/api/views` CRUD
- `/api/items` Demo data feed
