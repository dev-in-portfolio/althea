# LatchList

LatchList is a proof-first checklist app. Items move through phases (draft → ready → locked), and phase advancement is enforced by a Supabase RPC that requires proofs when enabled.

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
NEXT_PUBLIC_BASE_URL=http://localhost:5179
```

## Database

Run `sql/001_init.sql` in Supabase SQL editor to create tables, RLS policies, and the `advance_item_phase` RPC.

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

1. Login with a magic link
2. Create a latch
3. Add an item requiring proof
4. Add proof and advance to ready
5. Try advancing without proof on a new item (should fail)
