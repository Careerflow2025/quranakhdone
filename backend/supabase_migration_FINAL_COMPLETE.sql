-- ============================================
-- QURANAKH COMPLETE DATABASE SCHEMA - FINAL VERSION
-- Includes: Highlights, Pen Annotations, Voice Notes,
-- Homework, Targets, Messages, and Complete Annotation System
-- ============================================

-- Clean slate (remove existing types if any)
DROP TYPE IF EXISTS role CASCADE;
DROP TYPE IF EXISTS assignment_status CASCADE;
DROP TYPE IF EXISTS homework_status CASCADE;
DROP TYPE IF EXISTS mistake_type CASCADE;
DROP TYPE IF EXISTS attendance_status CASCADE;
DROP TYPE IF EXISTS note_type CASCADE;
DROP TYPE IF EXISTS mastery_level CASCADE;
DROP TYPE IF EXISTS notif_channel CASCADE;
DROP TYPE IF EXISTS target_type CASCADE;
DROP TYPE IF EXISTS target_category CASCADE;
DROP TYPE IF EXISTS target_status CASCADE;
DROP TYPE IF EXISTS annotation_type CASCADE;

-- ============================================
-- ENUM TYPES
-- ============================================

CREATE TYPE role AS ENUM ('owner', 'admin', 'teacher', 'student', 'parent');
CREATE TYPE assignment_status AS ENUM ('assigned', 'viewed', 'submitted', 'reviewed', 'completed', 'reopened');
CREATE TYPE homework_status AS ENUM ('pending', 'in-progress', 'overdue', 'completed', 'reviewed');
CREATE TYPE mistake_type AS ENUM ('homework', 'recap', 'tajweed', 'haraka', 'letter', 'completed');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'excused');
CREATE TYPE note_type AS ENUM ('text', 'audio');
CREATE TYPE mastery_level AS ENUM ('unknown', 'learning', 'proficient', 'mastered');
CREATE TYPE notif_channel AS ENUM ('in_app', 'email', 'push');
CREATE TYPE target_type AS ENUM ('individual', 'class', 'school');
CREATE TYPE target_category AS ENUM ('memorization', 'tajweed', 'recitation', 'revision', 'practice');
CREATE TYPE target_status AS ENUM ('draft', 'active', 'paused', 'completed', 'archived');
CREATE TYPE annotation_type AS ENUM ('highlight', 'pen', 'voice', 'text', 'combined');

-- ============================================
-- CORE TABLES
-- ============================================

-- Schools (Multi-tenancy)
CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  timezone TEXT DEFAULT 'Africa/Casablanca',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Profiles
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  role role NOT NULL,
  display_name TEXT,
  email TEXT NOT NULL,
  avatar_url TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teachers
CREATE TABLE teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  bio TEXT,
  specializations TEXT[],
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Students with enhanced tracking
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  dob DATE,
  gender TEXT,
  active BOOLEAN DEFAULT true,
  -- Navigation tracking
  current_surah INT DEFAULT 1,
  current_ayah INT DEFAULT 1,
  last_page_visited INT DEFAULT 1,
  last_surah_visited INT DEFAULT 1,
  last_mushaf_page INT DEFAULT 1,
  -- Progress tracking
  memorized_juz INT DEFAULT 0,
  revision_juz INT DEFAULT 0,
  memorized_verses INT DEFAULT 0,
  -- Activity tracking
  physical_attendance_percent INT DEFAULT 100,
  platform_activity_percent INT DEFAULT 100,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  total_practice_minutes INT DEFAULT 0,
  current_streak_days INT DEFAULT 0,
  longest_streak_days INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Parents
CREATE TABLE parents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Parent-Student relationships
CREATE TABLE parent_students (
  parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  relationship TEXT DEFAULT 'parent', -- parent, guardian, etc.
  PRIMARY KEY (parent_id, student_id)
);

-- ============================================
-- CLASS MANAGEMENT
-- ============================================

CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  room TEXT,
  schedule_json JSONB NOT NULL DEFAULT '{}',
  capacity INT DEFAULT 30,
  created_by UUID REFERENCES teachers(id),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE class_teachers (
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  PRIMARY KEY (class_id, teacher_id)
);

