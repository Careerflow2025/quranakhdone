-- ============================================================================
-- CONSOLIDATED MIGRATION: Merge QURAN and Quranakh schemas
-- Purpose: Ensure all required tables and columns exist for school management UI
-- ============================================================================

BEGIN;

-- ============================================================================
-- CLASSES TABLE ENHANCEMENTS (from teacher dashboard migration)
-- ============================================================================

ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#10b981',
  ADD COLUMN IF NOT EXISTS icon VARCHAR(50) DEFAULT 'book-open',
  ADD COLUMN IF NOT EXISTS capacity INT DEFAULT 30,
  ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS semester VARCHAR(50);

-- room column might already exist from main schema, but safe to add IF NOT EXISTS
ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS room TEXT;

-- ============================================================================
-- TEACHER DASHBOARD TABLES
-- ============================================================================

-- Teacher dashboard settings for preferences
CREATE TABLE IF NOT EXISTS public.teacher_dashboard_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  show_student_sidebar BOOLEAN DEFAULT true,
  cards_per_row INT DEFAULT 3 CHECK (cards_per_row IN (2, 3, 4)),
  default_view VARCHAR(20) DEFAULT 'cards' CHECK (default_view IN ('cards', 'list', 'calendar')),
  theme_mode VARCHAR(20) DEFAULT 'light' CHECK (theme_mode IN ('light', 'dark', 'system')),
  quick_actions JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, school_id)
);

-- Temporary students table for bulk import
CREATE TABLE IF NOT EXISTS public.imported_students_temp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  parent_name TEXT,
  parent_email TEXT,
  parent_phone TEXT,
  assigned BOOLEAN DEFAULT false,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Analytics for dashboard
CREATE TABLE IF NOT EXISTS public.teacher_dashboard_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- PARENT DASHBOARD TABLES
-- ============================================================================

-- Parent notes on student progress
CREATE TABLE IF NOT EXISTS public.parent_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  page_number INT NOT NULL,
  note_text TEXT NOT NULL,
  is_visible_to_teacher BOOLEAN DEFAULT true,
  teacher_response TEXT,
  teacher_responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add parent visibility flag to annotations
ALTER TABLE public.annotations
ADD COLUMN IF NOT EXISTS is_visible_to_parent BOOLEAN DEFAULT true;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_classes_display_order ON public.classes(school_id, display_order);
CREATE INDEX IF NOT EXISTS idx_classes_active ON public.classes(school_id, active);
CREATE INDEX IF NOT EXISTS idx_imported_students_temp_user ON public.imported_students_temp(user_id, school_id);
CREATE INDEX IF NOT EXISTS idx_teacher_analytics_action ON public.teacher_dashboard_analytics(teacher_id, action_type);
CREATE INDEX IF NOT EXISTS idx_parent_notes_parent_student ON public.parent_notes(parent_id, student_id);
CREATE INDEX IF NOT EXISTS idx_parent_notes_page ON public.parent_notes(student_id, page_number);

-- ============================================================================
-- ENABLE RLS ON NEW TABLES
-- ============================================================================

ALTER TABLE public.teacher_dashboard_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imported_students_temp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_dashboard_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_notes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Teacher dashboard settings - users can only see/modify their own
DO $$ BEGIN
  DROP POLICY IF EXISTS teacher_dashboard_settings_policy ON public.teacher_dashboard_settings;
  CREATE POLICY teacher_dashboard_settings_policy ON public.teacher_dashboard_settings
    FOR ALL USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Imported students temp - users can only see their own imports
DO $$ BEGIN
  DROP POLICY IF EXISTS imported_students_temp_policy ON public.imported_students_temp;
  CREATE POLICY imported_students_temp_policy ON public.imported_students_temp
    FOR ALL USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Teacher analytics - teachers can only see their own analytics
DO $$ BEGIN
  DROP POLICY IF EXISTS teacher_dashboard_analytics_policy ON public.teacher_dashboard_analytics;
  CREATE POLICY teacher_dashboard_analytics_policy ON public.teacher_dashboard_analytics
    FOR ALL USING (teacher_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Parent notes - parents can view and create notes for their children
DO $$ BEGIN
  DROP POLICY IF EXISTS parent_notes_view ON public.parent_notes;
  CREATE POLICY parent_notes_view ON public.parent_notes
    FOR SELECT USING (
      parent_id IN (
        SELECT id FROM public.parents WHERE user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS parent_notes_insert ON public.parent_notes;
  CREATE POLICY parent_notes_insert ON public.parent_notes
    FOR INSERT WITH CHECK (
      parent_id IN (
        SELECT id FROM public.parents WHERE user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS parent_notes_update ON public.parent_notes;
  CREATE POLICY parent_notes_update ON public.parent_notes
    FOR UPDATE USING (
      parent_id IN (
        SELECT id FROM public.parents WHERE user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Teachers can also see parent notes for their students
DO $$ BEGIN
  DROP POLICY IF EXISTS parent_notes_teacher_view ON public.parent_notes;
  CREATE POLICY parent_notes_teacher_view ON public.parent_notes
    FOR SELECT USING (
      is_visible_to_teacher = true
      AND student_id IN (
        SELECT s.id FROM public.students s
        JOIN public.class_enrollments ce ON ce.student_id = s.id
        JOIN public.class_teachers ct ON ct.class_id = ce.class_id
        JOIN public.teachers t ON t.id = ct.teacher_id
        WHERE t.user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- TRIGGER FUNCTION FOR UPDATING TIMESTAMPS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to teacher dashboard settings
DO $$ BEGIN
  DROP TRIGGER IF EXISTS update_teacher_dashboard_settings_updated_at ON public.teacher_dashboard_settings;
  CREATE TRIGGER update_teacher_dashboard_settings_updated_at BEFORE UPDATE
    ON public.teacher_dashboard_settings FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Apply trigger to parent notes
DO $$ BEGIN
  DROP TRIGGER IF EXISTS update_parent_notes_updated_at ON public.parent_notes;
  CREATE TRIGGER update_parent_notes_updated_at BEFORE UPDATE
    ON public.parent_notes FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Consolidated Migration: SUCCESS!';
  RAISE NOTICE '📋 Added/Updated:';
  RAISE NOTICE '  - Enhanced classes table with display_order, color, icon, capacity, active, semester';
  RAISE NOTICE '  - teacher_dashboard_settings table';
  RAISE NOTICE '  - imported_students_temp table';
  RAISE NOTICE '  - teacher_dashboard_analytics table';
  RAISE NOTICE '  - parent_notes table';
  RAISE NOTICE '  - is_visible_to_parent column on annotations';
  RAISE NOTICE '  - All necessary indexes and RLS policies';
  RAISE NOTICE '🔒 Row Level Security ENABLED on all new tables';
END $$;

COMMIT;
