# Althea

CardPress is a Vue + Neon app for composing ordered card-based pages, saving drafts, and publishing to shareable URLs.

Quick start:

1. Apply `sql/001_cardpress.sql` to your Neon database.
2. Create a `.env` from `.env.example` and set `DATABASE_URL`.
3. Install deps: `npm install`
4. Run API server: `npm run server`
5. Run client: `npm run dev`

Published pages are viewable at `/p/:published_slug`.
