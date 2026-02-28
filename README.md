# Remix QueueSplice

Job queue manager with leasing, retries, and dead-letter handling built in Remix + Neon.

## Features
- Enqueue jobs with JSON payloads
- Lease/claim workflow with retries
- Dead-letter handling and job detail view
- Simple dashboard with status counts

## Setup
1. Install dependencies
   - `pnpm install`
2. Create `.env` from `.env.example`
3. Apply SQL in `sql/001_queuesplice.sql`
4. Run locally
   - `pnpm run dev`
