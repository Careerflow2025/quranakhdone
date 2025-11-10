-- Fix Group Messages to_user_id Constraint
-- Created: 2025-11-10
-- Purpose: Make to_user_id nullable for group messages while keeping from_user_id required

-- =====================================================
-- 1. REMOVE NOT NULL CONSTRAINT FROM TO_USER_ID
-- =====================================================

-- For group messages (all_parents, all_teachers, etc.), to_user_id should be NULL
-- Individual recipients are tracked in message_recipients table
ALTER TABLE messages
ALTER COLUMN to_user_id DROP NOT NULL;

COMMENT ON COLUMN messages.to_user_id IS
  'Direct recipient user ID (for individual messages). NULL for group messages - use message_recipients table instead.';

-- =====================================================
-- 2. ADD CHECK CONSTRAINT FOR MESSAGE CONSISTENCY
-- =====================================================

-- Ensure either to_user_id is set (individual) OR recipient_type is group
ALTER TABLE messages
ADD CONSTRAINT check_message_recipient_consistency
CHECK (
  (to_user_id IS NOT NULL AND recipient_type = 'individual')
  OR
  (to_user_id IS NULL AND recipient_type IN ('all_parents', 'all_teachers', 'all_students', 'specific_class', 'custom_group'))
);

COMMENT ON CONSTRAINT check_message_recipient_consistency ON messages IS
  'Ensures individual messages have to_user_id set, and group messages have to_user_id NULL with appropriate recipient_type';

-- =====================================================
-- 3. CREATE TRIGGER TO AUTO-CREATE MESSAGE RECIPIENTS
-- =====================================================

-- Automatically create message_recipients records after message insert for group messages
CREATE OR REPLACE FUNCTION auto_create_message_recipients()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process group messages (where to_user_id is NULL)
  IF NEW.to_user_id IS NULL AND NEW.recipient_type <> 'individual' THEN
    -- Call the helper function to create recipients
    PERFORM create_group_message_recipients(
      NEW.id,
      NEW.recipient_type,
      NEW.recipient_details
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_auto_create_message_recipients ON messages;
CREATE TRIGGER trigger_auto_create_message_recipients
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_message_recipients();

COMMENT ON FUNCTION auto_create_message_recipients() IS
  'Automatically creates message_recipients records for group messages after insert';

-- =====================================================
-- 4. UPDATE EXISTING RLS POLICIES
-- =====================================================

-- Drop and recreate RLS policies to handle NULL to_user_id for group messages

-- Policy for viewing messages (handle both individual and group)
DROP POLICY IF EXISTS "Users can view their messages" ON messages;
CREATE POLICY "Users can view their messages"
  ON messages FOR SELECT
  USING (
    -- Individual messages: user is sender or recipient
    (from_user_id = auth.uid() OR sender_id = auth.uid() OR to_user_id = auth.uid())
    OR
    -- Group messages: user has a recipient record
    (to_user_id IS NULL AND EXISTS (
      SELECT 1 FROM message_recipients mr
      WHERE mr.message_id = messages.id
        AND mr.recipient_id = auth.uid()
    ))
  );

-- Policy for inserting messages
DROP POLICY IF EXISTS "Users can send messages" ON messages;
CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (
    (from_user_id = auth.uid() OR sender_id = auth.uid())
    AND school_id = (SELECT school_id FROM profiles WHERE user_id = auth.uid())
  );

-- Policy for updating messages (mark as read, etc.)
DROP POLICY IF EXISTS "Users can update their messages" ON messages;
CREATE POLICY "Users can update their messages"
  ON messages FOR UPDATE
  USING (
    (from_user_id = auth.uid() OR sender_id = auth.uid() OR to_user_id = auth.uid())
    OR
    (to_user_id IS NULL AND EXISTS (
      SELECT 1 FROM message_recipients mr
      WHERE mr.message_id = messages.id
        AND mr.recipient_id = auth.uid()
    ))
  )
  WITH CHECK (
    (from_user_id = auth.uid() OR sender_id = auth.uid() OR to_user_id = auth.uid())
    OR
    (to_user_id IS NULL AND EXISTS (
      SELECT 1 FROM message_recipients mr
      WHERE mr.message_id = messages.id
        AND mr.recipient_id = auth.uid()
    ))
  );

-- =====================================================
-- 5. UPDATE HELPER FUNCTIONS FOR GROUP MESSAGES
-- =====================================================

-- Update get_unread_message_count to include group messages
CREATE OR REPLACE FUNCTION get_unread_message_count(user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    -- Individual messages
    SELECT COUNT(*)
    FROM messages
    WHERE to_user_id = get_unread_message_count.user_id
      AND read_at IS NULL
      AND deleted_at IS NULL
  ) + (
    -- Group messages
    SELECT COUNT(*)
    FROM message_recipients mr
    JOIN messages m ON m.id = mr.message_id
    WHERE mr.recipient_id = get_unread_message_count.user_id
      AND mr.read_at IS NULL
      AND mr.deleted_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user's messages (both individual and group)
CREATE OR REPLACE FUNCTION get_user_messages(
  p_user_id UUID,
  p_folder TEXT DEFAULT 'inbox',
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  from_user_id UUID,
  to_user_id UUID,
  subject TEXT,
  body TEXT,
  priority TEXT,
  recipient_type TEXT,
  created_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  from_user_name TEXT,
  message_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    m.id,
    m.from_user_id,
    m.to_user_id,
    m.subject,
    m.body,
    m.priority,
    m.recipient_type,
    m.created_at,
    COALESCE(m.read_at, mr.read_at) AS read_at,
    fp.display_name AS from_user_name,
    CASE
      WHEN m.recipient_type = 'individual' THEN 'individual'
      ELSE 'group'
    END AS message_type
  FROM messages m
  LEFT JOIN profiles fp ON m.from_user_id = fp.user_id
  LEFT JOIN message_recipients mr ON m.id = mr.message_id AND mr.recipient_id = p_user_id
  WHERE
    CASE p_folder
      WHEN 'inbox' THEN
        (m.to_user_id = p_user_id OR mr.recipient_id = p_user_id)
      WHEN 'sent' THEN
        (m.from_user_id = p_user_id OR m.sender_id = p_user_id)
      WHEN 'unread' THEN
        ((m.to_user_id = p_user_id AND m.read_at IS NULL) OR (mr.recipient_id = p_user_id AND mr.read_at IS NULL))
      ELSE TRUE
    END
    AND m.deleted_at IS NULL
    AND (mr.deleted_at IS NULL OR mr.deleted_at IS NULL)
  ORDER BY m.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_messages(UUID, TEXT, INTEGER, INTEGER) IS
  'Get user messages from both individual messages and group messages they are part of';

-- =====================================================
-- 6. GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION get_user_messages(UUID, TEXT, INTEGER, INTEGER) TO authenticated;

-- =====================================================
-- 7. VALIDATION
-- =====================================================

-- Verify to_user_id is now nullable
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages'
      AND column_name = 'to_user_id'
      AND is_nullable = 'YES'
  ) THEN
    RAISE NOTICE '✅ to_user_id is now nullable for group messages';
  ELSE
    RAISE EXCEPTION 'to_user_id should be nullable but is not';
  END IF;
END $$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Group messaging constraint fix completed';
  RAISE NOTICE '✅ to_user_id is now nullable for group messages';
  RAISE NOTICE '✅ Auto-create message_recipients trigger enabled';
  RAISE NOTICE '✅ RLS policies updated for group messages';
  RAISE NOTICE '✅ Ready to send messages to all parents/teachers/students';
END $$;
