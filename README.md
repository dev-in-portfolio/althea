# Althea

PatchSmith is a Gradio operator console for creating precise FIND/REPLACE patches against stored files. It enforces exact matching, supports multi-match selection, and includes an approval flow with export blocks.

Quick start:

1. Create a `.env` file from `.env.example` and set `DATABASE_URL` + `APP_PASSCODE`.
2. Apply `sql/001_patchsmith.sql` to your Neon database.
3. Install deps: `pip install -r requirements.txt`
4. Run: `python app.py`
