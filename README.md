# TagTrellis

TagTrellis lets you build a private tag graph and attach “things” (notes or links) to tags. It uses Supabase Auth + Postgres + RLS for privacy, plus a 2-hop neighborhood RPC.

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
NEXT_PUBLIC_BASE_URL=http://localhost:5180
```

## Database

Run `sql/001_init.sql` in Supabase SQL editor to create tables, RLS policies, and the `tag_neighborhood` RPC.

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
2. Create tags
3. Add an edge between tags
4. Create a thing and tag it
5. Open a tag and see its neighborhood + tagged things
