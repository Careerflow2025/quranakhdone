-- Functions for handling authentication and role management

-- Function to update user role (must be called with service role key)
CREATE OR REPLACE FUNCTION public.update_user_role(
  user_id UUID,
  user_role VARCHAR(50),
  user_school_id UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the auth.users table with role and school_id
  UPDATE auth.users 
  SET 
    raw_user_meta_data = raw_user_meta_data || 
    jsonb_build_object('role', user_role, 'school_id', user_school_id)
  WHERE id = user_id;
END;
$$;

-- Function to get user's role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT raw_user_meta_data->>'role' INTO user_role
  FROM auth.users
  WHERE id = user_id;
  
  RETURN user_role;
END;
$$;

-- Function to check if user belongs to a school
CREATE OR REPLACE FUNCTION public.user_belongs_to_school(user_id UUID, school_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  belongs BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = user_id 
    AND raw_user_meta_data->>'school_id' = school_id::TEXT
  ) INTO belongs;
  
  RETURN belongs;
END;
$$;

-- Function to create a complete student with parent account
CREATE OR REPLACE FUNCTION public.create_student_with_parent(
  student_name VARCHAR(255),
  student_dob DATE,
  class_id UUID,
  school_id UUID,
  parent_email VARCHAR(255),
  parent_password VARCHAR(255),
  parent_name VARCHAR(255),
  parent_phone VARCHAR(20),
  parent_relationship VARCHAR(50)
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  new_parent_user_id UUID;
  new_parent_id UUID;
  new_student_id UUID;
BEGIN
  -- Note: Parent user creation should be done through Supabase Auth API
  -- This function handles the database records after auth user is created
  
  -- Create student record
  INSERT INTO public.students (
    school_id,
    class_id,
    name,
    date_of_birth,
    status
  ) VALUES (
    school_id,
    class_id,
    student_name,
    student_dob,
    'active'
  ) RETURNING id INTO new_student_id;
  
  -- Create initial progress record
  INSERT INTO public.student_progress (
    student_id,
    overall_progress,
    current_surah,
    current_page,
    pages_memorized
  ) VALUES (
    new_student_id,
    0,
    'Al-Fatiha',
    1,
    0
  );
  
  -- Update class student count
  UPDATE public.classes 
  SET student_count = student_count + 1 
  WHERE id = class_id;
  
  RETURN json_build_object(
    'student_id', new_student_id,
    'message', 'Student created successfully. Parent account must be created through Auth API.'
  );
END;
$$;

-- Function to get all data for a teacher dashboard
CREATE OR REPLACE FUNCTION public.get_teacher_dashboard_data(teacher_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
BEGIN
  WITH teacher_info AS (
    SELECT * FROM public.teachers WHERE user_id = teacher_user_id
  ),
  teacher_classes AS (
    SELECT c.* 
    FROM public.classes c
    JOIN public.teacher_classes tc ON tc.class_id = c.id
    JOIN teacher_info t ON t.id = tc.teacher_id
  ),
  class_students AS (
    SELECT s.*, c.name as class_name
    FROM public.students s
    JOIN teacher_classes c ON c.id = s.class_id
    WHERE s.status = 'active'
  ),
  assignments AS (
    SELECT a.*
    FROM public.assignments a
    JOIN teacher_info t ON t.id = a.teacher_id
    ORDER BY a.created_at DESC
    LIMIT 10
  )
  SELECT json_build_object(
    'teacher', (SELECT row_to_json(teacher_info.*) FROM teacher_info),
    'classes', (SELECT json_agg(row_to_json(teacher_classes.*)) FROM teacher_classes),
    'students', (SELECT json_agg(row_to_json(class_students.*)) FROM class_students),
    'recent_assignments', (SELECT json_agg(row_to_json(assignments.*)) FROM assignments)
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Function to get all data for a parent dashboard
CREATE OR REPLACE FUNCTION public.get_parent_dashboard_data(parent_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
BEGIN
  WITH parent_info AS (
    SELECT * FROM public.parents WHERE user_id = parent_user_id
  ),
  parent_children AS (
    SELECT s.*, sp.*, c.name as class_name
    FROM public.students s
    JOIN public.parent_students ps ON ps.student_id = s.id
    JOIN parent_info p ON p.id = ps.parent_id
    LEFT JOIN public.student_progress sp ON sp.student_id = s.id
    LEFT JOIN public.classes c ON c.id = s.class_id
  ),
  children_assignments AS (
    SELECT sa.*, a.*, s.name as student_name
    FROM public.student_assignments sa
    JOIN public.assignments a ON a.id = sa.assignment_id
    JOIN parent_children s ON s.id = sa.student_id
    WHERE sa.status IN ('pending', 'submitted')
    ORDER BY a.due_date ASC
  )
  SELECT json_build_object(
    'parent', (SELECT row_to_json(parent_info.*) FROM parent_info),
    'children', (SELECT json_agg(row_to_json(parent_children.*)) FROM parent_children),
    'upcoming_assignments', (SELECT json_agg(row_to_json(children_assignments.*)) FROM children_assignments)
  ) INTO result;
  
  RETURN result;
END;
$$;