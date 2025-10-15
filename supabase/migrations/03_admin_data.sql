BEGIN;
-- Classes: ensure schedule and code fields
ALTER TABLE IF EXISTS public.classes ADD COLUMN IF NOT EXISTS code TEXT UNIQUE;
ALTER TABLE IF EXISTS public.classes ADD COLUMN IF NOT EXISTS schedule JSONB; -- {"days":["Mon","Wed"],"start":"17:30","end":"19:00"}

-- Teacher join table (if not present)
CREATE TABLE IF NOT EXISTS public.class_teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (class_id, user_id)
);

-- Enrollment table (if not present)
CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (class_id, student_id)
);

-- Minimal RLS (assumes RLS enabled at table level already)
CREATE POLICY IF NOT EXISTS class_teachers_isolate ON public.class_teachers
  FOR ALL TO authenticated USING (school_id = auth.uid()::uuid OR school_id = school_id);
CREATE POLICY IF NOT EXISTS enrollments_isolate ON public.enrollments
  FOR ALL TO authenticated USING (school_id = auth.uid()::uuid OR school_id = school_id);

-- Indices
CREATE INDEX IF NOT EXISTS idx_classes_school ON public.classes(school_id);
CREATE INDEX IF NOT EXISTS idx_class_teachers_class ON public.class_teachers(class_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_class ON public.enrollments(class_id);
COMMIT;