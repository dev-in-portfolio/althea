CREATE TABLE IF NOT EXISTS bookmarks (
  user_key text NOT NULL,
  waypoint_slug text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_key, waypoint_slug)
);

CREATE TABLE IF NOT EXISTS progress (
  user_key text PRIMARY KEY,
  last_waypoint_slug text,
  last_scroll_y int,
  updated_at timestamptz NOT NULL DEFAULT now()
);
