BEGIN;

-- Parent-Student relationships (for siblings)
CREATE TABLE IF NOT EXISTS public.parent_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  relationship TEXT DEFAULT 'parent', -- parent, guardian, etc
  is_primary BOOLEAN DEFAULT false, -- primary contact
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(parent_id, student_id)
);

-- Parent notes on student progress
CREATE TABLE IF NOT EXISTS public.parent_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  page_number INT NOT NULL,
  note_text TEXT NOT NULL,
  is_visible_to_teacher BOOLEAN DEFAULT true,
  teacher_response TEXT,
  teacher_responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Teacher notes visibility to parents
ALTER TABLE public.annotations 
ADD COLUMN IF NOT EXISTS is_visible_to_parent BOOLEAN DEFAULT true;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_parent_students_parent ON public.parent_students(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_students_student ON public.parent_students(student_id);
CREATE INDEX IF NOT EXISTS idx_parent_notes_parent_student ON public.parent_notes(parent_id, student_id);
CREATE INDEX IF NOT EXISTS idx_parent_notes_page ON public.parent_notes(student_id, page_number);

-- RLS Policies
ALTER TABLE public.parent_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_notes ENABLE ROW LEVEL SECURITY;

-- Parents can see their own children
CREATE POLICY parent_students_view ON public.parent_students
FOR SELECT USING (parent_id = auth.uid());

-- Parents can view and create notes for their children
CREATE POLICY parent_notes_view ON public.parent_notes
FOR SELECT USING (parent_id = auth.uid());

CREATE POLICY parent_notes_insert ON public.parent_notes
FOR INSERT WITH CHECK (parent_id = auth.uid());

CREATE POLICY parent_notes_update ON public.parent_notes
FOR UPDATE USING (parent_id = auth.uid());

COMMIT;