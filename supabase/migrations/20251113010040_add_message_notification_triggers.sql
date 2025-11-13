-- =====================================================
-- MESSAGE NOTIFICATION TRIGGERS
-- =====================================================
-- Purpose: Automatically create notifications when messages are sent
-- Created: 2025-11-13
-- =====================================================

-- =====================================================
-- MESSAGE TRIGGERS
-- =====================================================

-- Trigger: When a new message is sent
CREATE OR REPLACE FUNCTION notify_message_received()
RETURNS TRIGGER AS $$
DECLARE
  sender_user_id uuid;
  recipient_user_id uuid;
  recipient_school_id uuid;
  sender_name text;
BEGIN
  -- Get sender and recipient info
  sender_user_id := NEW.from_user_id;
  recipient_user_id := NEW.to_user_id;

  -- Get sender's display name
  SELECT display_name INTO sender_name
  FROM public.profiles
  WHERE user_id = sender_user_id;

  -- Get recipient's school_id
  SELECT school_id INTO recipient_school_id
  FROM public.profiles
  WHERE user_id = recipient_user_id;

  -- Create notification for the recipient
  INSERT INTO public.notifications (
    user_id,
    school_id,
    section,
    type,
    title,
    message,
    metadata
  )
  VALUES (
    recipient_user_id,
    recipient_school_id,
    'messages',
    'message_received',
    'New Message from ' || COALESCE(sender_name, 'Unknown'),
    CASE
      WHEN LENGTH(NEW.subject) > 0 THEN NEW.subject
      WHEN LENGTH(NEW.body) > 50 THEN SUBSTRING(NEW.body, 1, 50) || '...'
      ELSE NEW.body
    END,
    jsonb_build_object(
      'message_id', NEW.id,
      'sender_id', sender_user_id,
      'sender_name', sender_name,
      'thread_id', NEW.thread_id,
      'private', NEW.private
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS message_received_trigger ON public.messages;
CREATE TRIGGER message_received_trigger
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_message_received();

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Ensure we have indexes on foreign keys used in triggers
CREATE INDEX IF NOT EXISTS idx_messages_from_user ON public.messages(from_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_to_user ON public.messages(to_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_school ON public.messages(school_id);

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant execute permissions on trigger function to authenticated users
GRANT EXECUTE ON FUNCTION notify_message_received() TO authenticated;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON FUNCTION notify_message_received IS 'Automatically creates notification when message is sent to recipient';

-- Success message
DO $$
BEGIN
  RAISE NOTICE ' Message notification trigger created successfully';
  RAISE NOTICE ' Recipients will now receive notifications for new messages';
END $$;
