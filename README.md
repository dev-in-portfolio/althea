# SchemaGate

SchemaGate is a deterministic JSON schema gatekeeper. Store schemas, then validate or normalize payloads against them. Runs are stored in Neon Postgres per anonymous `x-user-key`.

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

Create schema:

```bash
curl -s -X POST http://localhost:8000/schemas \
  -H "content-type: application/json" \
  -H "x-user-key: test-user-123" \
  -d '{"name":"events_v1","schema":{"type":"object","required":["id","name"],"properties":{"id":{"type":"string","minLength":1},"name":{"type":"string","minLength":1,"trim":true},"age":{"type":"int","min":0,"max":130,"default":0},"tags":{"type":"array","items":{"type":"string","trim":true},"default":[]}},"additionalProperties":false}}'
```

Validate payload:

```bash
curl -s -X POST "http://localhost:8000/validate/events_v1" \
  -H "content-type: application/json" \
  -H "x-user-key: test-user-123" \
  -d '{"id":"abc","name":"  Devin  ","age":"42","tags":["  a ","b"]}'
```

Normalize payload:

```bash
curl -s -X POST "http://localhost:8000/normalize/events_v1" \
  -H "content-type: application/json" \
  -H "x-user-key: test-user-123" \
  -d '{"id":"abc","name":"  Devin  ","age":"42","tags":["  a ","b"]}'
```

List schemas:

```bash
curl -s -H "x-user-key: test-user-123" http://localhost:8000/schemas
```
