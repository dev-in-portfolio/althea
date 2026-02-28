# Althea

Switchboard is a Vue + Neon app for saving dataset views (filters, sorting, columns) and sharing them via URL.

Quick start:

1. Apply `sql/001_switchboard.sql` to your Neon database.
2. Create a `.env` from `.env.example` and set `DATABASE_URL`.
3. Install deps: `npm install`
4. Run API server: `npm run server`
5. Run client: `npm run dev`

The client proxies `/api` to the API server on `http://localhost:3010`.
