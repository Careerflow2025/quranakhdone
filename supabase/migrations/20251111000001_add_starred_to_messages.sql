-- Add starred/favorite column to messages table
-- Created: 2025-11-11
-- Purpose: Allow users to star/favorite important messages for quick access

-- =====================================================
-- 1. ADD STARRED COLUMN TO MESSAGES TABLE
-- =====================================================

ALTER TABLE messages
ADD COLUMN IF NOT EXISTS starred BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN messages.starred IS 'Whether the message is starred/favorited by the recipient for quick access';

-- =====================================================
-- 2. CREATE INDEX FOR STARRED MESSAGES
-- =====================================================

-- Index for filtering starred messages quickly
CREATE INDEX IF NOT EXISTS idx_messages_starred
  ON messages(to_user_id, starred) WHERE starred = TRUE;

COMMENT ON INDEX idx_messages_starred IS 'Optimize queries for starred messages by recipient';

-- =====================================================
-- 3. CREATE STARRED_MESSAGES TABLE FOR GROUP MESSAGES
-- =====================================================

-- For group messages, we need a separate table to track which users starred the message
CREATE TABLE IF NOT EXISTS starred_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  starred_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

COMMENT ON TABLE starred_messages IS 'Tracks which users have starred group messages (for messages where to_user_id IS NULL)';

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_starred_messages_user
  ON starred_messages(user_id, starred_at DESC);

CREATE INDEX IF NOT EXISTS idx_starred_messages_message
  ON starred_messages(message_id);

-- =====================================================
-- 4. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE starred_messages ENABLE ROW LEVEL SECURITY;

-- Users can only see their own starred messages
CREATE POLICY "Users can view their starred messages"
  ON starred_messages FOR SELECT
  USING (user_id = auth.uid());

-- Users can star messages
CREATE POLICY "Users can star messages"
  ON starred_messages FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can unstar their messages
CREATE POLICY "Users can unstar messages"
  ON starred_messages FOR DELETE
  USING (user_id = auth.uid());

-- =====================================================
-- 5. SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Starred messages feature added successfully';
  RAISE NOTICE '✅ Individual messages: Use messages.starred column';
  RAISE NOTICE '✅ Group messages: Use starred_messages table';
END $$;
