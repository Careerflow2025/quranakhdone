-- Fix targets RLS policy to allow parents to see individual targets
-- Created: 2025-11-09
-- Issue: Parents can only see class-wide targets (via target_students junction table)
--        but cannot see individual targets (stored directly in targets table with student_id)

-- Drop existing policy
DROP POLICY IF EXISTS targets_select_involved ON targets;

-- Create improved policy that checks BOTH:
-- 1. Individual targets (targets.student_id matches parent's children)
-- 2. Class-wide targets (target_students junction table)
CREATE POLICY targets_select_involved ON targets
  FOR SELECT
  USING (
    -- Same school
    school_id = (SELECT school_id FROM current_user_context)
    AND (
      -- Teacher owns the target
      teacher_id = (SELECT teacher_id FROM current_user_context)
      OR
      -- Individual target: student_id directly matches parent's children
      student_id IN (
        SELECT ps.student_id
        FROM parent_students ps
        WHERE ps.parent_id = (SELECT parent_id FROM current_user_context)
      )
      OR
      -- Class-wide target: linked via target_students junction table
      EXISTS (
        SELECT 1
        FROM target_students ts
        WHERE ts.target_id = targets.id
        AND (
          -- Student owns the target
          ts.student_id = (SELECT student_id FROM current_user_context)
          OR
          -- Parent's child owns the target
          ts.student_id IN (
            SELECT ps.student_id
            FROM parent_students ps
            WHERE ps.parent_id = (SELECT parent_id FROM current_user_context)
          )
        )
      )
      OR
      -- Admin/Owner can see all
      (SELECT role FROM current_user_context) IN ('owner', 'admin')
    )
  );

-- Add comment explaining the policy
COMMENT ON POLICY targets_select_involved ON targets IS
  'Allow parents to see both individual targets (via targets.student_id) and class-wide targets (via target_students junction table) for their children';
