# Contradict

Contradict is a rule-based contradiction detector for short statements. Add statements, assign weight/tags, and review flagged conflicts with a clear "why" and a resolution prompt.

## Features
- Fast statement input with weight slider
- Statement library with domain filter
- Conflicts list with reason + prompt
- Conflict caching and resolution status
- Tag chips and suggestions
- Deterministic rule engine (no NLP dependencies)

## Routes
- `/` Input
- `/statements` Library
- `/conflicts` Conflicts

## API
- `POST /api/statements`
- `GET /api/statements?userKey=&domain=`
- `DELETE /api/statements/:id?userKey=`
- `GET /api/conflicts?userKey=&mode=`
- `POST /api/conflicts/update`

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
Run the migrations in `sql/001_init.sql` and `sql/002_conflict_resolution.sql` against your Neon database.

## Notes
- Rules are conservative: mutual tensions, resource conflicts, constraint conflicts.
- Severity is derived from statement weights.
- Conflicts are recomputed on demand and deterministic.
