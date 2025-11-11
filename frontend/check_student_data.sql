-- Check highlights for students 12 and 7
SELECT 
  student_id,
  type,
  COUNT(*) as count
FROM highlights
WHERE student_id IN ('12', '7')
GROUP BY student_id, type
ORDER BY student_id, type;

-- Total highlights per student
SELECT 
  student_id,
  COUNT(*) as total_highlights
FROM highlights
WHERE student_id IN ('12', '7')
GROUP BY student_id;

-- Check homework highlights specifically
SELECT 
  student_id,
  COUNT(*) as homework_count
FROM highlights
WHERE student_id IN ('12', '7') AND type = 'homework'
GROUP BY student_id;

-- Check assignments
SELECT 
  student_id,
  COUNT(*) as assignment_count
FROM assignments
WHERE student_id IN ('12', '7')
GROUP BY student_id;

-- Check targets (direct)
SELECT 
  student_id,
  COUNT(*) as target_count
FROM targets
WHERE student_id IN ('12', '7')
GROUP BY student_id;

-- Check targets (junction table)
SELECT 
  student_id,
  COUNT(*) as target_count
FROM target_students
WHERE student_id IN ('12', '7')
GROUP BY student_id;
