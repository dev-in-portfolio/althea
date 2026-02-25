CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY,
  user_key text NOT NULL,
  title text,
  skips_used int DEFAULT 0,
  finalized_at timestamptz,
  finalized_payload jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS items (
  id uuid PRIMARY KEY,
  session_id uuid NOT NULL,
  user_key text NOT NULL,
  label text NOT NULL,
  seed int,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS comparisons (
  id uuid PRIMARY KEY,
  session_id uuid NOT NULL,
  user_key text NOT NULL,
  a_item_id uuid NOT NULL,
  b_item_id uuid NOT NULL,
  winner_item_id uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sessions_user_time_idx ON sessions (user_key, created_at DESC);
CREATE INDEX IF NOT EXISTS items_session_idx ON items (session_id);
CREATE INDEX IF NOT EXISTS comparisons_session_time_idx ON comparisons (session_id, created_at DESC);
