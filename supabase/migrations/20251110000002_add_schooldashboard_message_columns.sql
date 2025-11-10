-- Add School Dashboard Message Columns
-- Created: 2025-11-10
-- Purpose: Add columns used by SchoolDashboard messaging component

-- =====================================================
-- 1. ADD MISSING COLUMNS TO MESSAGES TABLE
-- =====================================================

-- Add sender_id as alias/reference to from_user_id for compatibility
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE;

-- Add priority column for message importance
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent'));

-- Add recipient_type for group messaging
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS recipient_type TEXT DEFAULT 'individual' CHECK (recipient_type IN ('individual', 'all_parents', 'all_teachers', 'all_students', 'specific_class', 'custom_group'));

-- Add recipient_details for storing group message metadata
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS recipient_details JSONB;

-- Add sent_via_email flag
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS sent_via_email BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN messages.sender_id IS 'Alternative reference to message sender (compatibility with SchoolDashboard)';
COMMENT ON COLUMN messages.priority IS 'Message priority level: low, normal, high, urgent';
COMMENT ON COLUMN messages.recipient_type IS 'Type of recipient: individual, all_parents, all_teachers, all_students, specific_class, custom_group';
COMMENT ON COLUMN messages.recipient_details IS 'Additional recipient metadata for group messages (class_id, user_ids, etc.)';
COMMENT ON COLUMN messages.sent_via_email IS 'Whether this message was also sent via email notification';

-- =====================================================
-- 2. CREATE MESSAGE_RECIPIENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS message_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE message_recipients IS
  'Junction table for group messages. Links messages to multiple recipients for all_parents, all_teachers, etc.';

-- =====================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Index for sender_id lookups
CREATE INDEX IF NOT EXISTS idx_messages_sender
  ON messages(sender_id) WHERE sender_id IS NOT NULL;

-- Index for priority filtering
CREATE INDEX IF NOT EXISTS idx_messages_priority
  ON messages(priority) WHERE priority IN ('high', 'urgent');

-- Index for recipient_type grouping
CREATE INDEX IF NOT EXISTS idx_messages_recipient_type
  ON messages(recipient_type);

-- Message recipients indexes
CREATE INDEX IF NOT EXISTS idx_message_recipients_message
  ON message_recipients(message_id);

CREATE INDEX IF NOT EXISTS idx_message_recipients_recipient
  ON message_recipients(recipient_id, read_at);

CREATE INDEX IF NOT EXISTS idx_message_recipients_unread
  ON message_recipients(recipient_id) WHERE read_at IS NULL;

-- =====================================================
-- 4. RLS POLICIES FOR MESSAGE_RECIPIENTS
-- =====================================================

ALTER TABLE message_recipients ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own recipient records
CREATE POLICY "view_own_message_recipients"
  ON message_recipients FOR SELECT
  USING (recipient_id = auth.uid());

-- Policy: Message senders can create recipient records
CREATE POLICY "create_message_recipients"
  ON message_recipients FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM messages m
      WHERE m.id = message_recipients.message_id
        AND (m.from_user_id = auth.uid() OR m.sender_id = auth.uid())
    )
  );

-- Policy: Recipients can update their own read status
CREATE POLICY "update_own_recipient_status"
  ON message_recipients FOR UPDATE
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

-- =====================================================
-- 5. TRIGGER TO AUTO-POPULATE SENDER_ID
-- =====================================================

-- Create trigger to automatically set sender_id from from_user_id
CREATE OR REPLACE FUNCTION sync_sender_id()
RETURNS TRIGGER AS $$
BEGIN
  -- If sender_id is not provided, copy from from_user_id
  IF NEW.sender_id IS NULL AND NEW.from_user_id IS NOT NULL THEN
    NEW.sender_id = NEW.from_user_id;
  END IF;

  -- If from_user_id is not provided, copy from sender_id
  IF NEW.from_user_id IS NULL AND NEW.sender_id IS NOT NULL THEN
    NEW.from_user_id = NEW.sender_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_sender_id ON messages;
