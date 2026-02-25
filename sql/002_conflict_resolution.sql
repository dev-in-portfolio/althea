ALTER TABLE conflicts
ADD COLUMN IF NOT EXISTS resolution_status text DEFAULT 'open';
