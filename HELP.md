# Angle

Angle takes a short statement and returns multiple deterministic reframes through fixed lenses. It is rule- and template-driven (no AI dependencies) and stores results per anonymous user for revisiting.

## Setup

### Install
```bash
npm ci
```

### Dev
```bash
npm run dev
```

### Start
```bash
npm run start
```

### Environment
Create `.env.local`:
```bash
DATABASE_URL=REDACTED_NEON_POSTGRES_URL
PORT=3000
NODE_ENV=development
```

### Database
Run the migration in `sql/001_init.sql` against your Neon database.

## Usage
1. Open `/`
2. Paste a statement
3. Generate angles
4. Visit `/history`
5. Open a run via `/run/:id`

## Smoke Tests
- Generate reframes from "Project failed."
- Verify at least 5 outputs, each containing a keyword
- Copy button works
- History shows the run
- Delete run removes it from history
- Same input generates the same reframes
- Re-run on /run/:id with lens switch
