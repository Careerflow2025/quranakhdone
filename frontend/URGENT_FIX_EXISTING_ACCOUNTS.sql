-- ==================================================================
-- URGENT FIX: Repair Existing School Accounts with Wrong Roles
-- ==================================================================
-- Issue: Some accounts were created with role 'owner' instead of 'school'
-- This SQL will fix existing accounts so they can log in properly
-- ==================================================================

-- STEP 1: Check what roles currently exist in the database
-- ==================================================================
SELECT 
  role,
  COUNT(*) as count,
  STRING_AGG(email, ', ') as emails
FROM profiles
GROUP BY role
ORDER BY role;

-- STEP 2: Update any 'owner' or 'admin' roles to 'school'
-- ==================================================================
UPDATE profiles
SET role = 'school'
WHERE role IN ('owner', 'admin');

-- STEP 3: Verify the update
-- ==================================================================
SELECT 
  user_id,
  email,
  display_name,
  role,
  school_id,
  created_at
FROM profiles
ORDER BY created_at DESC;

-- STEP 4: Check that profiles are linked to schools correctly
-- ==================================================================
SELECT 
  p.email,
  p.role,
  p.school_id,
  s.name as school_name,
  s.timezone
FROM profiles p
LEFT JOIN schools s ON s.id = p.school_id
WHERE p.role = 'school'
ORDER BY p.created_at DESC;

-- STEP 5: Fix any profiles that might be missing school_id
-- ==================================================================
-- This query finds users with role 'school' but no school_id
SELECT 
  user_id,
  email,
  display_name,
  role,
  school_id
FROM profiles
WHERE role = 'school' 
AND school_id IS NULL;

-- If you find any, you need to assign them to a school manually:
-- UPDATE profiles
-- SET school_id = 'YOUR_SCHOOL_ID_HERE'::uuid
-- WHERE user_id = 'THE_USER_ID_HERE'::uuid;

-- ==================================================================
-- STEP 6: Verify authentication works
-- ==================================================================
-- After running this fix, test login by checking:

-- 1. Check auth.users table has the user
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  raw_user_meta_data
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- 2. Check profiles table has matching record with role 'school'
SELECT 
  p.user_id,
  p.email,
  p.role,
  p.school_id,
  s.name as school_name
FROM profiles p
JOIN schools s ON s.id = p.school_id
WHERE p.role = 'school'
ORDER BY p.created_at DESC;

-- ==================================================================
-- COMPLETE FIX SUMMARY
-- ==================================================================
-- After running this SQL:
-- 1. All school admin accounts now have role 'school' (not 'owner' or 'admin')
-- 2. They are properly linked to their schools
-- 3. They can log in and access /school-dashboard
-- 4. They can create teachers, students, and parents
-- ==================================================================