CREATE TABLE class_enrollments (
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (class_id, student_id)
);

CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status attendance_status NOT NULL,
  notes TEXT,
  marked_by UUID REFERENCES teachers(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- QURAN DATA
-- ============================================

CREATE TABLE quran_scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- 'uthmani-hafs', 'indopak', etc.
  display_name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false
);

CREATE TABLE quran_ayahs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id UUID NOT NULL REFERENCES quran_scripts(id) ON DELETE CASCADE,
  surah INT NOT NULL,
  ayah INT NOT NULL,
  text TEXT NOT NULL,
  token_positions JSONB NOT NULL, -- For word-level highlighting
  page_number INT, -- Mushaf page number
  juz_number INT,
  hizb_number INT,
  UNIQUE (script_id, surah, ayah)
);

CREATE TABLE mushaf_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_number INT NOT NULL UNIQUE,
  surah_start INT NOT NULL,
  ayah_start INT NOT NULL,
  surah_end INT NOT NULL,
  ayah_end INT NOT NULL,
  juz INT,
  hizb INT,
  content JSONB -- Store page layout data
);

-- ============================================
-- COMPLETE ANNOTATION SYSTEM
-- ============================================

-- Highlights (All 6 types including homework)
CREATE TABLE highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  script_id UUID NOT NULL REFERENCES quran_scripts(id),
  ayah_id UUID NOT NULL REFERENCES quran_ayahs(id),
  -- Highlighting details
  surah INT NOT NULL,
  ayah_number INT NOT NULL,
  word_indices INT[], -- Array of word positions
  token_start INT NOT NULL,
  token_end INT NOT NULL,
  -- Mistake categorization
  mistake mistake_type NOT NULL,
  color TEXT NOT NULL, -- 'green', 'purple', 'orange', 'red', 'brown', 'gold'
  highlight_type TEXT DEFAULT 'assignment', -- 'homework' or 'assignment'
  -- Homework specific
  is_homework BOOLEAN DEFAULT false,
  homework_status homework_status,
  due_date TIMESTAMPTZ,
  -- Metadata
  teacher_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pen Annotations (Canvas drawings)
CREATE TABLE pen_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE SET NULL,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  -- Location
  surah INT NOT NULL,
  ayah INT NOT NULL,
  page_number INT NOT NULL,
  mushaf_page INT,
  -- Drawing data
  drawing_data JSONB NOT NULL, -- Stores paths, points, strokes
  color TEXT NOT NULL, -- Hex color
  thickness INT NOT NULL, -- Line thickness
  is_eraser BOOLEAN DEFAULT false,
  -- Canvas properties
  canvas_width INT,
  canvas_height INT,
  zoom_level INT DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Voice Notes (Audio recordings)
CREATE TABLE voice_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE SET NULL,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  -- Can be attached to various entities
  highlight_id UUID REFERENCES highlights(id) ON DELETE CASCADE,
  homework_id UUID REFERENCES homework(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  -- Location reference
  surah INT,
  ayah INT,
  word_indices INT[],
  -- Audio data
  audio_url TEXT NOT NULL,
  duration_seconds INT,
  transcript TEXT, -- Optional transcription
  mime_type TEXT DEFAULT 'audio/webm',
  file_size INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Text Notes (Written feedback)
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  author_user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  -- Can attach to multiple highlights
  highlight_ids UUID[], -- Array of highlight IDs
  highlight_id UUID REFERENCES highlights(id) ON DELETE CASCADE,
  -- Note content
  type note_type NOT NULL,
  content TEXT NOT NULL,
  audio_url TEXT, -- If type is audio
  -- Location reference
  surah INT,
  ayah INT,
  word_indices INT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK ((type='text' AND content IS NOT NULL) OR (type='audio' AND audio_url IS NOT NULL))
);

-- Note Replies (Discussion threads)
CREATE TABLE note_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  author_user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_student_reply BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- HOMEWORK SYSTEM
-- ============================================

