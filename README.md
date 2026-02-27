# SessionMint

SessionMint is a session logger with weekly mint rollups. It stores sessions in Supabase Postgres and generates weekly summaries via a Supabase RPC.

## Requirements

- Node.js 20+
- Supabase project (Auth + Postgres)

## Install

```bash
npm install
```

## Environment

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_BASE_URL=http://localhost:5182
```

## Database

Run `sql/001_init.sql` in Supabase SQL editor to create tables, RLS policies, and the `mint_week` RPC.

## Run

```bash
npm run dev
```

Build + start:

```bash
npm run build
npm run start
```

## Smoke Test

1. Log a couple sessions
2. Visit Mints and click “Mint this week”
3. Open the mint detail and verify top tags
