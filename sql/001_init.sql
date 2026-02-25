CREATE TABLE IF NOT EXISTS statements (
  id uuid PRIMARY KEY,
  user_key text NOT NULL,
  text text NOT NULL,
  weight int DEFAULT 3,
  domain text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS statement_tags (
  statement_id uuid NOT NULL,
  user_key text NOT NULL,
  tag text NOT NULL,
  PRIMARY KEY (statement_id, tag)
);

CREATE TABLE IF NOT EXISTS conflicts (
  id uuid PRIMARY KEY,
  user_key text NOT NULL,
  a_id uuid NOT NULL,
  b_id uuid NOT NULL,
  conflict_type text NOT NULL,
  reason text NOT NULL,
  resolution_status text DEFAULT 'open',
  computed_at timestamptz DEFAULT now(),
  UNIQUE (user_key, a_id, b_id, conflict_type)
);

CREATE INDEX IF NOT EXISTS statements_user_time_idx ON statements (user_key, created_at DESC);
CREATE INDEX IF NOT EXISTS statement_tags_user_tag_idx ON statement_tags (user_key, tag);
