-- Fix specific_class Recipients Bug
-- Created: 2025-11-11
-- Purpose: Fix SQL error in create_group_message_recipients for specific_class messages
-- Bug: Line 179 uses 's.user_id' but table alias is 'st'

-- =====================================================
-- FIX CREATE_GROUP_MESSAGE_RECIPIENTS FUNCTION
-- =====================================================

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
        SELECT p_message_id, st.user_id  -- FIX: Changed from s.user_id to st.user_id
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
  'Create recipient records for group messages based on recipient type and details. Fixed specific_class alias bug.';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Fixed specific_class recipients SQL alias bug';
  RAISE NOTICE '✅ Changed s.user_id to st.user_id in specific_class handler';
  RAISE NOTICE '✅ Messages to specific classes will now work correctly';
END $$;
