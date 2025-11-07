-- =====================================================
-- ADD LOCKED SCRIPT TO STUDENTS TABLE
-- =====================================================
-- Created: 2025-02-01
-- Purpose: Allow teachers to lock a specific Quran script version for each student

-- Add locked_script_id column to students table
ALTER TABLE students
ADD COLUMN IF NOT EXISTS locked_script_id UUID REFERENCES quran_scripts(id) ON DELETE SET NULL;

COMMENT ON COLUMN students.locked_script_id IS 'The Quran script version locked for this student by their teacher (e.g., uthmani-hafs, warsh, qaloon)';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_students_locked_script ON students(locked_script_id);
