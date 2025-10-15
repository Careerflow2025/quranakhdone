BEGIN;

-- Ensure classes table has all necessary fields
ALTER TABLE public.classes 
  ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#10b981',
  ADD COLUMN IF NOT EXISTS icon VARCHAR(50) DEFAULT 'book-open',
  ADD COLUMN IF NOT EXISTS capacity INT DEFAULT 30,
  ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS semester VARCHAR(50),
  ADD COLUMN IF NOT EXISTS room VARCHAR(50);

-- Add teacher_dashboard_settings for preferences
CREATE TABLE IF NOT EXISTS public.teacher_dashboard_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
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
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
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
  teacher_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.teacher_dashboard_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imported_students_temp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_dashboard_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY teacher_dashboard_settings_policy ON public.teacher_dashboard_settings
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY imported_students_temp_policy ON public.imported_students_temp
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY teacher_dashboard_analytics_policy ON public.teacher_dashboard_analytics
  FOR ALL USING (teacher_id = auth.uid());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_classes_display_order ON public.classes(school_id, display_order);
CREATE INDEX IF NOT EXISTS idx_classes_active ON public.classes(school_id, active);
CREATE INDEX IF NOT EXISTS idx_imported_students_temp_user ON public.imported_students_temp(user_id, school_id);
CREATE INDEX IF NOT EXISTS idx_teacher_analytics_action ON public.teacher_dashboard_analytics(teacher_id, action_type);

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for updating timestamp
CREATE TRIGGER update_teacher_dashboard_settings_updated_at BEFORE UPDATE
  ON public.teacher_dashboard_settings FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMIT;