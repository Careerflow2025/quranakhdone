/**
 * Enable Supabase Realtime for Messages
 * Created: 2025-11-12
 * Purpose: Enable real-time subscriptions for professional messaging experience
 *
 * This enables instant message delivery like Slack, WhatsApp, and other
 * modern messaging platforms (100M pound company standard).
 */

-- Enable realtime for messages table
ALTER publication supabase_realtime ADD TABLE messages;

-- Enable realtime for message_recipients table (for group messages)
ALTER publication supabase_realtime ADD TABLE message_recipients;

-- Add index to optimize realtime filters by to_user_id
CREATE INDEX IF NOT EXISTS idx_messages_to_user_realtime
ON messages(to_user_id, created_at DESC)
WHERE to_user_id IS NOT NULL;

-- Add index to optimize realtime filters by thread_id
CREATE INDEX IF NOT EXISTS idx_messages_thread_realtime
ON messages(thread_id, created_at DESC)
WHERE thread_id IS NOT NULL;

-- Add index for message_recipients realtime filtering
CREATE INDEX IF NOT EXISTS idx_message_recipients_realtime
ON message_recipients(recipient_id, created_at DESC);

-- Add comment
COMMENT ON TABLE messages IS 'Messages table with realtime enabled for instant delivery across dashboards';
COMMENT ON TABLE message_recipients IS 'Group message recipients with realtime enabled for instant group notifications';
