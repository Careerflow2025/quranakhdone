-- Complete Supabase Schema for Quranakh
-- Run this migration in your Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Schools table (main entity)
CREATE TABLE IF NOT EXISTS public.schools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update auth.users to include role
-- Note: This extends Supabase's built-in auth.users table
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS role VARCHAR(50);
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE;

-- Teachers table
CREATE TABLE IF NOT EXISTS public.teachers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  qualifications TEXT,
  bio TEXT,
  experience TEXT,
  is_independent BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Classes table
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  grade_level VARCHAR(50),
  schedule JSONB,
  room_number VARCHAR(50),
  student_count INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Students table
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  date_of_birth DATE,
  enrollment_date DATE DEFAULT CURRENT_DATE,
  grade_level VARCHAR(50),
  profile_picture_url TEXT,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Parents table
CREATE TABLE IF NOT EXISTS public.parents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  emergency_contact VARCHAR(20),
  relationship VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Parent-Student relationship (many-to-many)
CREATE TABLE IF NOT EXISTS public.parent_students (
  parent_id UUID REFERENCES public.parents(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  PRIMARY KEY (parent_id, student_id)
);

-- Teacher-Class relationship (many-to-many for multiple teachers per class)
CREATE TABLE IF NOT EXISTS public.teacher_classes (
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  PRIMARY KEY (teacher_id, class_id)
);

-- Student Progress table
CREATE TABLE IF NOT EXISTS public.student_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID UNIQUE REFERENCES public.students(id) ON DELETE CASCADE,
  overall_progress INTEGER DEFAULT 0,
  current_surah VARCHAR(255),
  current_page INTEGER DEFAULT 1,
  total_pages INTEGER DEFAULT 604,
  pages_memorized INTEGER DEFAULT 0,
  weekly_progress JSONB DEFAULT '[]',
  last_review_date DATE,
  next_review_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assignments table
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50),
  surah VARCHAR(255),
  verses VARCHAR(255),
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student Assignments (tracking)
CREATE TABLE IF NOT EXISTS public.student_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending',
  grade INTEGER,
  feedback TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, assignment_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject VARCHAR(255),
  content TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Annotations table (for Quran PDF markings)
CREATE TABLE IF NOT EXISTS public.annotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  annotation_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attendance table
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, class_id, date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teachers_school_id ON public.teachers(school_id);
CREATE INDEX IF NOT EXISTS idx_teachers_user_id ON public.teachers(user_id);
CREATE INDEX IF NOT EXISTS idx_classes_school_id ON public.classes(school_id);
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON public.classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_students_school_id ON public.students(school_id);
CREATE INDEX IF NOT EXISTS idx_students_class_id ON public.students(class_id);
CREATE INDEX IF NOT EXISTS idx_parent_students_parent_id ON public.parent_students(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_students_student_id ON public.parent_students(student_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON public.messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_annotations_student_id ON public.annotations(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date);

-- Enable Row Level Security
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for School Admins
CREATE POLICY "School admins can view their school" ON public.schools
  FOR ALL USING (auth.uid() IN (
    SELECT user_id FROM auth.users WHERE school_id = schools.id AND role = 'school_admin'
  ));

CREATE POLICY "School admins can manage their teachers" ON public.teachers
  FOR ALL USING (school_id IN (
    SELECT school_id FROM auth.users WHERE id = auth.uid() AND role = 'school_admin'
  ));

CREATE POLICY "School admins can manage their classes" ON public.classes
  FOR ALL USING (school_id IN (
    SELECT school_id FROM auth.users WHERE id = auth.uid() AND role = 'school_admin'
  ));

CREATE POLICY "School admins can manage their students" ON public.students
  FOR ALL USING (school_id IN (
    SELECT school_id FROM auth.users WHERE id = auth.uid() AND role = 'school_admin'
  ));

-- RLS Policies for Teachers
CREATE POLICY "Teachers can view their profile" ON public.teachers
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Teachers can view their assigned classes" ON public.classes
  FOR SELECT USING (id IN (
    SELECT class_id FROM public.teacher_classes 
    WHERE teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid())
  ));

CREATE POLICY "Teachers can view students in their classes" ON public.students
  FOR SELECT USING (class_id IN (
    SELECT class_id FROM public.teacher_classes 
    WHERE teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid())
  ));

CREATE POLICY "Teachers can manage annotations for their students" ON public.annotations
  FOR ALL USING (teacher_id IN (
    SELECT id FROM public.teachers WHERE user_id = auth.uid()
  ));

-- RLS Policies for Parents
CREATE POLICY "Parents can view their profile" ON public.parents
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Parents can view their children" ON public.students
  FOR SELECT USING (id IN (
    SELECT student_id FROM public.parent_students 
    WHERE parent_id IN (SELECT id FROM public.parents WHERE user_id = auth.uid())
  ));

CREATE POLICY "Parents can view their children's progress" ON public.student_progress
  FOR SELECT USING (student_id IN (
    SELECT student_id FROM public.parent_students 
    WHERE parent_id IN (SELECT id FROM public.parents WHERE user_id = auth.uid())
  ));

CREATE POLICY "Parents can view their children's assignments" ON public.student_assignments
  FOR SELECT USING (student_id IN (
    SELECT student_id FROM public.parent_students 
    WHERE parent_id IN (SELECT id FROM public.parents WHERE user_id = auth.uid())
  ));

-- RLS Policies for Messages
CREATE POLICY "Users can view their own messages" ON public.messages
  FOR SELECT USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON public.schools
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_progress_updated_at BEFORE UPDATE ON public.student_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_annotations_updated_at BEFORE UPDATE ON public.annotations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();