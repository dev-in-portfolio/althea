# SolveSpace

SolveSpace is a constraint solver that turns "musts" and time limits into a small set of viable options. This MVP packs tasks into a fixed time window and explains why each option was chosen.

## Features
- Define available minutes + task list
- Mark tasks as must or optional
- Generate 3–10 options using deterministic rules
- See remaining minutes and explanation per option

## Routes
- `/` Problem history
- `/new` New problem
- `/problems/[id]` Problem detail + generate options
- `/problems/[id]/solutions` Solutions list

## API
- `POST /api/problems`
- `GET /api/problems?userKey=`
- `GET /api/problems/:id?userKey=`
- `POST /api/problems/:id/solve`
- `GET /api/problems/:id/solutions?userKey=`
- `DELETE /api/problems/:id?userKey=`

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
Run the migration in `sql/001_init.sql` against your Neon database.

## Notes
- Must tasks must fit within available minutes or the solver returns a conflict message.
- Options are generated via multiple deterministic sort rules and deduplicated.
- Ranking prefers highest utilization (closest to full time).
- Problems can be edited after creation.