CREATE TABLE homework (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  created_by_teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE SET NULL,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  -- Assignment details
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  -- Quran portion
  surah INT,
  ayah_start INT,
  ayah_end INT,
  highlight_ids UUID[], -- Related green highlights
  -- Status tracking
  status homework_status NOT NULL DEFAULT 'pending',
  due_at TIMESTAMPTZ NOT NULL,
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Homework Submissions
CREATE TABLE homework_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  homework_id UUID NOT NULL REFERENCES homework(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  submission_text TEXT,
  audio_url TEXT,
  attachments TEXT[],
  student_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TARGETS & GOALS
-- ============================================

CREATE TABLE targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  created_by_teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE SET NULL,
  -- Target details
  title TEXT NOT NULL,
  description TEXT,
  type target_type NOT NULL,
  category target_category NOT NULL,
  status target_status NOT NULL DEFAULT 'active',
  -- Timeline
  start_date DATE NOT NULL,
  due_date DATE NOT NULL,
  -- Progress tracking
  total_units INT, -- pages, lessons, surahs, verses, etc.
  completed_units INT DEFAULT 0,
  progress_percent INT GENERATED ALWAYS AS (
    CASE
      WHEN total_units IS NOT NULL AND total_units > 0
      THEN (completed_units * 100 / total_units)
      ELSE 0
    END
  ) STORED,
  -- Metadata
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Student-specific target progress
CREATE TABLE target_students (
  target_id UUID NOT NULL REFERENCES targets(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  -- Individual progress
  individual_progress INT DEFAULT 0,
  individual_units_completed INT DEFAULT 0,
  -- Practice tracking
  last_activity TIMESTAMPTZ,
  todays_practice_minutes INT DEFAULT 0,
  weekly_average_minutes INT DEFAULT 0,
  total_practice_minutes INT DEFAULT 0,
  streak_days INT DEFAULT 0,
  -- Status
  is_active BOOLEAN DEFAULT true,
  completed_at TIMESTAMPTZ,
  PRIMARY KEY (target_id, student_id)
);

-- Target Milestones
CREATE TABLE target_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id UUID NOT NULL REFERENCES targets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  units INT, -- How many units this milestone represents
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES students(id),
  order_index INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Practice Logs
CREATE TABLE practice_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  target_id UUID REFERENCES targets(id) ON DELETE CASCADE,
  practice_date DATE NOT NULL,
  minutes_practiced INT NOT NULL,
  verses_practiced INT,
  pages_practiced INT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, target_id, practice_date)
);

-- ============================================
-- ASSIGNMENTS (Regular)
-- ============================================

CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  created_by_teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id),
  -- Assignment details
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  -- Quran portion
  surah INT,
  ayah_start INT,
  ayah_end INT,
  -- Status tracking
  status assignment_status NOT NULL DEFAULT 'assigned',
  due_at TIMESTAMPTZ NOT NULL,
  late BOOLEAN GENERATED ALWAYS AS (
    CASE WHEN NOW() > due_at AND status NOT IN ('completed', 'reviewed')
    THEN true ELSE false END
  ) STORED,
  reopen_count INT NOT NULL DEFAULT 0,
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assignment Events (Audit trail)
CREATE TABLE assignment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  actor_user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  from_status assignment_status,
  to_status assignment_status,
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assignment Submissions
CREATE TABLE assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  submission_text TEXT,
  audio_url TEXT,
  video_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assignment Attachments
CREATE TABLE assignment_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES assignment_submissions(id) ON DELETE CASCADE,
  uploader_user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  filename TEXT,
  mime_type TEXT NOT NULL,
  file_size INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- GRADING & ASSESSMENT
-- ============================================

CREATE TABLE rubrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES teachers(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE rubric_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rubric_id UUID NOT NULL REFERENCES rubrics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  weight NUMERIC NOT NULL DEFAULT 1,
  max_score NUMERIC NOT NULL DEFAULT 100,
  order_index INT
);

CREATE TABLE assignment_rubrics (
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  rubric_id UUID NOT NULL REFERENCES rubrics(id) ON DELETE CASCADE,
  PRIMARY KEY (assignment_id, rubric_id)
);

