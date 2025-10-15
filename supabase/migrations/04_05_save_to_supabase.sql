BEGIN;
-- Ensure annotated_renders table has index for fast retrieval
CREATE INDEX IF NOT EXISTS idx_annotated_renders_student_page_version ON public.annotated_renders(student_id, page_number, version);
COMMIT;