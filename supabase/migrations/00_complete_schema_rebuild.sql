-- ============================================================================
-- QURANAKH COMPLETE SCHEMA REBUILD
-- Generated: From CLAUDE.md spec + discovered code requirements
-- Purpose: Replace broken simplified database with full comprehensive schema
-- ============================================================================

-- Step 1: Clean slate - drop everything
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- Step 2: Create ENUMs
DO $$ BEGIN
  CREATE TYPE role AS ENUM ('owner','admin','teacher','student','parent');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE assignment_status AS ENUM ('assigned','viewed','submitted','reviewed','completed','reopened');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE mistake_type AS ENUM ('recap','tajweed','haraka','letter');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE attendance_status AS ENUM ('present','absent','late','excused');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE note_type AS ENUM ('text','audio');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE mastery_level AS ENUM ('unknown','learning','proficient','mastered');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE notif_channel AS ENUM ('in_app','email','push');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============================================================================
-- CORE TENANCY & USERS
-- ============================================================================

CREATE TABLE schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  timezone text DEFAULT 'Africa/Casablanca',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  role role NOT NULL,
  display_name text,
  email text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  bio text,
  active boolean DEFAULT true
);

CREATE TABLE students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  dob date,
  gender text,
  active boolean DEFAULT true
);

CREATE TABLE parents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE
);

CREATE TABLE parent_students (
  parent_id uuid NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  PRIMARY KEY (parent_id, student_id)
);

-- ============================================================================
-- CLASSES & ATTENDANCE
-- ============================================================================

CREATE TABLE classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  room text,
  schedule_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES teachers(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE class_teachers (
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES teachers(id) ON DELETE CASCADE,
  PRIMARY KEY (class_id, teacher_id)
);

CREATE TABLE class_enrollments (
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE,
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  PRIMARY KEY (class_id, student_id)
);

CREATE TABLE attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  session_date date NOT NULL,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status attendance_status NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- QURAN TEXT & SCRIPTS
-- ============================================================================

CREATE TABLE quran_scripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  display_name text NOT NULL
);

CREATE TABLE quran_ayahs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id uuid NOT NULL REFERENCES quran_scripts(id) ON DELETE CASCADE,
  surah int NOT NULL,
  ayah int NOT NULL,
  text text NOT NULL,
  token_positions jsonb NOT NULL,
  UNIQUE (script_id, surah, ayah)
);

-- ============================================================================
-- HIGHLIGHTS & NOTES (Original Spec)
-- ============================================================================

CREATE TABLE highlights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES teachers(id) ON DELETE SET NULL,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  script_id uuid NOT NULL REFERENCES quran_scripts(id),
  ayah_id uuid NOT NULL REFERENCES quran_ayahs(id),
  token_start int NOT NULL,
  token_end int NOT NULL,
  mistake mistake_type NOT NULL,
  color text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  highlight_id uuid NOT NULL REFERENCES highlights(id) ON DELETE CASCADE,
  author_user_id uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  type note_type NOT NULL,
  text text,
  audio_url text,
  created_at timestamptz DEFAULT now(),
  CHECK ((type='text' AND text IS NOT NULL) OR (type='audio' AND audio_url IS NOT NULL))
);

-- ============================================================================
-- ANNOTATIONS (Discovered from code - Quran page annotations with canvas)
-- ============================================================================

CREATE TABLE annotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id uuid REFERENCES classes(id) ON DELETE SET NULL,
  page_number int NOT NULL,
  tool_type text NOT NULL,
  payload jsonb NOT NULL, -- fabric.js canvas JSON
  created_by uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE annotated_renders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  page_number int NOT NULL,
  storage_path text NOT NULL, -- Path in Supabase Storage
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- ASSIGNMENTS SYSTEM
-- ============================================================================

CREATE TABLE assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  created_by_teacher_id uuid NOT NULL REFERENCES teachers(id) ON DELETE SET NULL,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status assignment_status NOT NULL DEFAULT 'assigned',
  due_at timestamptz NOT NULL,
  late boolean DEFAULT false,
  reopen_count int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE assignment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  actor_user_id uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  from_status assignment_status,
  to_status assignment_status,
  meta jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE assignment_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  text text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE assignment_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  uploader_user_id uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  url text NOT NULL,
  mime_type text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- RUBRICS & GRADEBOOK
