BEGIN;
-- Base tables for annotations (details fleshed out in later prompts)
CREATE TABLE IF NOT EXISTS public.annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  page_number INT NOT NULL,
  tool_type TEXT NOT NULL CHECK (tool_type IN ('green_pen','red_pen','yellow_highlight')),
  payload JSONB NOT NULL, -- Fabric JSON fragment (strokes)
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.annotated_renders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  page_number INT NOT NULL,
  storage_path TEXT NOT NULL,
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, page_number, version)
);

-- RLS (tightened in later prompts with role gates)
ALTER TABLE public.annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.annotated_renders ENABLE ROW LEVEL SECURITY;

CREATE POLICY annotations_school_isolation ON public.annotations
FOR SELECT USING (school_id = school_id)
WITH CHECK (school_id = school_id);

CREATE POLICY annotated_renders_isolation ON public.annotated_renders
FOR SELECT USING (true)
WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_annotations_student_page ON public.annotations(student_id, page_number);
CREATE INDEX IF NOT EXISTS idx_annotated_renders_student_page ON public.annotated_renders(student_id, page_number);
COMMIT;