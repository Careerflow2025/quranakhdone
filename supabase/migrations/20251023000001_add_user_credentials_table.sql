-- =====================================================
-- USER CREDENTIALS TABLE
-- =====================================================
-- Created: 2025-10-23
-- Purpose: Store temporary credentials for users to access their accounts
-- Used by: School Dashboard credentials system

CREATE TABLE IF NOT EXISTS user_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'parent', 'admin', 'owner')),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_credentials_user_id ON user_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_user_credentials_school_id ON user_credentials(school_id);
CREATE INDEX IF NOT EXISTS idx_user_credentials_email ON user_credentials(email);

-- Enable RLS
ALTER TABLE user_credentials ENABLE ROW LEVEL SECURITY;

-- RLS Policies: School admins can view all credentials for their school
CREATE POLICY "School admins can view credentials"
  ON user_credentials FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM profiles
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- School admins can insert credentials for their school
CREATE POLICY "School admins can insert credentials"
  ON user_credentials FOR INSERT
  WITH CHECK (
    school_id IN (
      SELECT school_id FROM profiles
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- School admins can update credentials for their school
CREATE POLICY "School admins can update credentials"
  ON user_credentials FOR UPDATE
  USING (
    school_id IN (
      SELECT school_id FROM profiles
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- School admins can delete credentials for their school
CREATE POLICY "School admins can delete credentials"
  ON user_credentials FOR DELETE
  USING (
    school_id IN (
      SELECT school_id FROM profiles
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_user_credentials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_credentials_updated_at
  BEFORE UPDATE ON user_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_user_credentials_updated_at();
