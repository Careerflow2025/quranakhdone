-- =====================================================
-- ADD MISSING FIELDS TO ALL TABLES
-- =====================================================
-- Created: 2025-10-23
-- Purpose: Add all missing fields discovered during production testing

-- =====================================================
-- CLASSES TABLE - Add grade_level and capacity
-- =====================================================

ALTER TABLE classes
ADD COLUMN IF NOT EXISTS grade_level TEXT,
ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 30;

COMMENT ON COLUMN classes.grade_level IS 'Grade level for the class (e.g., "6th Grade", "Year 7")';
COMMENT ON COLUMN classes.capacity IS 'Maximum number of students allowed in the class';

-- =====================================================
-- STUDENTS TABLE - Add age, grade, phone
-- =====================================================

ALTER TABLE students
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS grade TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT;

COMMENT ON COLUMN students.age IS 'Student age in years';
COMMENT ON COLUMN students.grade IS 'Student grade level (e.g., "6th Grade")';
COMMENT ON COLUMN students.phone IS 'Student contact phone number';

-- Add check constraint for reasonable age range
ALTER TABLE students
ADD CONSTRAINT students_age_check CHECK (age IS NULL OR (age >= 5 AND age <= 25));

-- =====================================================
-- PARENTS TABLE - Add phone and address
-- =====================================================

ALTER TABLE parents
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS address TEXT;

COMMENT ON COLUMN parents.phone IS 'Parent contact phone number';
COMMENT ON COLUMN parents.address IS 'Parent home address';

-- =====================================================
-- CALENDAR_EVENTS TABLE - Add missing fields to match events table
-- =====================================================

ALTER TABLE calendar_events
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS color TEXT,
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS recurrence_rule JSONB;

COMMENT ON COLUMN calendar_events.location IS 'Event location (e.g., "Room 101", "Main Hall")';
COMMENT ON COLUMN calendar_events.color IS 'Event color for calendar display (e.g., "#3B82F6")';
COMMENT ON COLUMN calendar_events.is_recurring IS 'Whether this is a recurring event';
COMMENT ON COLUMN calendar_events.recurrence_rule IS 'iCalendar RRULE for recurring events';
