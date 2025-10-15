-- SUPABASE MIGRATION SCRIPT FOR QURANAKH V2
-- Updated with Homework, Targets, and enhanced features
-- Run this in Supabase SQL Editor to create all tables

-- Drop existing types if they exist (for clean migration)
DROP TYPE IF EXISTS role CASCADE;
DROP TYPE IF EXISTS assignment_status CASCADE;
DROP TYPE IF EXISTS mistake_type CASCADE;
DROP TYPE IF EXISTS attendance_status CASCADE;
DROP TYPE IF EXISTS note_type CASCADE;
DROP TYPE IF EXISTS mastery_level CASCADE;
DROP TYPE IF EXISTS notif_channel CASCADE;
DROP TYPE IF EXISTS homework_status CASCADE;
DROP TYPE IF EXISTS target_type CASCADE;
DROP TYPE IF EXISTS target_category CASCADE;
DROP TYPE IF EXISTS target_status CASCADE;

-- Create enums
CREATE TYPE role AS ENUM ('owner', 'admin', 'teacher', 'student', 'parent');
CREATE TYPE assignment_status AS ENUM ('assigned', 'viewed', 'submitted', 'reviewed', 'completed', 'reopened');
CREATE TYPE homework_status AS ENUM ('pending', 'in-progress', 'overdue', 'completed', 'reviewed');
CREATE TYPE mistake_type AS ENUM ('homework', 'recap', 'tajweed', 'haraka', 'letter');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'excused');
CREATE TYPE note_type AS ENUM ('text', 'audio');
CREATE TYPE mastery_level AS ENUM ('unknown', 'learning', 'proficient', 'mastered');
CREATE TYPE notif_channel AS ENUM ('in_app', 'email', 'push');
CREATE TYPE target_type AS ENUM ('individual', 'class', 'school');
CREATE TYPE target_category AS ENUM ('memorization', 'tajweed', 'recitation', 'revision', 'practice');
CREATE TYPE target_status AS ENUM ('draft', 'active', 'paused', 'completed', 'archived');

-- Create schools table
CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  timezone TEXT DEFAULT 'Africa/Casablanca',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create profiles table
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  role role NOT NULL,
  display_name TEXT,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create teachers table
CREATE TABLE teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  bio TEXT,
  active BOOLEAN DEFAULT true
);

-- Create students table with enhanced fields
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  dob DATE,
  gender TEXT,
  active BOOLEAN DEFAULT true,
  current_surah INT DEFAULT 1,
  current_ayah INT DEFAULT 1,
  last_page_visited INT DEFAULT 1,
  last_surah_visited INT DEFAULT 1,
  memorized_juz INT DEFAULT 0,
  revision_juz INT DEFAULT 0,
  physical_attendance_percent INT DEFAULT 100,
  platform_activity_percent INT DEFAULT 100,
  last_activity TIMESTAMPTZ DEFAULT NOW()
);

-- Create parents table
CREATE TABLE parents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE
);

-- Create parent_students junction table
CREATE TABLE parent_students (
  parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  PRIMARY KEY (parent_id, student_id)
);

-- Create classes table
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  room TEXT,
  schedule_json JSONB NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES teachers(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create class_teachers junction table
CREATE TABLE class_teachers (
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
  PRIMARY KEY (class_id, teacher_id)
);

-- Create class_enrollments junction table
CREATE TABLE class_enrollments (
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  PRIMARY KEY (class_id, student_id)
);

-- Create attendance table
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status attendance_status NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create quran_scripts table
CREATE TABLE quran_scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL
);

-- Create quran_ayahs table
CREATE TABLE quran_ayahs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id UUID NOT NULL REFERENCES quran_scripts(id) ON DELETE CASCADE,
  surah INT NOT NULL,
  ayah INT NOT NULL,
  text TEXT NOT NULL,
  token_positions JSONB NOT NULL,
  UNIQUE (script_id, surah, ayah)
);

-- Create highlights table with homework support
CREATE TABLE highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  script_id UUID NOT NULL REFERENCES quran_scripts(id),
  ayah_id UUID NOT NULL REFERENCES quran_ayahs(id),
  token_start INT NOT NULL,
  token_end INT NOT NULL,
  mistake mistake_type NOT NULL,
  color TEXT NOT NULL,
  highlight_type TEXT DEFAULT 'assignment', -- 'homework' or 'assignment'
  due_date TIMESTAMPTZ,
  status homework_status,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notes table
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  highlight_id UUID NOT NULL REFERENCES highlights(id) ON DELETE CASCADE,
  author_user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  type note_type NOT NULL,
  text TEXT,
  audio_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK ((type='text' AND text IS NOT NULL) OR (type='audio' AND audio_url IS NOT NULL))
);