-- ============================================================================

CREATE TABLE rubrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text
);

CREATE TABLE rubric_criteria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rubric_id uuid NOT NULL REFERENCES rubrics(id) ON DELETE CASCADE,
  name text NOT NULL,
  weight numeric NOT NULL DEFAULT 1,
  max_score numeric NOT NULL DEFAULT 100
);

CREATE TABLE assignment_rubrics (
  assignment_id uuid NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  rubric_id uuid NOT NULL REFERENCES rubrics(id) ON DELETE CASCADE,
  PRIMARY KEY (assignment_id, rubric_id)
);

CREATE TABLE grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  criterion_id uuid NOT NULL REFERENCES rubric_criteria(id) ON DELETE CASCADE,
  score numeric NOT NULL,
  max_score numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- PER-AYAH MASTERY TRACKING
-- ============================================================================

CREATE TABLE ayah_mastery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  script_id uuid NOT NULL REFERENCES quran_scripts(id),
  ayah_id uuid NOT NULL REFERENCES quran_ayahs(id),
  level mastery_level NOT NULL DEFAULT 'unknown',
  last_updated timestamptz DEFAULT now(),
  UNIQUE (student_id, script_id, ayah_id)
);

-- ============================================================================
-- NOTIFICATIONS & DEVICES
-- ============================================================================

CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  channel notif_channel NOT NULL,
  type text NOT NULL,
  payload jsonb NOT NULL,
  sent_at timestamptz
);

CREATE TABLE devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  push_token text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- AUDIT LOG (Discovered from code)
-- ============================================================================

CREATE TABLE audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  role role NOT NULL,
  event_key text NOT NULL,
  entity_id uuid,
  entity_type text,
  meta jsonb,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- HELPFUL INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_profiles_school_id ON profiles(school_id);
CREATE INDEX idx_teachers_user_id ON teachers(user_id);
CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_parents_user_id ON parents(user_id);

CREATE INDEX idx_classes_school_id ON classes(school_id);
CREATE INDEX idx_class_enrollments_student_id ON class_enrollments(student_id);
CREATE INDEX idx_class_teachers_teacher_id ON class_teachers(teacher_id);

CREATE INDEX idx_annotations_student_id ON annotations(student_id);
CREATE INDEX idx_annotations_school_id ON annotations(school_id);
CREATE INDEX idx_annotated_renders_student_page ON annotated_renders(student_id, page_number);

CREATE INDEX idx_assignments_student_due ON assignments(student_id, due_at);
CREATE INDEX idx_assignments_school_id ON assignments(school_id);
CREATE INDEX idx_assignment_events_assignment_id ON assignment_events(assignment_id);

CREATE INDEX idx_highlights_student_ayah ON highlights(student_id, ayah_id);
CREATE INDEX idx_highlights_school_id ON highlights(school_id);
CREATE INDEX idx_notes_highlight_id ON notes(highlight_id);

CREATE INDEX idx_grades_assignment_student ON grades(assignment_id, student_id);
CREATE INDEX idx_ayah_mastery_student ON ayah_mastery(student_id);

CREATE INDEX idx_audit_log_school_id ON audit_log(school_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);

-- ============================================================================
-- RLS HELPER VIEW
-- ============================================================================

CREATE OR REPLACE VIEW me AS
  SELECT p.user_id, p.school_id, p.role
  FROM profiles p
  WHERE p.user_id = auth.uid();

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================================================

ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE quran_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE quran_ayahs ENABLE ROW LEVEL SECURITY;
ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE annotated_renders ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE rubrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE rubric_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_rubrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE ayah_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES - SCHOOLS
-- ============================================================================

CREATE POLICY "Users can view their own school"
  ON schools FOR SELECT
  USING (id = (SELECT school_id FROM me));

CREATE POLICY "Owners/Admins can update their school"
  ON schools FOR UPDATE
  USING (
    id = (SELECT school_id FROM me)
    AND (SELECT role FROM me) IN ('owner', 'admin')
  )
  WITH CHECK (
    id = (SELECT school_id FROM me)
  );

