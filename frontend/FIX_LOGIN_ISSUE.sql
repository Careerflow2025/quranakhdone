-- ==================================================================
-- PRODUCTION FIX: School Login and RLS Policy Correction
-- ==================================================================
-- Issue: Users register with role 'school' but RLS policies check for 'owner'/'admin'
-- This causes "Profile not found" errors after successful registration
-- ==================================================================

-- STEP 1: Drop and recreate profiles policies with correct role
-- ==================================================================

DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Service role has full access to profiles" ON profiles;

-- Profiles policies (correct - these are fine)
CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role has full access to profiles"
ON profiles FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- STEP 2: Fix schools table policies - CRITICAL FIX
-- ==================================================================

DROP POLICY IF EXISTS "School staff can view their school" ON schools;
DROP POLICY IF EXISTS "School owners can update their school" ON schools;
DROP POLICY IF EXISTS "Service role has full access to schools" ON schools;

-- School users (role 'school') can view their school
CREATE POLICY "School admins can view their school"
ON schools FOR SELECT
USING (
  id IN (
    SELECT school_id 
    FROM profiles 
    WHERE user_id = auth.uid() 
    AND role = 'school'
  )
);

-- School users can update their school
CREATE POLICY "School admins can update their school"
ON schools FOR UPDATE
USING (
  id IN (
    SELECT school_id 
    FROM profiles 
    WHERE user_id = auth.uid() 
    AND role = 'school'
  )
);

-- Service role can manage schools (needed for registration)
CREATE POLICY "Service role has full access to schools"
ON schools FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- STEP 3: Fix teachers table policies
-- ==================================================================

DROP POLICY IF EXISTS "Teachers can view own record" ON teachers;
DROP POLICY IF EXISTS "School staff can view school teachers" ON teachers;
DROP POLICY IF EXISTS "School staff can manage teachers" ON teachers;

CREATE POLICY "Teachers can view own record"
ON teachers FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "School admins can view school teachers"
ON teachers FOR SELECT
USING (
  school_id IN (
    SELECT school_id 
    FROM profiles 
    WHERE user_id = auth.uid() 
    AND role = 'school'
  )
);

CREATE POLICY "School admins can manage teachers"
ON teachers FOR ALL
USING (
  school_id IN (
    SELECT school_id 
    FROM profiles 
    WHERE user_id = auth.uid() 
    AND role = 'school'
  )
);

CREATE POLICY "Service role can manage teachers"
ON teachers FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- STEP 4: Fix students table policies
-- ==================================================================

DROP POLICY IF EXISTS "School staff can manage students" ON students;
DROP POLICY IF EXISTS "Parents can view their children" ON students;

CREATE POLICY "School admins and teachers can manage students"
ON students FOR ALL
USING (
  school_id IN (
    SELECT school_id 
    FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('school', 'teacher')
  )
);

CREATE POLICY "Parents can view their children"
ON students FOR SELECT
USING (
  id IN (
    SELECT student_id 
    FROM parent_students ps
    JOIN parents p ON p.id = ps.parent_id
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Service role can manage students"
ON students FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- STEP 5: Fix parents table policies
-- ==================================================================

DROP POLICY IF EXISTS "Parents can view own record" ON parents;
DROP POLICY IF EXISTS "Parents can update own record" ON parents;
DROP POLICY IF EXISTS "School staff can view parents" ON parents;
DROP POLICY IF EXISTS "School staff can manage parents" ON parents;

CREATE POLICY "Parents can view own record"
ON parents FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Parents can update own record"
ON parents FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "School admins and teachers can view parents"
ON parents FOR SELECT
USING (
  id IN (
    SELECT DISTINCT ps.parent_id
    FROM parent_students ps
    JOIN students s ON s.id = ps.student_id
    JOIN profiles pr ON pr.user_id = auth.uid()
    WHERE s.school_id = pr.school_id
    AND pr.role IN ('school', 'teacher')
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
    AND pr.role = 'school'
  )
);

CREATE POLICY "Service role can manage parents"
ON parents FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- STEP 6: Fix parent_students table policies
-- ==================================================================

DROP POLICY IF EXISTS "Parents can view their links" ON parent_students;
DROP POLICY IF EXISTS "School staff can manage parent links" ON parent_students;

CREATE POLICY "Parents can view their links"
ON parent_students FOR SELECT
USING (
  parent_id IN (
    SELECT id FROM parents WHERE user_id = auth.uid()
  )
);

CREATE POLICY "School admins can manage parent links"
ON parent_students FOR ALL
USING (
  student_id IN (
    SELECT s.id
    FROM students s
    JOIN profiles p ON p.user_id = auth.uid()
    WHERE s.school_id = p.school_id
    AND p.role = 'school'
  )
);

CREATE POLICY "Service role can manage parent_students"
ON parent_students FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- STEP 7: Fix classes table policies
-- ==================================================================

DROP POLICY IF EXISTS "School staff can manage classes" ON classes;

CREATE POLICY "School admins and teachers can manage classes"
ON classes FOR ALL
USING (
  school_id IN (
    SELECT school_id 
    FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('school', 'teacher')
  )
);

CREATE POLICY "Service role can manage classes"
ON classes FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ==================================================================
-- VERIFICATION QUERIES
-- ==================================================================

-- Check all policies are using correct roles
SELECT 
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('schools', 'profiles', 'teachers', 'students', 'parents', 'parent_students', 'classes')
ORDER BY tablename, policyname;

-- Verify RLS is enabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('schools', 'profiles', 'teachers', 'students', 'parents', 'parent_students', 'classes')
ORDER BY tablename;

-- ==================================================================
-- NOTES
-- ==================================================================
-- This fixes the role mismatch where:
-- - Registration creates users with role 'school'
-- - But RLS policies were checking for roles 'owner' and 'admin'
-- - Now all policies correctly check for role 'school'
-- ==================================================================
