BEGIN;
CREATE TABLE IF NOT EXISTS public.tajweed_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id),
  audio_path TEXT NOT NULL,
  result_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.tajweed_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY tajweed_isolation ON public.tajweed_results
  FOR SELECT TO authenticated
  USING (school_id IN (SELECT school_id FROM users WHERE id = auth.uid()));
COMMIT;