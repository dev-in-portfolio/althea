# Draft Relay (Fresh + Neon)

Card-based draft editor and publisher built with Fresh. Compose pages, reorder cards, and publish a public URL.

## Features
- Draft dashboard + card editor
- SSR public pages
- Publish/unpublish flow
- Neon-backed persistence

## Setup
1. Create `.env` from `.env.example`
2. Apply SQL in `sql/001_draft_relay.sql`
3. Run locally
   - `deno task dev`

## Routes
- `/` dashboard
- `/edit/:id` editor
- `/p/:publishedSlug` public view
