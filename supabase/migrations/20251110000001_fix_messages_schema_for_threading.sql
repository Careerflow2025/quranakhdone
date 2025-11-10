-- Fix Messages Schema for Threading and API Compatibility
-- Created: 2025-11-10
-- Purpose: Add missing columns to messages table to support threading, metadata, and attachments

-- =====================================================
-- 1. ADD MISSING COLUMNS TO MESSAGES TABLE
-- =====================================================

-- Add threading support
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS thread_id UUID REFERENCES messages(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add metadata fields for API compatibility
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS topic TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS extension TEXT DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS payload JSONB,
ADD COLUMN IF NOT EXISTS event TEXT,
ADD COLUMN IF NOT EXISTS private BOOLEAN DEFAULT FALSE;

-- Add soft delete support
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS starred BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN messages.thread_id IS 'References the root message of a conversation thread. NULL = root message, non-NULL = reply';
COMMENT ON COLUMN messages.topic IS 'Message category: general, homework, assignment, announcement, etc.';
COMMENT ON COLUMN messages.extension IS 'Message type extension: standard, system, automated, etc.';
COMMENT ON COLUMN messages.payload IS 'Additional metadata as JSON (attachments refs, custom fields, etc.)';
COMMENT ON COLUMN messages.event IS 'Event type for system messages: user_joined, assignment_created, etc.';
COMMENT ON COLUMN messages.private IS 'Whether this is a private 1-on-1 message vs group/broadcast';

-- =====================================================
-- 2. CREATE MESSAGE_ATTACHMENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL CHECK (file_size > 0),
  uploaded_by UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE message_attachments IS
  'File attachments for messages. Links to messages with CASCADE delete.';

-- =====================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Thread lookup index
CREATE INDEX IF NOT EXISTS idx_messages_thread
  ON messages(thread_id) WHERE thread_id IS NOT NULL;

-- Unread messages index (critical for inbox queries)
CREATE INDEX IF NOT EXISTS idx_messages_unread
  ON messages(to_user_id, read_at) WHERE read_at IS NULL;

-- User's sent messages index
CREATE INDEX IF NOT EXISTS idx_messages_sent
  ON messages(from_user_id, created_at DESC);

-- User's received messages index
CREATE INDEX IF NOT EXISTS idx_messages_received
  ON messages(to_user_id, created_at DESC);

-- School isolation index
CREATE INDEX IF NOT EXISTS idx_messages_school
  ON messages(school_id, created_at DESC);

-- Soft delete filter index
CREATE INDEX IF NOT EXISTS idx_messages_active
  ON messages(to_user_id, from_user_id) WHERE deleted_at IS NULL;

-- Starred and archived indexes
CREATE INDEX IF NOT EXISTS idx_messages_starred
  ON messages(to_user_id, starred) WHERE starred = TRUE;

CREATE INDEX IF NOT EXISTS idx_messages_archived
  ON messages(to_user_id, archived) WHERE archived = TRUE;

-- Message attachments index
CREATE INDEX IF NOT EXISTS idx_attachments_message
  ON message_attachments(message_id);

CREATE INDEX IF NOT EXISTS idx_attachments_uploader
  ON message_attachments(uploaded_by);

-- =====================================================
-- 4. UPDATE RLS POLICIES FOR MESSAGE_ATTACHMENTS
-- =====================================================

ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view attachments of messages they can view
CREATE POLICY "view_message_attachments"
  ON message_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      WHERE m.id = message_attachments.message_id
        AND (m.from_user_id = auth.uid() OR m.to_user_id = auth.uid())
    )
  );

-- Policy: Users can add attachments to messages they sent
CREATE POLICY "add_message_attachments"
  ON message_attachments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM messages m
      WHERE m.id = message_attachments.message_id
        AND m.from_user_id = auth.uid()
    )
    AND uploaded_by = auth.uid()
  );

-- Policy: Users can delete their own attachments
CREATE POLICY "delete_own_attachments"
  ON message_attachments FOR DELETE
  USING (uploaded_by = auth.uid());

-- =====================================================
-- 5. ADD UPDATED_AT TRIGGER FOR MESSAGES
-- =====================================================

-- Create trigger function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_messages_updated_at ON messages;
CREATE TRIGGER trigger_update_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_messages_updated_at();

