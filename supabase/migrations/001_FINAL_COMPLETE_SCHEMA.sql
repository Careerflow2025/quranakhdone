-- FINAL COMPLETE SCHEMA FOR QURANAKH
-- This is the ONLY migration you need to run

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing objects if they exist to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Schools table
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

-- User Profiles table (stores role information)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL CHECK (role IN ('school_admin', 'teacher', 'parent', 'student')),
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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
  password_temp VARCHAR(255), -- Temporary storage for display only
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
  parent_name VARCHAR(255),
  parent_email VARCHAR(255),
  parent_phone VARCHAR(20),
  parent_password_temp VARCHAR(255), -- Temporary storage for display only
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

-- Parent-Student relationship
CREATE TABLE IF NOT EXISTS public.parent_students (
  parent_id UUID REFERENCES public.parents(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  PRIMARY KEY (parent_id, student_id)
);

-- Teacher-Class assignments
CREATE TABLE IF NOT EXISTS public.teacher_classes (
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  PRIMARY KEY (teacher_id, class_id)
);

-- Student Progress
CREATE TABLE IF NOT EXISTS public.student_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID UNIQUE REFERENCES public.students(id) ON DELETE CASCADE,
  overall_progress INTEGER DEFAULT 0,
  current_surah VARCHAR(255) DEFAULT 'Al-Fatiha',
  current_page INTEGER DEFAULT 1,
  total_pages INTEGER DEFAULT 604,
  pages_memorized INTEGER DEFAULT 0,
  weekly_progress JSONB DEFAULT '[]',
  last_review_date DATE,
  next_review_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assignments
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

-- Student Assignments
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

-- Messages
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject VARCHAR(255),
  content TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Annotations for Quran
CREATE TABLE IF NOT EXISTS public.annotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  annotation_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attendance
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_school_id ON public.user_profiles(school_id);
CREATE INDEX IF NOT EXISTS idx_teachers_school_id ON public.teachers(school_id);
CREATE INDEX IF NOT EXISTS idx_classes_school_id ON public.classes(school_id);
CREATE INDEX IF NOT EXISTS idx_students_school_id ON public.students(school_id);
CREATE INDEX IF NOT EXISTS idx_students_class_id ON public.students(class_id);

-- Enable RLS
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
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

-- Simple RLS Policies (for development - tighten for production)
-- Allow authenticated users to read their own profile
CREATE POLICY "Users can read own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

-- For development: Allow all authenticated users to read schools
CREATE POLICY "Authenticated users can view schools" ON public.schools
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- For development: Allow all authenticated users to manage teachers
CREATE POLICY "Authenticated users can manage teachers" ON public.teachers
  FOR ALL USING (auth.uid() IS NOT NULL);

-- For development: Allow all authenticated users to manage classes
CREATE POLICY "Authenticated users can manage classes" ON public.classes
  FOR ALL USING (auth.uid() IS NOT NULL);

-- For development: Allow all authenticated users to manage students
CREATE POLICY "Authenticated users can manage students" ON public.students
  FOR ALL USING (auth.uid() IS NOT NULL);

-- For development: Allow all authenticated users to manage parents
CREATE POLICY "Authenticated users can manage parents" ON public.parents
  FOR ALL USING (auth.uid() IS NOT NULL);

-- For development: Allow all operations on relationship tables
CREATE POLICY "Allow all on parent_students" ON public.parent_students
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow all on teacher_classes" ON public.teacher_classes
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow all on student_progress" ON public.student_progress
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow all on assignments" ON public.assignments
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow all on student_assignments" ON public.student_assignments
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow all on messages" ON public.messages
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow all on annotations" ON public.annotations
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow all on attendance" ON public.attendance
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  -- Only create profile if it doesn't exist
  INSERT INTO public.user_profiles (id, role, school_id)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'role', 'parent'),
    (new.raw_user_meta_data->>'school_id')::uuid
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update function for timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create update triggers
CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON public.schools
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_progress_updated_at BEFORE UPDATE ON public.student_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- SUCCESS MESSAGE
DO $$
BEGIN
  RAISE NOTICE 'Schema created successfully! All tables and policies are in place.';
END $$;