-- ============================================================================
-- RLS POLICIES - PROFILES
-- ============================================================================

CREATE POLICY "Users can view profiles in their school"
  ON profiles FOR SELECT
  USING (school_id = (SELECT school_id FROM me));

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND school_id = (SELECT school_id FROM me));

CREATE POLICY "Owners/Admins can create profiles in their school"
  ON profiles FOR INSERT
  WITH CHECK (
    school_id = (SELECT school_id FROM me)
    AND (SELECT role FROM me) IN ('owner', 'admin')
  );

-- ============================================================================
-- RLS POLICIES - TEACHERS, STUDENTS, PARENTS
-- ============================================================================

CREATE POLICY "View teachers in my school"
  ON teachers FOR SELECT
  USING (
    user_id IN (
      SELECT p.user_id FROM profiles p
      WHERE p.school_id = (SELECT school_id FROM me)
    )
  );

CREATE POLICY "View students in my school"
  ON students FOR SELECT
  USING (
    user_id IN (
      SELECT p.user_id FROM profiles p
      WHERE p.school_id = (SELECT school_id FROM me)
    )
  );

CREATE POLICY "View parents in my school"
  ON parents FOR SELECT
  USING (
    user_id IN (
      SELECT p.user_id FROM profiles p
      WHERE p.school_id = (SELECT school_id FROM me)
    )
  );

-- ============================================================================
-- RLS POLICIES - CLASSES
-- ============================================================================

CREATE POLICY "View classes in my school"
  ON classes FOR SELECT
  USING (school_id = (SELECT school_id FROM me));

CREATE POLICY "Teachers can create classes in their school"
  ON classes FOR INSERT
  WITH CHECK (
    school_id = (SELECT school_id FROM me)
    AND (SELECT role FROM me) IN ('owner', 'admin', 'teacher')
  );

CREATE POLICY "Teachers can update their own classes"
  ON classes FOR UPDATE
  USING (
    school_id = (SELECT school_id FROM me)
    AND (
      (SELECT role FROM me) IN ('owner', 'admin')
      OR created_by IN (SELECT t.id FROM teachers t WHERE t.user_id = auth.uid())
    )
  );

-- ============================================================================
-- RLS POLICIES - ANNOTATIONS
-- ============================================================================

CREATE POLICY "View annotations in my school"
  ON annotations FOR SELECT
  USING (school_id = (SELECT school_id FROM me));

CREATE POLICY "Teachers can create annotations in their school"
  ON annotations FOR INSERT
  WITH CHECK (
    school_id = (SELECT school_id FROM me)
    AND (SELECT role FROM me) IN ('teacher', 'owner', 'admin')
  );

CREATE POLICY "Teachers can update their own annotations"
  ON annotations FOR UPDATE
  USING (
    school_id = (SELECT school_id FROM me)
    AND created_by = auth.uid()
  );

-- ============================================================================
-- RLS POLICIES - ANNOTATED RENDERS
-- ============================================================================

CREATE POLICY "View annotated renders for students in my school"
  ON annotated_renders FOR SELECT
  USING (
    student_id IN (
      SELECT s.id FROM students s
      JOIN profiles p ON p.user_id = s.user_id
      WHERE p.school_id = (SELECT school_id FROM me)
    )
  );

CREATE POLICY "Teachers can create annotated renders"
  ON annotated_renders FOR INSERT
  WITH CHECK (
    (SELECT role FROM me) IN ('teacher', 'owner', 'admin')
    AND student_id IN (
      SELECT s.id FROM students s
      JOIN profiles p ON p.user_id = s.user_id
      WHERE p.school_id = (SELECT school_id FROM me)
    )
  );

-- ============================================================================
-- RLS POLICIES - ASSIGNMENTS
-- ============================================================================

CREATE POLICY "View assignments in my school"
  ON assignments FOR SELECT
  USING (school_id = (SELECT school_id FROM me));

