-- Create message_attachments table
-- Created: 2025-11-11
-- Purpose: Store file attachments for messages

-- =====================================================
-- CREATE MESSAGE_ATTACHMENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE message_attachments IS 'Stores file attachments for messages';
COMMENT ON COLUMN message_attachments.message_id IS 'Reference to the parent message';
COMMENT ON COLUMN message_attachments.url IS 'Public URL from Supabase Storage';
COMMENT ON COLUMN message_attachments.filename IS 'Original filename';
COMMENT ON COLUMN message_attachments.mime_type IS 'MIME type of the file (e.g., application/pdf)';
COMMENT ON COLUMN message_attachments.size IS 'File size in bytes';

-- =====================================================
-- CREATE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_message_attachments_message_id
  ON message_attachments(message_id);

COMMENT ON INDEX idx_message_attachments_message_id IS 'Optimize queries for attachments by message';

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;

-- Users can view attachments for messages they can access
CREATE POLICY "Users can view attachments for their messages"
  ON message_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      WHERE m.id = message_attachments.message_id
      AND (
        -- User is sender
        m.from_user_id = auth.uid()
        OR
        -- User is recipient (individual message)
        m.to_user_id = auth.uid()
        OR
        -- User is in message_recipients (group message)
        EXISTS (
          SELECT 1 FROM message_recipients mr
          WHERE mr.message_id = m.id
          AND mr.recipient_id = auth.uid()
        )
      )
    )
  );

-- Users can add attachments to messages they are sending
CREATE POLICY "Users can add attachments to their messages"
  ON message_attachments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM messages m
      WHERE m.id = message_attachments.message_id
      AND m.from_user_id = auth.uid()
    )
  );

-- Users can delete attachments from their own messages
CREATE POLICY "Users can delete attachments from their messages"
  ON message_attachments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      WHERE m.id = message_attachments.message_id
      AND m.from_user_id = auth.uid()
    )
  );

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ message_attachments table created successfully';
  RAISE NOTICE '✅ RLS policies applied for secure attachment access';
  RAISE NOTICE '✅ Indexes created for optimal performance';
END $$;
