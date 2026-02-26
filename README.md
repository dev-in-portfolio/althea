# QueJudge

QueJudge is a deterministic rule-based ranking engine. Provide items and a rule pack, get a ranked list with transparent scoring and explanations. Runs are stored in Neon Postgres per anonymous `x-user-key`.

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

Judge:

```bash
curl -s -X POST "http://localhost:8000/judge" \
  -H "content-type: application/json" \
  -H "x-user-key: test-user-123" \
  -d '{
    "items":[
      {"id":"a","label":"Fix deploy","tags":["ops","urgent"],"due":"2026-02-26","effort":3,"value":9},
      {"id":"b","label":"Refactor UI","tags":["ux"],"effort":6,"value":6}
    ],
    "rules":{
      "weights":{"tagBoost":2.0,"dueSoonBoost":3.0,"effortPenalty":1.0,"valueBoost":2.0,"keywordBoost":1.5},
      "preferTags":["urgent","ops"],
      "avoidTags":[],
      "preferKeywords":["deploy","error","fix"],
      "avoidKeywords":["someday"],
      "now":"2026-02-26",
      "tieBreak":"stable"
    }
  }'
```

History:

```bash
curl -s -H "x-user-key: test-user-123" http://localhost:8000/history
```

Run details:

```bash
curl -s -H "x-user-key: test-user-123" http://localhost:8000/runs/<id>
```

Rulepacks:

```bash
curl -s -X POST http://localhost:8000/rulepacks \
  -H "content-type: application/json" \
  -H "x-user-key: test-user-123" \
  -d '{"name":"default","rules":{"weights":{"tagBoost":2.0,"dueSoonBoost":3.0,"effortPenalty":1.0,"valueBoost":2.0,"keywordBoost":1.5}}}'
```
