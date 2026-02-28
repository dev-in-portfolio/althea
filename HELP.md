# Causality

Causality lets you build cause → effect chains and returns deterministic insights (roots, leverage points, bottlenecks, sinks). It’s built for fast logging and explainable signals.

## Stack

- Node 20 + Express
- EJS server-rendered pages
- Neon Postgres (`pg`)

## Setup (Termux)

```bash
cd /root/althea
npm ci
cp .env.example .env
```

Set `DATABASE_URL` in `.env` to your Neon connection string.

## Run

```bash
npm run dev
```

Open `http://localhost:3000`.

## Database

Run the schema:

```bash
psql "$DATABASE_URL" -f sql/001_init.sql
```

## Usage

1. Create a chain on the home page.
2. Add nodes (causes, conditions, outcomes).
3. Add edges to show influence direction and strength.
4. Compute insights to see roots, leverage points, bottlenecks, and sinks.

## Smoke Tests

- Android Chrome
  1. Create chain “Sleep cascade”.
  2. Add nodes: late night, poor sleep, slow morning, rushed work, errors.
  3. Add edges in order.
  4. Compute insights.
  5. Confirm leverage highlights mid-chain items (e.g., poor sleep).

- Desktop Chrome
  1. Create chain with 20 nodes and branching.
  2. Compute insights quickly and consistently.
  3. Add an edge creating a cycle → insights still compute, `hasCycle=true`.

## Notes

- All API routes require the `x-user-key` header (handled by `public/app.js`).
- Insights are deterministic and explainable; no AI is used.
