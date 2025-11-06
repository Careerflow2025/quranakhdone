-- Migration: Enable Supabase Realtime for highlights and assignments
-- Purpose: Allow real-time sync across all dashboards when highlights/assignments are created/updated/completed
-- Date: 2025-02-06

-- Enable realtime for highlights table
-- This allows Teacher, School, Student, and Parent dashboards to see updates immediately
ALTER PUBLICATION supabase_realtime ADD TABLE highlights;

-- Enable realtime for assignments table
-- This ensures assignment creation and status changes sync in real-time
ALTER PUBLICATION supabase_realtime ADD TABLE assignments;

-- Enable realtime for assignment_events table
-- This tracks assignment state changes in real-time
ALTER PUBLICATION supabase_realtime ADD TABLE assignment_events;

-- Comments for documentation
COMMENT ON TABLE highlights IS 'Realtime enabled: all dashboards receive immediate updates when highlights are created, completed, or deleted';
COMMENT ON TABLE assignments IS 'Realtime enabled: all dashboards receive immediate updates when assignments are created or status changes';
COMMENT ON TABLE assignment_events IS 'Realtime enabled: tracks assignment lifecycle events in real-time';
