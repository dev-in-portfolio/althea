# DiffLens

DiffLens is a deterministic diff service for text and JSON. It returns structured diff chunks plus summary counts, and stores runs in Neon Postgres per anonymous `x-user-key`.

This is an API-only service. Use `/docs` for interactive docs.

## Requirements

- Python 3.11+
- Neon Postgres

## Install (Termux)

```bash
pkg install python git openssl
python -m venv .venv
source .venv/bin/activate
pip install -U pip
pip install -e .
cp .env.example .env
# edit .env to set DATABASE_URL
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## Environment

```
DATABASE_URL=YOUR_NEON_POSTGRES_URL
APP_ENV=development
PORT=8000
```

## Database

Run `sql/001_init.sql` in Neon.

## Run

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## API

Health:

```bash
curl -s http://localhost:8000/health
```

DB health:

```bash
curl -s http://localhost:8000/health/db
```

Docs:

```bash
open http://localhost:8000/docs
```

Text diff:

```bash
curl -s -X POST http://localhost:8000/diff \
  -H "content-type: application/json" \
  -H "x-user-key: test-user-123" \
  -d '{"mode":"text","granularity":"line","a":"hello\nworld\n","b":"hello\nWORLD\n"}'
```

Validate (no DB write):

```bash
curl -s -X POST http://localhost:8000/diff/validate \
  -H "content-type: application/json" \
  -H "x-user-key: test-user-123" \
  -d '{"mode":"text","granularity":"line","a":"hello\nworld\n","b":"hello\nWORLD\n"}'
```

History:

```bash
curl -s -H "x-user-key: test-user-123" http://localhost:8000/history
```

Read run:

```bash
curl -s -H "x-user-key: test-user-123" http://localhost:8000/runs/<id>
```

Delete run:

```bash
curl -s -X DELETE -H "x-user-key: test-user-123" http://localhost:8000/runs/<id>
```
