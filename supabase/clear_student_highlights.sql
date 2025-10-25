-- Clear highlights for specific students
-- Run this in Supabase SQL Editor

-- Option 1: Delete highlights for Student 1
-- Student ID: 9a358abd-844f-4a79-b728-43c3b599a597
DELETE FROM highlights
WHERE student_id = '9a358abd-844f-4a79-b728-43c3b599a597';

-- Option 2: Delete highlights for Student 2
-- Student ID: dfe37e03-9b72-4fb3-aba9-cf0aa6747f6e
DELETE FROM highlights
WHERE student_id = 'dfe37e03-9b72-4fb3-aba9-cf0aa6747f6e';

-- Verify deletion - should return 0 for each student
SELECT
  student_id,
  COUNT(*) as remaining_highlights
FROM highlights
WHERE student_id IN (
  '9a358abd-844f-4a79-b728-43c3b599a597',
  'dfe37e03-9b72-4fb3-aba9-cf0aa6747f6e'
)
GROUP BY student_id;

-- If you want to clear ALL highlights for ALL students (use with caution!):
-- DELETE FROM highlights;
