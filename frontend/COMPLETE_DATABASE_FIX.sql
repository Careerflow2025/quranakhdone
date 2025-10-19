
-- ==================================================================
-- COMPREHENSIVE DATABASE FIX FOR QURANAKH SYSTEM
-- ==================================================================

BEGIN;

-- 1. Check current role enum values
DO $$ 
DECLARE
    role_exists boolean;
BEGIN
    -- Check if 'school' exists in role enum
    SELECT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'school' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'role')
    ) INTO role_exists;
    
    IF NOT role_exists THEN
        RAISE NOTICE 'Adding school to role enum...';
        ALTER TYPE role ADD VALUE 'school';
    ELSE
        RAISE NOTICE 'Role school already exists in enum';
    END IF;
END $$;

-- 2. Show current profiles before update
SELECT 
    'BEFORE UPDATE:' as status,
    role::text,
    COUNT(*) as count,
    STRING_AGG(email, ', ') as emails
FROM profiles
GROUP BY role::text;

-- 3. Update profiles with owner/admin role to school
UPDATE profiles 
SET role = 'school'::role
WHERE role::text IN ('owner', 'admin');

-- 4. Show profiles after update
SELECT 
    'AFTER UPDATE:' as status,
    role::text,
    COUNT(*) as count,
    STRING_AGG(email, ', ') as emails
FROM profiles
GROUP BY role::text;

-- 5. Drop and recreate RLS policies for schools table
DROP POLICY IF EXISTS "School staff can view their school" ON schools;
DROP POLICY IF EXISTS "School owners can update their school" ON schools;
DROP POLICY IF EXISTS "School admins can view their school" ON schools;
DROP POLICY IF EXISTS "School admins can update their school" ON schools;
DROP POLICY IF EXISTS "Service role has full access to schools" ON schools;
DROP POLICY IF EXISTS "School admins can insert their school" ON schools;

CREATE POLICY "School admins can view their school"
ON schools FOR SELECT
USING (
  id IN (
    SELECT school_id 
    FROM profiles 
    WHERE user_id = auth.uid() 
    AND role::text = 'school'
  )
);

CREATE POLICY "School admins can update their school"
ON schools FOR UPDATE
USING (
  id IN (
    SELECT school_id 
    FROM profiles 
    WHERE user_id = auth.uid() 
    AND role::text = 'school'
  )
);

CREATE POLICY "School admins can insert their school"
ON schools FOR INSERT
WITH CHECK (
  id IN (
    SELECT school_id 
    FROM profiles 
    WHERE user_id = auth.uid() 
    AND role::text = 'school'
  )
);

CREATE POLICY "Service role has full access to schools"
ON schools FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 6. Fix teachers table RLS policies
DROP POLICY IF EXISTS "School staff can view school teachers" ON teachers;
DROP POLICY IF EXISTS "School staff can manage teachers" ON teachers;
DROP POLICY IF EXISTS "School admins can view school teachers" ON teachers;
DROP POLICY IF EXISTS "School admins can manage teachers" ON teachers;
DROP POLICY IF EXISTS "Service role can manage teachers" ON teachers;

CREATE POLICY "School admins can view school teachers"
ON teachers FOR SELECT
USING (
  school_id IN (
    SELECT school_id 
    FROM profiles 
    WHERE user_id = auth.uid() 
    AND role::text = 'school'
  )
);

CREATE POLICY "School admins can manage teachers"
ON teachers FOR ALL
USING (
  school_id IN (
    SELECT school_id 
    FROM profiles 
    WHERE user_id = auth.uid() 
    AND role::text = 'school'
  )
);

CREATE POLICY "Service role can manage teachers"
ON teachers FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 7. Fix students table RLS policies
DROP POLICY IF EXISTS "School staff can manage students" ON students;
DROP POLICY IF EXISTS "School admins and teachers can manage students" ON students;
DROP POLICY IF EXISTS "Service role can manage students" ON students;

CREATE POLICY "School admins and teachers can manage students"
ON students FOR ALL
USING (
  school_id IN (
    SELECT school_id 
    FROM profiles 
    WHERE user_id = auth.uid() 
    AND role::text IN ('school', 'teacher')
  )
);

CREATE POLICY "Service role can manage students"
ON students FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 8. Fix parents table RLS policies
DROP POLICY IF EXISTS "School staff can view parents" ON parents;
DROP POLICY IF EXISTS "School staff can manage parents" ON parents;
DROP POLICY IF EXISTS "School admins and teachers can view parents" ON parents;
DROP POLICY IF EXISTS "School admins can manage parents" ON parents;
DROP POLICY IF EXISTS "Service role can manage parents" ON parents;

CREATE POLICY "School admins and teachers can view parents"
ON parents FOR SELECT
USING (
  id IN (
    SELECT DISTINCT ps.parent_id
    FROM parent_students ps
    JOIN students s ON s.id = ps.student_id
    JOIN profiles pr ON pr.user_id = auth.uid()
    WHERE s.school_id = pr.school_id
    AND pr.role::text IN ('school', 'teacher')
  )
);

CREATE POLICY "School admins can manage parents"
ON parents FOR ALL
USING (
  id IN (
    SELECT DISTINCT ps.parent_id
    FROM parent_students ps
    JOIN students s ON s.id = ps.student_id
    JOIN profiles pr ON pr.user_id = auth.uid()
    WHERE s.school_id = pr.school_id
    AND pr.role::text = 'school'
  )
);

CREATE POLICY "Service role can manage parents"
ON parents FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 9. Fix parent_students table RLS policies
DROP POLICY IF EXISTS "School staff can manage parent links" ON parent_students;
DROP POLICY IF EXISTS "School admins can manage parent links" ON parent_students;
DROP POLICY IF EXISTS "Service role can manage parent_students" ON parent_students;

CREATE POLICY "School admins can manage parent links"
ON parent_students FOR ALL
USING (
  student_id IN (
    SELECT s.id
    FROM students s
    JOIN profiles p ON p.user_id = auth.uid()
    WHERE s.school_id = p.school_id
    AND p.role::text = 'school'
  )
);

CREATE POLICY "Service role can manage parent_students"
ON parent_students FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 10. Fix classes table RLS policies
DROP POLICY IF EXISTS "School staff can manage classes" ON classes;
DROP POLICY IF EXISTS "School admins and teachers can manage classes" ON classes;
DROP POLICY IF EXISTS "Service role can manage classes" ON classes;

CREATE POLICY "School admins and teachers can manage classes"
ON classes FOR ALL
USING (
  school_id IN (
    SELECT school_id 
    FROM profiles 
    WHERE user_id = auth.uid() 
    AND role::text IN ('school', 'teacher')
  )
);

CREATE POLICY "Service role can manage classes"
ON classes FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 11. Final verification
SELECT 
    '✅ FIX COMPLETE' as status,
    role::text,
    COUNT(*) as count,
    STRING_AGG(email, ', ') as emails
FROM profiles
GROUP BY role::text
ORDER BY role::text;

COMMIT;

SELECT '🎉 Database fix completed successfully!' as result;
