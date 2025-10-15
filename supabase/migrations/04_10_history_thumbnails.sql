BEGIN;
-- Ensure annotated_renders has created_at and version fields
ALTER TABLE public.annotated_renders ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.annotated_renders ADD COLUMN IF NOT EXISTS version INT DEFAULT 1;
COMMIT;