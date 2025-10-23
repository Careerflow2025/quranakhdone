-- Migration: Add missing teacher fields
-- Created: 2025-10-23
-- Issue: Teachers table missing subject, qualification, experience, phone, address fields
-- Impact: Teacher details showing "not provided" for all these fields

-- Add missing columns to teachers table
ALTER TABLE teachers
ADD COLUMN IF NOT EXISTS subject TEXT,
ADD COLUMN IF NOT EXISTS qualification TEXT,
ADD COLUMN IF NOT EXISTS experience INTEGER,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS address TEXT;

-- Add constraint to ensure experience is reasonable if provided
ALTER TABLE teachers
ADD CONSTRAINT teachers_experience_check
CHECK (experience IS NULL OR (experience >= 0 AND experience <= 50));

-- Create index for common teacher queries
CREATE INDEX IF NOT EXISTS idx_teachers_subject ON teachers(subject);