-- =====================================================
-- 6. ADD HELPER FUNCTIONS FOR MESSAGING
-- =====================================================

-- Function: Get thread messages
CREATE OR REPLACE FUNCTION get_thread_messages(root_message_id UUID)
RETURNS TABLE (
  id UUID,
  from_user_id UUID,
  to_user_id UUID,
  subject TEXT,
  body TEXT,
  created_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  from_user_name TEXT,
  to_user_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.from_user_id,
    m.to_user_id,
    m.subject,
    m.body,
    m.created_at,
    m.read_at,
    from_profile.display_name AS from_user_name,
    to_profile.display_name AS to_user_name
  FROM messages m
  LEFT JOIN profiles from_profile ON m.from_user_id = from_profile.user_id
  LEFT JOIN profiles to_profile ON m.to_user_id = to_profile.user_id
  WHERE m.id = root_message_id
     OR m.thread_id = root_message_id
  ORDER BY m.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_thread_messages(UUID) IS
  'Fetch all messages in a conversation thread, ordered chronologically';

-- Function: Get unread count for user
CREATE OR REPLACE FUNCTION get_unread_message_count(user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM messages
    WHERE to_user_id = get_unread_message_count.user_id
      AND read_at IS NULL
      AND deleted_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_unread_message_count(UUID) IS
  'Get count of unread messages for a specific user';

-- Function: Get conversation participants
CREATE OR REPLACE FUNCTION get_conversation_participants(message_id UUID)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  role TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    p.user_id,
    p.display_name,
    p.role::TEXT
  FROM messages m
  CROSS JOIN LATERAL (
    SELECT m.from_user_id AS user_id
    UNION
    SELECT m.to_user_id AS user_id
  ) participants
  JOIN profiles p ON p.user_id = participants.user_id
  WHERE m.id = get_conversation_participants.message_id
     OR m.thread_id = get_conversation_participants.message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_conversation_participants(UUID) IS
  'Get all participants in a message thread';

-- =====================================================
-- 7. VALIDATION CHECKS
-- =====================================================

-- Ensure thread_id doesn't create circular references
ALTER TABLE messages
ADD CONSTRAINT check_no_self_thread
CHECK (id != thread_id);

-- Ensure file attachments have valid sizes (max 50MB)
ALTER TABLE message_attachments
ADD CONSTRAINT check_file_size_limit
CHECK (file_size <= 52428800);

-- =====================================================
-- 8. GRANT APPROPRIATE PERMISSIONS
-- =====================================================

-- Grant usage on functions to authenticated users
GRANT EXECUTE ON FUNCTION get_thread_messages(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_message_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_conversation_participants(UUID) TO authenticated;

-- =====================================================
-- 9. UPDATE TABLE COMMENTS
-- =====================================================

COMMENT ON TABLE messages IS
  'Direct messages between users with threading support. RLS ensures school isolation and user privacy.';

-- =====================================================
-- MIGRATION VALIDATION
-- =====================================================

-- Verify all columns exist
DO $$
DECLARE
  missing_columns TEXT[];
BEGIN
  SELECT ARRAY_AGG(col)
  INTO missing_columns
  FROM (
    SELECT unnest(ARRAY[
      'thread_id', 'updated_at', 'topic', 'extension',
      'payload', 'event', 'private', 'deleted_at',
      'starred', 'archived'
    ]) AS col
  ) expected
  WHERE NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'messages'
      AND column_name = expected.col
  );

  IF array_length(missing_columns, 1) > 0 THEN
    RAISE EXCEPTION 'Missing columns in messages table: %', array_to_string(missing_columns, ', ');
  ELSE
    RAISE NOTICE 'All required columns exist in messages table';
  END IF;
END $$;

-- Verify message_attachments table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'message_attachments'
  ) THEN
    RAISE EXCEPTION 'message_attachments table was not created';
  ELSE
    RAISE NOTICE 'message_attachments table created successfully';
  END IF;
END $$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Messages schema migration completed successfully';
  RAISE NOTICE '✅ Threading support enabled';
  RAISE NOTICE '✅ Attachments table created';
  RAISE NOTICE '✅ Indexes created for performance';
  RAISE NOTICE '✅ Helper functions created';
  RAISE NOTICE '✅ Ready for messaging system implementation';
END $$;
