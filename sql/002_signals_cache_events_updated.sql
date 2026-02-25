ALTER TABLE signals_cache
ADD COLUMN IF NOT EXISTS events_updated_at timestamptz DEFAULT now();
