ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS skips_used int DEFAULT 0;

ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS finalized_at timestamptz;

ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS finalized_payload jsonb;