-- Create homework table (separate from assignments)
CREATE TABLE homework (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  created_by_teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE SET NULL,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  surah INT,
  ayah_start INT,
  ayah_end INT,
  highlight_id UUID REFERENCES highlights(id),
  status homework_status NOT NULL DEFAULT 'pending',
  due_at TIMESTAMPTZ NOT NULL,
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create targets table
CREATE TABLE targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  created_by_teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  type target_type NOT NULL,
  category target_category NOT NULL,
  status target_status NOT NULL DEFAULT 'active',
  start_date DATE NOT NULL,
  due_date DATE NOT NULL,
  total_units INT, -- pages, lessons, surahs, etc
  completed_units INT DEFAULT 0,
  progress_percent INT GENERATED ALWAYS AS (
    CASE
      WHEN total_units > 0 THEN (completed_units * 100 / total_units)
      ELSE 0
    END
  ) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create target_students junction table
CREATE TABLE target_students (
  target_id UUID NOT NULL REFERENCES targets(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  individual_progress INT DEFAULT 0,
  last_activity TIMESTAMPTZ,
  todays_practice_minutes INT DEFAULT 0,
  weekly_average_minutes INT DEFAULT 0,
  PRIMARY KEY (target_id, student_id)
);

-- Create target_milestones table
CREATE TABLE target_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id UUID NOT NULL REFERENCES targets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  due_date DATE NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  order_index INT NOT NULL
);

-- Create assignments table
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  created_by_teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status assignment_status NOT NULL DEFAULT 'assigned',
  due_at TIMESTAMPTZ NOT NULL,
  late BOOLEAN GENERATED ALWAYS AS (CASE WHEN NOW() > due_at AND status <> 'completed' THEN true ELSE false END) STORED,
  reopen_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create assignment_events table
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

-- Create assignment_submissions table
CREATE TABLE assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create assignment_attachments table
CREATE TABLE assignment_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  uploader_user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create rubrics table
CREATE TABLE rubrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT
);

-- Create rubric_criteria table
CREATE TABLE rubric_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rubric_id UUID NOT NULL REFERENCES rubrics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  weight NUMERIC NOT NULL DEFAULT 1,
  max_score NUMERIC NOT NULL DEFAULT 100
);

-- Create assignment_rubrics junction table
CREATE TABLE assignment_rubrics (
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  rubric_id UUID NOT NULL REFERENCES rubrics(id) ON DELETE CASCADE,
  PRIMARY KEY (assignment_id, rubric_id)
);

-- Create grades table
CREATE TABLE grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  criterion_id UUID NOT NULL REFERENCES rubric_criteria(id) ON DELETE CASCADE,
  score NUMERIC NOT NULL,
  max_score NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ayah_mastery table
CREATE TABLE ayah_mastery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  script_id UUID NOT NULL REFERENCES quran_scripts(id),
  ayah_id UUID NOT NULL REFERENCES quran_ayahs(id),
  level mastery_level NOT NULL DEFAULT 'unknown',
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (student_id, script_id, ayah_id)
);

-- Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  channel notif_channel NOT NULL,
  type TEXT NOT NULL,
  payload JSONB NOT NULL,
  sent_at TIMESTAMPTZ
);

-- Create devices table
CREATE TABLE devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  push_token TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create pen_annotations table (for StudentManagementDashboard)
CREATE TABLE pen_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE SET NULL,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  surah INT NOT NULL,
  ayah INT NOT NULL,
  drawing_data JSONB NOT NULL,
  color TEXT NOT NULL,
  thickness INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  subject TEXT,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_assignments_student_due ON assignments(student_id, due_at);
CREATE INDEX idx_homework_student_due ON homework(student_id, due_at);
CREATE INDEX idx_highlights_student_ayah ON highlights(student_id, ayah_id);
CREATE INDEX idx_highlights_type ON highlights(highlight_type);
CREATE INDEX idx_grades_assignment_student ON grades(assignment_id, student_id);
CREATE INDEX idx_profiles_school_id ON profiles(school_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_sent_at ON notifications(sent_at);
CREATE INDEX idx_targets_status ON targets(status);
CREATE INDEX idx_target_students_student ON target_students(student_id);
CREATE INDEX idx_messages_recipient ON messages(recipient_id, read);

-- Enable Row Level Security on all tables
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
ALTER TABLE homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE target_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE target_milestones ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE pen_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;