CREATE TABLE grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  homework_id UUID REFERENCES homework(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  criterion_id UUID REFERENCES rubric_criteria(id) ON DELETE CASCADE,
  score NUMERIC NOT NULL,
  max_score NUMERIC NOT NULL,
  feedback TEXT,
  graded_by UUID REFERENCES teachers(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PROGRESS TRACKING
-- ============================================

CREATE TABLE ayah_mastery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  script_id UUID NOT NULL REFERENCES quran_scripts(id),
  ayah_id UUID NOT NULL REFERENCES quran_ayahs(id),
  surah INT NOT NULL,
  ayah INT NOT NULL,
  level mastery_level NOT NULL DEFAULT 'unknown',
  attempts INT DEFAULT 0,
  last_attempt TIMESTAMPTZ,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (student_id, script_id, ayah_id)
);

CREATE TABLE mistake_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  mistake_type mistake_type NOT NULL,
  surah INT,
  ayah INT,
  frequency INT DEFAULT 1,
  last_occurrence TIMESTAMPTZ DEFAULT NOW(),
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ
);

-- ============================================
-- COMMUNICATION
-- ============================================

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  thread_id UUID, -- For conversation threading
  subject TEXT,
  content TEXT NOT NULL,
  attachments TEXT[],
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  target_roles role[],
  target_classes UUID[],
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  channel notif_channel NOT NULL,
  type TEXT NOT NULL, -- 'homework_due', 'grade_posted', 'message_received', etc.
  title TEXT,
  body TEXT,
  payload JSONB NOT NULL,
  read BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  device_type TEXT, -- 'web', 'ios', 'android'
  push_token TEXT NOT NULL,
  device_info JSONB,
  last_active TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Core indexes
CREATE INDEX idx_profiles_school_id ON profiles(school_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);

-- Student tracking
CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_students_active ON students(active);
CREATE INDEX idx_students_last_activity ON students(last_activity);

-- Highlights and annotations
CREATE INDEX idx_highlights_student_id ON highlights(student_id);
CREATE INDEX idx_highlights_teacher_id ON highlights(teacher_id);
CREATE INDEX idx_highlights_surah_ayah ON highlights(surah, ayah_number);
CREATE INDEX idx_highlights_type ON highlights(highlight_type);
CREATE INDEX idx_highlights_homework ON highlights(is_homework) WHERE is_homework = true;
CREATE INDEX idx_pen_annotations_student ON pen_annotations(student_id);
CREATE INDEX idx_pen_annotations_page ON pen_annotations(page_number);
CREATE INDEX idx_voice_notes_student ON voice_notes(student_id);
CREATE INDEX idx_notes_highlight ON notes(highlight_id);

-- Homework and assignments
CREATE INDEX idx_homework_student_due ON homework(student_id, due_at);
CREATE INDEX idx_homework_status ON homework(status);
CREATE INDEX idx_assignments_student_due ON assignments(student_id, due_at);
CREATE INDEX idx_assignments_status ON assignments(status);

-- Targets
CREATE INDEX idx_targets_status ON targets(status);
CREATE INDEX idx_target_students_student ON target_students(student_id);
CREATE INDEX idx_target_milestones_target ON target_milestones(target_id);
CREATE INDEX idx_practice_logs_student_date ON practice_logs(student_id, practice_date);

-- Progress and grades
CREATE INDEX idx_grades_student ON grades(student_id);
CREATE INDEX idx_grades_assignment ON grades(assignment_id);
CREATE INDEX idx_ayah_mastery_student ON ayah_mastery(student_id);
CREATE INDEX idx_mistake_analytics_student ON mistake_analytics(student_id);

-- Communication
CREATE INDEX idx_messages_recipient ON messages(recipient_id, read);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, read);
CREATE INDEX idx_notifications_sent ON notifications(sent_at);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
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
ALTER TABLE mushaf_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE pen_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE homework_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE target_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE target_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE rubrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE rubric_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_rubrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE ayah_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE mistake_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;

-- ============================================
-- INITIAL DATA (Optional)
-- ============================================

-- Insert default Quran scripts
INSERT INTO quran_scripts (code, display_name, is_default) VALUES
('uthmani-hafs', 'Uthmani (Hafs)', true),
('indopak', 'Indo-Pak Script', false),
('warsh', 'Warsh', false),
('qaloon', 'Qaloon', false);

-- ============================================
-- END OF SCHEMA
-- ============================================