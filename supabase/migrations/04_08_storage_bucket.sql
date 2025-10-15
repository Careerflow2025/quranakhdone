BEGIN;
-- Ensure storage bucket exists (manual step in Supabase UI: create bucket `annotated-renders` public=off)
-- RLS is managed at API-level with signed URLs, not table-level.
COMMIT;