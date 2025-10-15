-- Migration to add missing columns to schools table
-- This migration adds all columns needed for the school registration form

-- Add missing columns to schools table
ALTER TABLE public.schools 
ADD COLUMN IF NOT EXISTS type TEXT,
ADD COLUMN IF NOT EXISTS established_year INTEGER,
ADD COLUMN IF NOT EXISTS student_capacity TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC',
ADD COLUMN IF NOT EXISTS admin_email TEXT,
ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'professional',
ADD COLUMN IF NOT EXISTS admin_first_name TEXT,
ADD COLUMN IF NOT EXISTS admin_last_name TEXT,
ADD COLUMN IF NOT EXISTS admin_phone TEXT,
ADD COLUMN IF NOT EXISTS admin_role TEXT DEFAULT 'principal',
ADD COLUMN IF NOT EXISTS number_of_teachers INTEGER,
ADD COLUMN IF NOT EXISTS school_registration_id TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create an index on admin_email for faster lookups
CREATE INDEX IF NOT EXISTS idx_schools_admin_email ON public.schools(admin_email);

-- Create an index on admin_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_schools_admin_id ON public.schools(admin_id);

-- Update RLS policies for schools table to allow school creation
CREATE POLICY "Allow public school registration" 
ON public.schools 
FOR INSERT 
TO public 
WITH CHECK (true);

CREATE POLICY "Schools can view their own data" 
ON public.schools 
FOR SELECT 
USING (
  auth.uid() = admin_id 
  OR 
  auth.uid() IN (
    SELECT user_id FROM public.teachers WHERE school_id = schools.id
  )
  OR
  auth.uid() IN (
    SELECT user_id FROM public.parents p
    JOIN public.parent_students ps ON p.id = ps.parent_id
    JOIN public.students s ON ps.student_id = s.id
    WHERE s.school_id = schools.id
  )
);

CREATE POLICY "School admins can update their school" 
ON public.schools 
FOR UPDATE 
USING (auth.uid() = admin_id)
WITH CHECK (auth.uid() = admin_id);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_schools_updated_at 
BEFORE UPDATE ON public.schools
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();