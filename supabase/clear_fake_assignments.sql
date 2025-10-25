-- Clear fake assignments from database
-- These are test assignments that were never created by teachers
-- Run this in Supabase SQL Editor

-- Show count before deletion
SELECT
  COUNT(*) as "Fake assignments to delete",
  COUNT(DISTINCT student_id) as "Students affected"
FROM assignments
WHERE title LIKE '%Memorize Surah Al-Fatiha%'
   OR title LIKE '%Test%'
   OR title LIKE '%Mock%'
   OR due_at > '2025-10-29'::timestamptz;

-- Delete fake assignments with suspicious characteristics
DELETE FROM assignments
WHERE title LIKE '%Memorize Surah Al-Fatiha%'
   OR title LIKE '%Test%'
   OR title LIKE '%Mock%'
   OR due_at > '2025-10-29'::timestamptz;

-- Verify deletion
SELECT
  COUNT(*) as "Remaining assignments",
  CASE
    WHEN COUNT(*) = 0 THEN '✅ All fake assignments cleared!'
    ELSE '⚠️ Some assignments remain'
  END as "Status"
FROM assignments;

-- Show what remains (should be empty or only real assignments)
SELECT
  id,
  title,
  status,
  due_at,
  created_at
FROM assignments
ORDER BY created_at DESC
LIMIT 10;