CREATE TRIGGER trigger_sync_sender_id
  BEFORE INSERT OR UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION sync_sender_id();

-- =====================================================
-- 6. HELPER FUNCTION FOR GROUP MESSAGING
-- =====================================================

-- Function: Create message recipients for group messages
CREATE OR REPLACE FUNCTION create_group_message_recipients(
  p_message_id UUID,
  p_recipient_type TEXT,
  p_recipient_details JSONB
)
RETURNS INTEGER AS $$
DECLARE
  recipient_count INTEGER := 0;
  recipient_user_id UUID;
BEGIN
  -- Get message details
  IF NOT EXISTS (SELECT 1 FROM messages WHERE id = p_message_id) THEN
    RAISE EXCEPTION 'Message not found: %', p_message_id;
  END IF;

  -- Handle different recipient types
  CASE p_recipient_type
    WHEN 'all_parents' THEN
      INSERT INTO message_recipients (message_id, recipient_id)
      SELECT p_message_id, p.user_id
      FROM parents par
      JOIN profiles p ON par.user_id = p.user_id
      WHERE p.school_id = (SELECT school_id FROM messages WHERE id = p_message_id);

    WHEN 'all_teachers' THEN
      INSERT INTO message_recipients (message_id, recipient_id)
      SELECT p_message_id, p.user_id
      FROM teachers t
      JOIN profiles p ON t.user_id = p.user_id
      WHERE p.school_id = (SELECT school_id FROM messages WHERE id = p_message_id);

    WHEN 'all_students' THEN
      INSERT INTO message_recipients (message_id, recipient_id)
      SELECT p_message_id, p.user_id
      FROM students s
      JOIN profiles p ON s.user_id = p.user_id
      WHERE p.school_id = (SELECT school_id FROM messages WHERE id = p_message_id);

    WHEN 'specific_class' THEN
      IF p_recipient_details ? 'class_id' THEN
        INSERT INTO message_recipients (message_id, recipient_id)
        SELECT p_message_id, s.user_id
        FROM class_enrollments ce
        JOIN students st ON ce.student_id = st.id
        WHERE ce.class_id = (p_recipient_details->>'class_id')::UUID;
      END IF;

    WHEN 'custom_group' THEN
      IF p_recipient_details ? 'user_ids' THEN
        INSERT INTO message_recipients (message_id, recipient_id)
        SELECT p_message_id, (jsonb_array_elements_text(p_recipient_details->'user_ids'))::UUID;
      END IF;

    ELSE
      -- individual - no recipients table needed, use to_user_id
      NULL;
  END CASE;

  GET DIAGNOSTICS recipient_count = ROW_COUNT;
  RETURN recipient_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_group_message_recipients(UUID, TEXT, JSONB) IS
  'Create recipient records for group messages based on recipient type and details';

-- =====================================================
-- 7. GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION create_group_message_recipients(UUID, TEXT, JSONB) TO authenticated;

-- =====================================================
-- 8. VALIDATION CHECKS
-- =====================================================

-- Verify sender_id column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'sender_id'
  ) THEN
    RAISE EXCEPTION 'sender_id column was not created';
  ELSE
    RAISE NOTICE '✅ sender_id column created';
  END IF;
END $$;

-- Verify priority column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'priority'
  ) THEN
    RAISE EXCEPTION 'priority column was not created';
  ELSE
    RAISE NOTICE '✅ priority column created';
  END IF;
END $$;

-- Verify message_recipients table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'message_recipients'
  ) THEN
    RAISE EXCEPTION 'message_recipients table was not created';
  ELSE
    RAISE NOTICE '✅ message_recipients table created';
  END IF;
END $$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ SchoolDashboard messaging schema migration completed';
  RAISE NOTICE '✅ Group messaging support enabled';
  RAISE NOTICE '✅ Priority messaging enabled';
  RAISE NOTICE '✅ Ready for SchoolDashboard messaging';
END $$;
