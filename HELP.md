# Remix DiffAtlas

Dataset diffing and change classification built with Remix + Neon.

## Features
- Create diff jobs and snapshots
- Parse JSON array, NDJSON, or CSV
- Compare snapshots and classify added/removed/modified
- Persist diff results

## Setup
1. Install dependencies
   - `pnpm install`
2. Create `.env` from `.env.example`
3. Apply SQL in `sql/003_diffatlas.sql`
4. Run locally
   - `pnpm run dev`
