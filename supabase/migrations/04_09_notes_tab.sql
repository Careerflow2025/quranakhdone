BEGIN;
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  visible_to_parent BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY notes_isolation_select ON public.notes
  FOR SELECT TO authenticated
  USING (school_id IN (SELECT school_id FROM users WHERE id = auth.uid()));
CREATE POLICY notes_isolation_insert ON public.notes
  FOR INSERT TO authenticated
  WITH CHECK (school_id IN (SELECT school_id FROM users WHERE id = auth.uid()));
CREATE INDEX IF NOT EXISTS idx_notes_student ON public.notes(student_id);
COMMIT;