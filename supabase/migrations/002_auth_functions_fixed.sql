-- Functions for handling authentication and role management (FIXED VERSION)

-- Function to get user's role from user_profiles
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.user_profiles
  WHERE id = user_id;
  
  RETURN user_role;
END;
$$;

-- Function to check if user belongs to a school
CREATE OR REPLACE FUNCTION public.user_belongs_to_school(user_id UUID, check_school_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  belongs BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = user_id 
    AND school_id = check_school_id
  ) INTO belongs;
  
  RETURN belongs;
END;
$$;

-- Function to create a complete student with parent account preparation
CREATE OR REPLACE FUNCTION public.create_student_record(
  student_name VARCHAR(255),
  student_dob DATE,
  class_id UUID,
  school_id UUID,
  parent_email VARCHAR(255),
  parent_name VARCHAR(255)
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  new_student_id UUID;
  class_info RECORD;
BEGIN
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
  SET student_count = COALESCE(student_count, 0) + 1 
  WHERE id = class_id;
  
  -- Get class info
  SELECT name INTO class_info FROM public.classes WHERE id = class_id;
  
  RETURN json_build_object(
    'student_id', new_student_id,
    'student_name', student_name,
    'class_name', class_info.name,
    'parent_email', parent_email,
    'parent_name', parent_name,
    'message', 'Student created. Parent account must be created through Auth API.'
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
    SELECT t.*, s.name as school_name
    FROM public.teachers t
    LEFT JOIN public.schools s ON s.id = t.school_id
    WHERE t.user_id = teacher_user_id
  ),
  teacher_classes AS (
    SELECT c.* 
    FROM public.classes c
    JOIN public.teacher_classes tc ON tc.class_id = c.id
    WHERE tc.teacher_id IN (SELECT id FROM teacher_info)
  ),
  class_students AS (
    SELECT s.*, c.name as class_name, sp.overall_progress, sp.pages_memorized
    FROM public.students s
    JOIN teacher_classes c ON c.id = s.class_id
    LEFT JOIN public.student_progress sp ON sp.student_id = s.id
    WHERE s.status = 'active'
  ),
  recent_assignments AS (
    SELECT a.*
    FROM public.assignments a
    WHERE a.teacher_id IN (SELECT id FROM teacher_info)
    ORDER BY a.created_at DESC
    LIMIT 10
  )
  SELECT json_build_object(
    'teacher', (SELECT row_to_json(ti) FROM teacher_info ti),
    'classes', COALESCE((SELECT json_agg(tc) FROM teacher_classes tc), '[]'::json),
    'students', COALESCE((SELECT json_agg(cs) FROM class_students cs), '[]'::json),
    'recent_assignments', COALESCE((SELECT json_agg(ra) FROM recent_assignments ra), '[]'::json)
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
    SELECT 
      s.*,
      sp.overall_progress,
      sp.current_surah,
      sp.current_page,
      sp.pages_memorized,
      c.name as class_name,
      t.name as teacher_name
    FROM public.students s
    JOIN public.parent_students ps ON ps.student_id = s.id
    JOIN parent_info p ON p.id = ps.parent_id
    LEFT JOIN public.student_progress sp ON sp.student_id = s.id
    LEFT JOIN public.classes c ON c.id = s.class_id
    LEFT JOIN public.teachers t ON t.id = c.teacher_id
  ),
  children_assignments AS (
    SELECT 
      sa.*,
      a.title,
      a.description,
      a.due_date,
      a.type,
      s.name as student_name
    FROM public.student_assignments sa
    JOIN public.assignments a ON a.id = sa.assignment_id
    JOIN parent_children s ON s.id = sa.student_id
    WHERE sa.status IN ('pending', 'submitted')
    ORDER BY a.due_date ASC
    LIMIT 20
  )
  SELECT json_build_object(
    'parent', row_to_json(p),
    'children', COALESCE((SELECT json_agg(pc) FROM parent_children pc), '[]'::json),
    'upcoming_assignments', COALESCE((SELECT json_agg(ca) FROM children_assignments ca), '[]'::json)
  ) INTO result
  FROM parent_info p;
  
  RETURN result;
END;
$$;

-- Function to link parent to student after both are created
CREATE OR REPLACE FUNCTION public.link_parent_to_student(
  parent_user_id UUID,
  student_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  parent_record_id UUID;
BEGIN
  -- Get parent record id
  SELECT id INTO parent_record_id 
  FROM public.parents 
  WHERE user_id = parent_user_id;
  
  IF parent_record_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Create the link
  INSERT INTO public.parent_students (parent_id, student_id)
  VALUES (parent_record_id, student_id)
  ON CONFLICT DO NOTHING;
  
  RETURN TRUE;
END;
$$;

-- Function to assign teacher to classes
CREATE OR REPLACE FUNCTION public.assign_teacher_to_classes(
  teacher_user_id UUID,
  class_ids UUID[]
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  teacher_record_id UUID;
  class_id UUID;
BEGIN
  -- Get teacher record id
  SELECT id INTO teacher_record_id 
  FROM public.teachers 
  WHERE user_id = teacher_user_id;
  
  IF teacher_record_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Remove existing assignments
  DELETE FROM public.teacher_classes WHERE teacher_id = teacher_record_id;
  
  -- Add new assignments
  FOREACH class_id IN ARRAY class_ids
  LOOP
    INSERT INTO public.teacher_classes (teacher_id, class_id)
    VALUES (teacher_record_id, class_id)
    ON CONFLICT DO NOTHING;
    
    -- Update class with primary teacher if not set
    UPDATE public.classes 
    SET teacher_id = teacher_record_id
    WHERE id = class_id AND teacher_id IS NULL;
  END LOOP;
  
  RETURN TRUE;
END;
$$;

-- Function to get school statistics
CREATE OR REPLACE FUNCTION public.get_school_statistics(school_id UUID)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
BEGIN
  WITH stats AS (
    SELECT
      (SELECT COUNT(*) FROM public.teachers WHERE school_id = get_school_statistics.school_id) as total_teachers,
      (SELECT COUNT(*) FROM public.students WHERE school_id = get_school_statistics.school_id) as total_students,
      (SELECT COUNT(*) FROM public.classes WHERE school_id = get_school_statistics.school_id) as total_classes,
      (SELECT COUNT(*) FROM public.students WHERE school_id = get_school_statistics.school_id AND status = 'active') as active_students,
      (SELECT AVG(overall_progress) FROM public.student_progress sp 
       JOIN public.students s ON s.id = sp.student_id 
       WHERE s.school_id = get_school_statistics.school_id) as avg_progress
  )
  SELECT json_build_object(
    'total_teachers', total_teachers,
    'total_students', total_students,
    'total_classes', total_classes,
    'active_students', active_students,
    'average_progress', COALESCE(ROUND(avg_progress::numeric, 1), 0)
  ) INTO result FROM stats;
  
  RETURN result;
END;
$$;