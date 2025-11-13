-- FIX SCRIPT: Add student to message_recipients for group message
-- RUN THIS ONLY AFTER CONFIRMING MESSAGE IS A GROUP MESSAGE FROM DIAGNOSTIC QUERY

-- Option 1: If this is supposed to be a GROUP message
-- Add the student to message_recipients
INSERT INTO message_recipients (message_id, recipient_id, read_at)
VALUES (
  '2259905e-26ab-484e-aaea-f21ad7fda077',
  '045d7665-77eb-4f78-be68-e07e5bd26251',
  NULL
)
ON CONFLICT DO NOTHING;

-- Option 2: If this is supposed to be an INDIVIDUAL message
-- Update the message to have to_user_id populated
-- UPDATE messages
-- SET to_user_id = '045d7665-77eb-4f78-be68-e07e5bd26251',
--     recipient_type = 'individual'
-- WHERE id = '2259905e-26ab-484e-aaea-f21ad7fda077';

-- Verify the fix
SELECT
  m.id,
  m.to_user_id,
  m.recipient_type,
  (SELECT COUNT(*) FROM message_recipients WHERE message_id = m.id) as recipient_count
FROM messages m
WHERE m.id = '2259905e-26ab-484e-aaea-f21ad7fda077';
