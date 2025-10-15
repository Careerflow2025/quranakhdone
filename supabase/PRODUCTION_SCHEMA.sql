-- PRODUCTION READY SCHEMA FOR QURANAKH
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USER PROFILES TABLE (stores role and school info)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('school_admin', 'teacher', 'parent', 'student')),
  school_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SCHOOLS TABLE
CREATE TABLE IF NOT EXISTS public.schools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TEACHERS TABLE
CREATE TABLE IF NOT EXISTS public.teachers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  qualifications TEXT,
  experience TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CLASSES TABLE
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  grade_level TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TEACHER_CLASSES TABLE (many-to-many)
CREATE TABLE IF NOT EXISTS public.teacher_classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(teacher_id, class_id)
);

-- 6. STUDENTS TABLE
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id),
  full_name TEXT NOT NULL,
  date_of_birth DATE,
  parent_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. PARENTS TABLE
CREATE TABLE IF NOT EXISTS public.parents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. PARENT_STUDENTS TABLE (many-to-many)
CREATE TABLE IF NOT EXISTS public.parent_students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID REFERENCES public.parents(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  relationship TEXT DEFAULT 'parent',
  UNIQUE(parent_id, student_id)
);

-- 9. Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_students ENABLE ROW LEVEL SECURITY;

-- 10. Create trigger for auto-creating user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, role)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'role', 'student'))
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 11. RLS Policies (simplified for development)
-- Allow authenticated users to read their own profile
CREATE POLICY "Users can read own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Allow authenticated users to read data
CREATE POLICY "Authenticated users can read schools" ON public.schools
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can read teachers" ON public.teachers
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can read classes" ON public.classes
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can read students" ON public.students
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Allow school admins to insert/update their school's data
CREATE POLICY "School admins can manage teachers" ON public.teachers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'school_admin'
      AND user_profiles.school_id = teachers.school_id
    )
  );

CREATE POLICY "School admins can manage classes" ON public.classes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'school_admin'
      AND user_profiles.school_id = classes.school_id
    )
  );

CREATE POLICY "School admins can manage students" ON public.students
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'school_admin'
      AND user_profiles.school_id = students.school_id
    )
  );

-- 12. Helper function to get user's role and redirect path
CREATE OR REPLACE FUNCTION public.get_user_redirect()
RETURNS JSON AS $$
DECLARE
  user_role TEXT;
  redirect_path TEXT;
BEGIN
  SELECT role INTO user_role FROM public.user_profiles WHERE id = auth.uid();
  
  CASE user_role
    WHEN 'school_admin' THEN redirect_path := '/school/dashboard';
    WHEN 'teacher' THEN redirect_path := '/teacher/dashboard';
    WHEN 'parent' THEN redirect_path := '/parent/dashboard';
    WHEN 'student' THEN redirect_path := '/student/dashboard';
    ELSE redirect_path := '/';
  END CASE;
  
  RETURN json_build_object('role', user_role, 'redirect', redirect_path);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;