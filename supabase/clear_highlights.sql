-- Clear ALL highlights from database
-- Run this in Supabase SQL Editor to remove all test/mock highlights

-- Show count before deletion
SELECT COUNT(*) as "Highlights to delete" FROM highlights;

-- Delete all highlights
DELETE FROM highlights;

-- Show confirmation
SELECT
  COUNT(*) as "Remaining highlights (should be 0)",
  CASE
    WHEN COUNT(*) = 0 THEN '✅ All highlights cleared successfully!'
    ELSE '⚠️ Some highlights remain'
  END as "Status"
FROM highlights;
