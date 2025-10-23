-- =====================================================
-- PHASE 6: Advanced Calendar & Events System
-- Created: 2025-10-21
-- Purpose: Create events table with recurring event support
-- =====================================================

-- Create event_type enum
DO $$ BEGIN
  CREATE TYPE event_type AS ENUM (
    'assignment_due',
    'homework_due',
    'target_due',
    'class_session',
    'school_event',
    'holiday',
    'exam',
    'meeting',
    'reminder',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create recurrence_frequency enum
DO $$ BEGIN
  CREATE TYPE recurrence_frequency AS ENUM (
    'daily',
    'weekly',
    'monthly',
    'yearly'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Events table with recurring event support
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  created_by_user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,

  -- Event details
  title TEXT NOT NULL,
  description TEXT,
  event_type event_type NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN DEFAULT FALSE,
  location TEXT,
  color TEXT, -- Hex color for calendar display

  -- Recurrence support
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_rule JSONB, -- RecurrenceRule object
  recurrence_parent_id UUID REFERENCES events(id) ON DELETE CASCADE,

  -- Linked resources (optional)
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES assignments(id) ON DELETE SET NULL,
  homework_id UUID, -- May not exist in schema yet
  target_id UUID, -- May not exist in schema yet

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_date_range CHECK (start_date <= end_date)
);

-- Event participants table
CREATE TABLE IF NOT EXISTS event_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'accepted', 'declined', 'maybe')),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(event_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_school_id ON events(school_id);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_end_date ON events(end_date);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_class_id ON events(class_id);
CREATE INDEX IF NOT EXISTS idx_events_recurrence_parent ON events(recurrence_parent_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_user_id ON event_participants(user_id);

-- RLS Policies for events
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Everyone can view events in their school
CREATE POLICY "Users can view events in their school"
  ON events FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Teachers/Admins/Owners can create events
CREATE POLICY "Teachers and admins can create events"
  ON events FOR INSERT
  WITH CHECK (
    school_id IN (
      SELECT school_id FROM profiles
      WHERE user_id = auth.uid()
      AND role IN ('teacher', 'admin', 'owner')
    )
  );

-- Creators, admins, and owners can update events
CREATE POLICY "Creators and admins can update events"
  ON events FOR UPDATE
  USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE user_id = auth.uid()
    )
    AND (
      created_by_user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM profiles
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'owner')
      )
    )
  );

-- Creators, admins, and owners can delete events
CREATE POLICY "Creators and admins can delete events"
  ON events FOR DELETE
  USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE user_id = auth.uid()
    )
    AND (
      created_by_user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM profiles
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'owner')
      )
    )
  );

-- RLS Policies for event_participants
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;

-- Users can view participants of events in their school
CREATE POLICY "Users can view event participants in their school"
  ON event_participants FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM events
      WHERE school_id IN (
        SELECT school_id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Event creators and admins can manage participants
CREATE POLICY "Event creators can manage participants"
  ON event_participants FOR ALL
  USING (
    event_id IN (
      SELECT id FROM events
      WHERE created_by_user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM profiles
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'owner')
      )
    )
  );

-- Updated_at trigger for events
CREATE OR REPLACE FUNCTION update_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_events_updated_at();

COMMENT ON TABLE events IS 'Calendar events with recurring event support';
COMMENT ON TABLE event_participants IS 'Event participant invitations and RSVPs';
