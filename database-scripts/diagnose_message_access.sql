-- Diagnostic query for message access issue
-- Message ID: 2259905e-26ab-484e-aaea-f21ad7fda077
-- Student ID: 045d7665-77eb-4f78-be68-e07e5bd26251
-- Teacher ID: 73ca2dfe-8531-4a45-b01f-b802776b5f2d

-- 1. Check the message details
SELECT
  m.id,
  m.from_user_id,
  m.to_user_id,
  m.recipient_type,
  m.subject,
  LEFT(m.body, 100) as body_preview,
  m.created_at,
  pf.display_name as from_name,
  pf.role as from_role,
  pt.display_name as to_name,
  pt.role as to_role
FROM messages m
LEFT JOIN profiles pf ON pf.user_id = m.from_user_id
LEFT JOIN profiles pt ON pt.user_id = m.to_user_id
WHERE m.id = '2259905e-26ab-484e-aaea-f21ad7fda077';

-- 2. Check if student is in message_recipients
SELECT
  mr.id,
  mr.message_id,
  mr.recipient_id,
  mr.read_at,
  p.display_name as recipient_name,
  p.role as recipient_role
FROM message_recipients mr
JOIN profiles p ON p.user_id = mr.recipient_id
WHERE mr.message_id = '2259905e-26ab-484e-aaea-f21ad7fda077';

-- 3. Check if there are ANY recipients for this message
SELECT COUNT(*) as recipient_count
FROM message_recipients
WHERE message_id = '2259905e-26ab-484e-aaea-f21ad7fda077';

-- 4. Check if this is part of a thread
SELECT
  m.id,
  m.from_user_id,
  m.to_user_id,
  m.thread_id,
  LEFT(m.body, 50) as body_preview,
  m.created_at
FROM messages m
WHERE m.id = '2259905e-26ab-484e-aaea-f21ad7fda077'
   OR m.thread_id = '2259905e-26ab-484e-aaea-f21ad7fda077'
ORDER BY m.created_at;

-- 5. Check student profile
SELECT
  p.user_id,
  p.school_id,
  p.role,
  p.display_name,
  p.email
FROM profiles p
WHERE p.user_id = '045d7665-77eb-4f78-be68-e07e5bd26251';

-- 6. Check teacher profile
SELECT
  p.user_id,
  p.school_id,
  p.role,
  p.display_name,
  p.email
FROM profiles p
WHERE p.user_id = '73ca2dfe-8531-4a45-b01f-b802776b5f2d';

-- 7. Check if they're in the same school
SELECT
  'Student' as person,
  p.school_id,
  s.name as school_name
FROM profiles p
LEFT JOIN schools s ON s.id = p.school_id
WHERE p.user_id = '045d7665-77eb-4f78-be68-e07e5bd26251'
UNION ALL
SELECT
  'Teacher' as person,
  p.school_id,
  s.name as school_name
FROM profiles p
LEFT JOIN schools s ON s.id = p.school_id
WHERE p.user_id = '73ca2dfe-8531-4a45-b01f-b802776b5f2d';
