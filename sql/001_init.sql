CREATE TABLE IF NOT EXISTS bookmarks (
  user_key text NOT NULL,
  entry_slug text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_key, entry_slug)
);

CREATE TABLE IF NOT EXISTS notes (
  id bigserial PRIMARY KEY,
  user_key text NOT NULL,
  entry_slug text NOT NULL,
  note_text text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notes_user_entry_idx ON notes (user_key, entry_slug);
