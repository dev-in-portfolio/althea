# Althea

SchemaPulse is a Gradio operator console for inspecting Neon schemas, indexes, constraints, and migrations, with automated runbook generation and readiness checks.

Quick start:

1. Create a `.env` from `.env.example` and set `DATABASE_URL` + `APP_PASSCODE`.
2. Apply `sql/001_schemapulse.sql` if you want migration persistence.
3. Install deps: `pip install -r requirements.txt`
4. Run: `python app.py`
