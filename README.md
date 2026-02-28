# Althea

RecallGrid is a Gradio knowledge library for saving chunks and retrieving them with full-text search, fuzzy title matching, and tag filters.

Quick start:

1. Create a `.env` from `.env.example` and set `DATABASE_URL` + `APP_PASSCODE`.
2. Apply `sql/001_recallgrid.sql` to enable FTS + trigram search.
3. Install deps: `pip install -r requirements.txt`
4. Run: `python app.py`
