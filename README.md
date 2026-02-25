# Order of One

Order of One is a decision-collapsing engine. Paste a messy list, run a pairwise funnel, and get a ranked list with a simple audit trail of wins/losses.

## Features
- New session from newline list
- Pairwise collapse arena (Swiss-style pairing)
- Results view with score, wins/losses, seed tie-breaker
- Session history and deletion

## Routes
- `/` Sessions list
- `/new` Create session
- `/arena/[id]` Pairwise collapse
- `/results/[id]` Ranking summary

## API
- `POST /api/sessions`
- `GET /api/sessions?userKey=`
- `GET /api/sessions/:id?userKey=`
- `GET /api/sessions/:id/next?userKey=`
- `POST /api/sessions/:id/compare`
- `POST /api/sessions/:id/finalize`
- `DELETE /api/sessions/:id?userKey=`

## Setup

### Termux
```bash
pkg install nodejs
npm install
npm run dev
```

### Environment
Create `.env.local`:
```bash
DATABASE_URL=postgres://USER:PASSWORD@HOST:PORT/DATABASE
```

### Database
Run the migrations in `sql/001_init.sql` and `sql/002_session_finalize_and_skips.sql` against your Neon database.

## Notes
- Pairing avoids repeats and prefers close scores.
- Comparisons are capped at 30 or total pairs (whichever is lower).
- Ties break by head-to-head winner, then seed order.
- Skip limit is enforced server-side (max 3).
- Finalize stores a snapshot on the session.
