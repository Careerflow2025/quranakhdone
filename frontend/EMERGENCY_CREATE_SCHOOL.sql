-- ==================================================================
-- EMERGENCY FIX: Create School & Admin User Manually
-- ==================================================================
-- USE THIS IF: SUPABASE_SERVICE_ROLE_KEY is not configured in Netlify
-- Run this in Supabase SQL Editor to create your first school account
-- ==================================================================

-- Step 1: Create a school
INSERT INTO public.schools (name, timezone)
VALUES ('Your School Name Here', 'Africa/Casablanca')
RETURNING id;

-- ⚠️ IMPORTANT: Copy the school ID from the result above
-- Replace 'YOUR_SCHOOL_ID_HERE' below with the actual UUID

-- Step 2: Create admin user in Supabase Auth Dashboard
-- Go to: Authentication → Users → Add user
-- Email: admin@yourschool.com
-- Password: (set a secure password)
-- Auto Confirm User: YES
-- ⚠️ IMPORTANT: Copy the user ID after creation

-- Step 3: Create profile for the admin user
-- Replace 'YOUR_USER_ID_HERE' and 'YOUR_SCHOOL_ID_HERE' with actual UUIDs
INSERT INTO public.profiles (user_id, email, display_name, role, school_id)
VALUES (
  'YOUR_USER_ID_HERE'::uuid,
  'admin@yourschool.com',
  'School Administrator',
  'school',
  'YOUR_SCHOOL_ID_HERE'::uuid
);

-- ==================================================================
-- VERIFICATION QUERIES
-- ==================================================================

-- Check if school was created
SELECT id, name, timezone, created_at 
FROM public.schools 
ORDER BY created_at DESC 
LIMIT 5;

-- Check if profile was created
SELECT 
  p.user_id,
  p.email,
  p.display_name,
  p.role,
  p.school_id,
  s.name as school_name
FROM public.profiles p
LEFT JOIN public.schools s ON s.id = p.school_id
ORDER BY p.created_at DESC
LIMIT 5;

-- ==================================================================
-- NOTES:
-- ==================================================================
-- After running these queries:
-- 1. You can log in at /login with the email and password you created
-- 2. The system should redirect you to /school-dashboard
-- 3. From there you can create teachers, students, and parents normally
--
-- This is a ONE-TIME workaround. Once you add SUPABASE_SERVICE_ROLE_KEY
-- to Netlify environment variables, the /register-school page will work
-- automatically without needing manual SQL.
-- ==================================================================
