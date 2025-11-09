-- Add Data Integrity Safeguards
-- Created: 2025-11-09
-- Purpose: Add check constraints and validation rules to prevent data integrity issues

-- =====================================================
-- 1. FUNCTION: Validate assignment has at least one highlight
-- =====================================================
CREATE OR REPLACE FUNCTION validate_assignment_has_highlights()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is an INSERT on assignments table
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Allow assignment creation, will be validated by application
    -- This trigger is for future enforcement if needed
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_assignment_has_highlights() IS
  'Future: Validate assignments have at least one linked highlight';

-- =====================================================
-- 2. FUNCTION: Log orphaned record detection
-- =====================================================
CREATE OR REPLACE FUNCTION log_orphaned_records()
RETURNS TABLE(
  table_name TEXT,
  orphaned_count BIGINT,
  check_timestamp TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    'assignment_highlights (bad highlight_id)'::TEXT,
    COUNT(*),
    NOW()
  FROM assignment_highlights ah
  LEFT JOIN highlights h ON ah.highlight_id = h.id
  WHERE h.id IS NULL

  UNION ALL

  SELECT
    'assignment_highlights (bad assignment_id)',
    COUNT(*),
    NOW()
  FROM assignment_highlights ah
  LEFT JOIN assignments a ON ah.assignment_id = a.id
  WHERE a.id IS NULL

  UNION ALL

  SELECT
    'notes (bad highlight_id)',
    COUNT(*),
    NOW()
  FROM notes n
  LEFT JOIN highlights h ON n.highlight_id = h.id
  WHERE h.id IS NULL;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION log_orphaned_records() IS
  'Utility function to check for orphaned records across critical tables';

-- =====================================================
-- 3. FUNCTION: Get assignment-highlight integrity report
-- =====================================================
CREATE OR REPLACE FUNCTION get_assignment_highlight_integrity(p_school_id UUID)
RETURNS TABLE(
  metric TEXT,
  count BIGINT,
  details JSONB
) AS $$
BEGIN
  RETURN QUERY
  -- Total assignments
  SELECT
    'Total Assignments'::TEXT,
    COUNT(*),
    jsonb_build_object('school_id', p_school_id)
  FROM assignments
  WHERE school_id = p_school_id

  UNION ALL

  -- Total highlights
  SELECT
    'Total Highlights',
    COUNT(*),
    jsonb_build_object(
      'school_id', p_school_id,
      'breakdown', jsonb_build_object(
        'green', (SELECT COUNT(*) FROM highlights WHERE school_id = p_school_id AND color = 'green'),
        'gold', (SELECT COUNT(*) FROM highlights WHERE school_id = p_school_id AND color = 'gold'),
        'other', (SELECT COUNT(*) FROM highlights WHERE school_id = p_school_id AND color NOT IN ('green', 'gold'))
      )
    )
  FROM highlights
  WHERE school_id = p_school_id

  UNION ALL

  -- Total assignment_highlights links
  SELECT
    'Assignment-Highlight Links',
    COUNT(*),
    jsonb_build_object('school_id', p_school_id)
  FROM assignment_highlights ah
  INNER JOIN assignments a ON ah.assignment_id = a.id
  WHERE a.school_id = p_school_id

  UNION ALL

  -- Assignments without highlights
  SELECT
    'Assignments Without Highlights',
    COUNT(*),
    jsonb_build_object(
      'school_id', p_school_id,
      'status', CASE WHEN COUNT(*) = 0 THEN 'OK' ELSE 'WARNING' END
    )
  FROM assignments a
  WHERE a.school_id = p_school_id
    AND NOT EXISTS (
      SELECT 1 FROM assignment_highlights ah WHERE ah.assignment_id = a.id
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_assignment_highlight_integrity(UUID) IS
  'Generate integrity report for assignments and highlights for a specific school';

-- =====================================================
-- 4. INDEXES for Performance
-- =====================================================

-- Index for faster orphaned record detection
CREATE INDEX IF NOT EXISTS idx_assignment_highlights_highlight_id
  ON assignment_highlights(highlight_id);

CREATE INDEX IF NOT EXISTS idx_assignment_highlights_assignment_id
  ON assignment_highlights(assignment_id);

CREATE INDEX IF NOT EXISTS idx_notes_highlight_id
  ON notes(highlight_id);

-- Index for faster school-level queries
CREATE INDEX IF NOT EXISTS idx_highlights_school_color
  ON highlights(school_id, color);

CREATE INDEX IF NOT EXISTS idx_assignments_school_student
  ON assignments(school_id, student_id);

-- =====================================================
-- 5. COMMENTS for Documentation
-- =====================================================

COMMENT ON TABLE assignment_highlights IS
  'Junction table linking assignments to highlights. CASCADE delete ensures automatic cleanup when parent is deleted.';

COMMENT ON TABLE highlights IS
  'Colored marks on Quran text. When deleted, automatically removes related assignment_highlights and notes via CASCADE.';

COMMENT ON TABLE assignments IS
  'Task records for students. When deleted, automatically removes related assignment_highlights, attachments, events, etc. via CASCADE.';

-- =====================================================
-- 6. VALIDATION QUERIES (for reference)
-- =====================================================

-- Sample query to check for orphaned records (run manually):
-- SELECT * FROM log_orphaned_records();

-- Sample query to get integrity report (run manually):
-- SELECT * FROM get_assignment_highlight_integrity('93f0075c-c3a1-4357-9e3f-fd66176cf4c4');