CREATE POLICY "Teachers can create assignments"
  ON assignments FOR INSERT
  WITH CHECK (
    school_id = (SELECT school_id FROM me)
    AND (SELECT role FROM me) IN ('teacher', 'owner', 'admin')
    AND created_by_teacher_id IN (
      SELECT t.id FROM teachers t WHERE t.user_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update their assignments"
  ON assignments FOR UPDATE
  USING (
    school_id = (SELECT school_id FROM me)
    AND (
      (SELECT role FROM me) IN ('owner', 'admin')
      OR created_by_teacher_id IN (
        SELECT t.id FROM teachers t WHERE t.user_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- RLS POLICIES - ASSIGNMENT SUBMISSIONS
-- ============================================================================

CREATE POLICY "View submissions for assignments in my school"
  ON assignment_submissions FOR SELECT
  USING (
    assignment_id IN (
      SELECT a.id FROM assignments a
      WHERE a.school_id = (SELECT school_id FROM me)
    )
  );

CREATE POLICY "Students can create submissions for their assignments"
  ON assignment_submissions FOR INSERT
  WITH CHECK (
    student_id IN (SELECT s.id FROM students s WHERE s.user_id = auth.uid())
    AND assignment_id IN (
      SELECT a.id FROM assignments a
      WHERE a.student_id = student_id
    )
  );

-- ============================================================================
-- RLS POLICIES - GRADES
-- ============================================================================

CREATE POLICY "View grades in my school"
  ON grades FOR SELECT
  USING (
    assignment_id IN (
      SELECT a.id FROM assignments a
      WHERE a.school_id = (SELECT school_id FROM me)
    )
  );

CREATE POLICY "Teachers can create grades"
  ON grades FOR INSERT
  WITH CHECK (
    (SELECT role FROM me) IN ('teacher', 'owner', 'admin')
    AND assignment_id IN (
      SELECT a.id FROM assignments a
      WHERE a.school_id = (SELECT school_id FROM me)
    )
  );

-- ============================================================================
-- RLS POLICIES - AUDIT LOG
-- ============================================================================

CREATE POLICY "View audit log in my school"
  ON audit_log FOR SELECT
  USING (
    school_id = (SELECT school_id FROM me)
    AND (SELECT role FROM me) IN ('owner', 'admin')
  );

CREATE POLICY "All authenticated users can create audit log entries"
  ON audit_log FOR INSERT
  WITH CHECK (
    school_id = (SELECT school_id FROM me)
    AND actor_id = auth.uid()
  );

-- ============================================================================
-- RLS POLICIES - QURAN TEXT (Public read access)
-- ============================================================================

CREATE POLICY "Anyone can view Quran scripts"
  ON quran_scripts FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view Quran ayahs"
  ON quran_ayahs FOR SELECT
  USING (true);

-- ============================================================================
-- RLS POLICIES - PARENT ACCESS (Read-only to linked children)
-- ============================================================================

CREATE POLICY "Parents can view their children's assignments"
  ON assignments FOR SELECT
  USING (
    (SELECT role FROM me) = 'parent'
    AND student_id IN (
      SELECT ps.student_id FROM parents pr
      JOIN parent_students ps ON ps.parent_id = pr.id
      WHERE pr.user_id = auth.uid()
    )
  );

CREATE POLICY "Parents can view their children's grades"
  ON grades FOR SELECT
  USING (
    (SELECT role FROM me) = 'parent'
    AND student_id IN (
      SELECT ps.student_id FROM parents pr
      JOIN parent_students ps ON ps.parent_id = pr.id
      WHERE pr.user_id = auth.uid()
    )
  );

-- ============================================================================
-- TRIGGER: Auto-create profile on user signup
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, school_id, role, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    -- Default school_id - must be set properly during signup
    (SELECT id FROM schools LIMIT 1),
    'student', -- Default role
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ QuranAkh Complete Schema Rebuild: SUCCESS!';
  RAISE NOTICE '📊 Created 25+ tables with proper multi-tenant RLS';
  RAISE NOTICE '🔒 Row Level Security ENABLED on all tables';
  RAISE NOTICE '🏫 Multi-tenant isolation via school_id enforced';
  RAISE NOTICE '📝 Includes: Assignments, Annotations, Gradebook, Mastery Tracking';
  RAISE NOTICE '⚠️  IMPORTANT: Load Quran text data next!';
END $$;