CREATE TABLE IF NOT EXISTS problems (
  id uuid PRIMARY KEY,
  user_key text NOT NULL,
  title text,
  params jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY,
  problem_id uuid NOT NULL,
  user_key text NOT NULL,
  label text NOT NULL,
  duration_min int NOT NULL,
  must boolean DEFAULT false,
  constraints jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS solutions (
  id uuid PRIMARY KEY,
  problem_id uuid NOT NULL,
  user_key text NOT NULL,
  rank int,
  payload jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS problems_user_time_idx ON problems (user_key, created_at desc);
CREATE INDEX IF NOT EXISTS tasks_problem_idx ON tasks (problem_id);
CREATE INDEX IF NOT EXISTS solutions_problem_rank_idx ON solutions (problem_id, rank);
