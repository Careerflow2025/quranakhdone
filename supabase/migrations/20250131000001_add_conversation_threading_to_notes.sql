-- Migration: Add conversation threading to notes table
-- Purpose: Enable endless replies between teacher and student on highlights
-- Date: 2025-01-31

-- Add parent_note_id for conversation threading (self-referential FK)
ALTER TABLE notes ADD COLUMN IF NOT EXISTS parent_note_id UUID REFERENCES notes(id) ON DELETE CASCADE;

-- Add visible_to_parent flag (so teachers can mark notes as visible to parents)
ALTER TABLE notes ADD COLUMN IF NOT EXISTS visible_to_parent BOOLEAN DEFAULT true;

-- Create index for fast thread lookups
CREATE INDEX IF NOT EXISTS idx_notes_parent_note_id ON notes(parent_note_id);
CREATE INDEX IF NOT EXISTS idx_notes_highlight_thread ON notes(highlight_id, parent_note_id);

-- Add comment explaining the threading structure
COMMENT ON COLUMN notes.parent_note_id IS 'Self-referential FK for conversation threading. NULL = top-level note, non-NULL = reply to another note';
COMMENT ON COLUMN notes.visible_to_parent IS 'Whether this note should be visible to the student''s parent(s)';

-- Update RLS policies to allow students to reply to notes
-- Note: Existing policy only allows viewing, we need to add INSERT for students

-- Students can create reply notes on highlights about them
CREATE POLICY "Students can reply to notes about them"
  ON notes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM highlights h
      JOIN students s ON s.id = h.student_id
      JOIN profiles p ON p.user_id = s.user_id
      WHERE h.id = notes.highlight_id
        AND p.user_id = auth.uid()
    )
  );

-- Update SELECT policy to show notes based on visibility
DROP POLICY IF EXISTS "Users can view notes on highlights in their school" ON notes;

CREATE POLICY "Users can view notes based on role and visibility"
  ON notes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM highlights h
      JOIN profiles p ON p.school_id = h.school_id
      WHERE h.id = notes.highlight_id
        AND p.user_id = auth.uid()
        AND (
          -- Teachers can see all notes on highlights they created
          (p.role = 'teacher' AND h.teacher_id IN (
            SELECT id FROM teachers WHERE user_id = p.user_id
          ))
          OR
          -- Students can see all notes on their own highlights
          (p.role = 'student' AND h.student_id IN (
            SELECT id FROM students WHERE user_id = p.user_id
          ))
          OR
          -- Parents can see notes marked visible_to_parent on their children's highlights
          (p.role = 'parent' AND notes.visible_to_parent = true AND h.student_id IN (
            SELECT ps.student_id FROM parent_students ps
            JOIN parents pr ON pr.id = ps.parent_id
            WHERE pr.user_id = p.user_id
          ))
          OR
          -- Admins/owners can see all notes in their school
          (p.role IN ('admin', 'owner'))
        )
    )
  );

-- Function to get full conversation thread for a highlight
CREATE OR REPLACE FUNCTION get_note_thread(p_highlight_id UUID)
RETURNS TABLE (
  id UUID,
  parent_note_id UUID,
  author_user_id UUID,
  author_name TEXT,
  author_role TEXT,
  type note_type,
  text TEXT,
  audio_url TEXT,
  visible_to_parent BOOLEAN,
  created_at TIMESTAMPTZ,
  reply_count BIGINT,
  depth INT
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE note_tree AS (
    -- Base case: top-level notes (no parent)
    SELECT
      n.id,
      n.parent_note_id,
      n.author_user_id,
      p.display_name as author_name,
      p.role::TEXT as author_role,
      n.type,
      n.text,
      n.audio_url,
      n.visible_to_parent,
      n.created_at,
      0::BIGINT as reply_count,
      0 as depth
    FROM notes n
    JOIN profiles p ON p.user_id = n.author_user_id
    WHERE n.highlight_id = p_highlight_id
      AND n.parent_note_id IS NULL

    UNION ALL

    -- Recursive case: replies to notes
    SELECT
      n.id,
      n.parent_note_id,
      n.author_user_id,
      p.display_name as author_name,
      p.role::TEXT as author_role,
      n.type,
      n.text,
      n.audio_url,
      n.visible_to_parent,
      n.created_at,
      0::BIGINT as reply_count,
      nt.depth + 1
    FROM notes n
    JOIN profiles p ON p.user_id = n.author_user_id
    JOIN note_tree nt ON nt.id = n.parent_note_id
    WHERE n.highlight_id = p_highlight_id
  ),
  reply_counts AS (
    SELECT n.parent_note_id, COUNT(*) as count
    FROM notes n
    WHERE n.highlight_id = p_highlight_id
      AND n.parent_note_id IS NOT NULL
    GROUP BY n.parent_note_id
  )
  SELECT
    nt.id,
    nt.parent_note_id,
    nt.author_user_id,
    nt.author_name,
    nt.author_role,
    nt.type,
    nt.text,
    nt.audio_url,
    nt.visible_to_parent,
    nt.created_at,
    COALESCE(rc.count, 0) as reply_count,
    nt.depth
  FROM note_tree nt
  LEFT JOIN reply_counts rc ON rc.parent_note_id = nt.id
  ORDER BY nt.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_note_thread(UUID) TO authenticated;

COMMENT ON FUNCTION get_note_thread(UUID) IS 'Retrieves the full conversation thread for a highlight, including nested replies with author information';
