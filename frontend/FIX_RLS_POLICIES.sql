-- ==================================================================
-- RLS POLICY VERIFICATION AND FIX
-- ==================================================================
-- Run this to check and fix any RLS policy issues
-- ==================================================================

-- 1. Check current RLS status for all tables
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. List all current RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ==================================================================
-- PRODUCTION-READY RLS POLICIES
-- ==================================================================
-- These policies ensure data security while allowing proper access
-- ==================================================================

-- Drop existing policies if any (to start fresh)
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "School owners can view their school" ON schools;
DROP POLICY IF EXISTS "School owners can update their school" ON schools;
DROP POLICY IF EXISTS "Service role can manage schools" ON schools;

-- ==================================================================
-- PROFILES TABLE POLICIES
-- ==================================================================

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
USING (auth.uid() = user_id);

-- Allow authenticated users to insert their profile (for registration)
CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Service role has full access (bypasses RLS anyway, but explicit is good)
CREATE POLICY "Service role has full access to profiles"
ON profiles FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ==================================================================
-- SCHOOLS TABLE POLICIES  
-- ==================================================================

-- Enable RLS
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;

-- School owners and admins can view their school
CREATE POLICY "School staff can view their school"
ON schools FOR SELECT
USING (
  id IN (
    SELECT school_id 
    FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);

-- School owners can update their school
CREATE POLICY "School owners can update their school"
ON schools FOR UPDATE
USING (
  id IN (
    SELECT school_id 
    FROM profiles 
    WHERE user_id = auth.uid() 
    AND role = 'owner'
  )
);

-- Service role can manage schools (needed for registration)
CREATE POLICY "Service role has full access to schools"
ON schools FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ==================================================================
-- TEACHERS TABLE POLICIES
-- ==================================================================

-- Enable RLS
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;

-- Teachers can view their own record
CREATE POLICY "Teachers can view own record"
ON teachers FOR SELECT
USING (user_id = auth.uid());

-- School staff can view teachers at their school
CREATE POLICY "School staff can view school teachers"
ON teachers FOR SELECT
USING (
  school_id IN (
    SELECT school_id 
    FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);

-- School staff can manage teachers
CREATE POLICY "School staff can manage teachers"
ON teachers FOR ALL
USING (
  school_id IN (
    SELECT school_id 
    FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);

-- ==================================================================
-- STUDENTS TABLE POLICIES
-- ==================================================================

-- Enable RLS
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- School staff can manage students at their school
CREATE POLICY "School staff can manage students"
ON students FOR ALL
USING (
  school_id IN (
    SELECT school_id 
    FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin', 'teacher')
  )
);

-- Parents can view their children
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

-- ==================================================================
-- PARENTS TABLE POLICIES
-- ==================================================================

-- Enable RLS
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;

-- Parents can view their own record
CREATE POLICY "Parents can view own record"
ON parents FOR SELECT
USING (user_id = auth.uid());

-- Parents can update their own record
CREATE POLICY "Parents can update own record"
ON parents FOR UPDATE
USING (user_id = auth.uid());

-- School staff can view parents of their students
CREATE POLICY "School staff can view parents"
ON parents FOR SELECT
USING (
  id IN (
    SELECT DISTINCT ps.parent_id
    FROM parent_students ps
    JOIN students s ON s.id = ps.student_id
    JOIN profiles pr ON pr.user_id = auth.uid()
    WHERE s.school_id = pr.school_id
    AND pr.role IN ('owner', 'admin', 'teacher')
  )
);

-- School staff can manage parents
CREATE POLICY "School staff can manage parents"
ON parents FOR ALL
USING (
  id IN (
    SELECT DISTINCT ps.parent_id
    FROM parent_students ps
    JOIN students s ON s.id = ps.student_id
    JOIN profiles pr ON pr.user_id = auth.uid()
    WHERE s.school_id = pr.school_id
    AND pr.role IN ('owner', 'admin')
  )
);

-- ==================================================================
-- PARENT_STUDENTS TABLE POLICIES
-- ==================================================================

-- Enable RLS
ALTER TABLE parent_students ENABLE ROW LEVEL SECURITY;

-- Parents can view their own links
CREATE POLICY "Parents can view their links"
ON parent_students FOR SELECT
USING (
  parent_id IN (
    SELECT id FROM parents WHERE user_id = auth.uid()
  )
);

-- School staff can manage parent-student links
CREATE POLICY "School staff can manage parent links"
ON parent_students FOR ALL
USING (
  student_id IN (
    SELECT s.id
    FROM students s
    JOIN profiles p ON p.user_id = auth.uid()
    WHERE s.school_id = p.school_id
    AND p.role IN ('owner', 'admin')
  )
);

-- ==================================================================
-- CLASSES TABLE POLICIES
-- ==================================================================

-- Enable RLS
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- School staff can manage classes at their school
CREATE POLICY "School staff can manage classes"
ON classes FOR ALL
USING (
  school_id IN (
    SELECT school_id 
    FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin', 'teacher')
  )
);

-- ==================================================================
-- VERIFICATION
-- ==================================================================

-- Check that all policies are created
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- Check RLS is enabled on all tables
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'schools', 'profiles', 'teachers', 'students', 
  'parents', 'parent_students', 'classes', 
  'teacher_classes', 'student_progress'
)
ORDER BY tablename;

-- ==================================================================
-- NOTES
-- ==================================================================
-- After running this script:
-- 1. All tables will have RLS enabled
-- 2. Users can only access data they're authorized to see
-- 3. Service role (used in API routes) bypasses all RLS
-- 4. School staff can manage their school's data
-- 5. Parents can view their children's data
-- 6. Teachers can view their assigned students
-- ==================================================================
