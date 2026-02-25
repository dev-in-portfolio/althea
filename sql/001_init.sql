CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY,
  user_key text NOT NULL,
  happened_at timestamptz NOT NULL,
  note text NOT NULL,
  context jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS event_tags (
  event_id uuid NOT NULL,
  user_key text NOT NULL,
  tag text NOT NULL,
  PRIMARY KEY (event_id, tag)
);

CREATE TABLE IF NOT EXISTS signals_cache (
  user_key text PRIMARY KEY,
  computed_at timestamptz DEFAULT now(),
  events_updated_at timestamptz DEFAULT now(),
  payload jsonb
);

CREATE INDEX IF NOT EXISTS events_user_time_idx ON events (user_key, happened_at DESC);
CREATE INDEX IF NOT EXISTS event_tags_user_tag_idx ON event_tags (user_key, tag);
CREATE INDEX IF NOT EXISTS event_tags_user_tag_event_idx ON event_tags (user_key, tag, event_id);
