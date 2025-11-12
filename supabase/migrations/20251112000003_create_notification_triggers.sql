-- =====================================================
-- NOTIFICATION TRIGGERS MIGRATION
-- =====================================================
-- Purpose: Automatically create notifications for key events
-- Created: 2025-11-12
-- =====================================================

-- =====================================================
-- 1. ASSIGNMENT TRIGGERS
-- =====================================================

-- Trigger: When a new assignment is created
CREATE OR REPLACE FUNCTION notify_assignment_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification for the student
  INSERT INTO public.notifications (
    user_id,
    school_id,
    section,
    type,
    title,
    message,
    metadata
  )
  VALUES (
    (SELECT user_id FROM public.students WHERE id = NEW.student_id),
    NEW.school_id,
    'assignments',
    'assignment_created',
    'New Assignment',
    'You have a new assignment: ' || NEW.title,
    jsonb_build_object(
      'assignment_id', NEW.id,
      'due_at', NEW.due_at,
      'created_by', NEW.created_by_teacher_id
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS assignment_created_trigger ON public.assignments;
CREATE TRIGGER assignment_created_trigger
  AFTER INSERT ON public.assignments
  FOR EACH ROW
  EXECUTE FUNCTION notify_assignment_created();

-- Trigger: When assignment status changes to 'reviewed' or 'completed'
CREATE OR REPLACE FUNCTION notify_assignment_reviewed()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify when status changes to reviewed or completed
  IF NEW.status IN ('reviewed', 'completed') AND OLD.status != NEW.status THEN
    -- Create notification for the student
    INSERT INTO public.notifications (
      user_id,
      school_id,
      section,
      type,
      title,
      message,
      metadata
    )
    VALUES (
      (SELECT user_id FROM public.students WHERE id = NEW.student_id),
      NEW.school_id,
      'assignments',
      'assignment_' || NEW.status,
      'Assignment ' || CASE WHEN NEW.status = 'reviewed' THEN 'Reviewed' ELSE 'Completed' END,
      'Your assignment "' || NEW.title || '" has been ' || NEW.status,
      jsonb_build_object(
        'assignment_id', NEW.id,
        'status', NEW.status,
        'reviewed_by', NEW.created_by_teacher_id
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS assignment_reviewed_trigger ON public.assignments;
CREATE TRIGGER assignment_reviewed_trigger
  AFTER UPDATE ON public.assignments
  FOR EACH ROW
  EXECUTE FUNCTION notify_assignment_reviewed();

-- =====================================================
-- 2. GRADE TRIGGERS
-- =====================================================

-- Trigger: When a new grade is posted
CREATE OR REPLACE FUNCTION notify_grade_posted()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification for the student
  INSERT INTO public.notifications (
    user_id,
    school_id,
    section,
    type,
    title,
    message,
    metadata
  )
  VALUES (
    (SELECT user_id FROM public.students WHERE id = NEW.student_id),
    (SELECT school_id FROM public.assignments WHERE id = NEW.assignment_id),
    'gradebook',
    'grade_posted',
    'New Grade Posted',
    'A new grade has been posted for your assignment',
    jsonb_build_object(
      'grade_id', NEW.id,
      'assignment_id', NEW.assignment_id,
      'score', NEW.score,
      'max_score', NEW.max_score
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS grade_posted_trigger ON public.grades;
CREATE TRIGGER grade_posted_trigger
  AFTER INSERT ON public.grades
  FOR EACH ROW
  EXECUTE FUNCTION notify_grade_posted();

-- =====================================================
-- 3. HIGHLIGHT TRIGGERS (Homework/Mistakes)
-- =====================================================

-- Trigger: When a teacher creates a highlight for a student
CREATE OR REPLACE FUNCTION notify_highlight_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification for the student
  INSERT INTO public.notifications (
    user_id,
    school_id,
    section,
    type,
    title,
    message,
    metadata
  )
  VALUES (
    (SELECT user_id FROM public.students WHERE id = NEW.student_id),
    NEW.school_id,
    CASE
      WHEN NEW.color = 'green' OR NEW.color = 'gold' THEN 'homework'
      ELSE 'highlights'
    END,
    'highlight_created',
    CASE
      WHEN NEW.color = 'green' THEN 'New Homework Assignment'
      WHEN NEW.color = 'gold' THEN 'Homework Completed'
      ELSE 'New Highlight Added'
    END,
    CASE
      WHEN NEW.color = 'green' THEN 'You have a new homework assignment to complete'
      WHEN NEW.color = 'gold' THEN 'Your homework has been marked as complete'
      ELSE 'A highlight has been added to your Quran reading'
    END,
    jsonb_build_object(
      'highlight_id', NEW.id,
      'color', NEW.color,
      'mistake_type', NEW.mistake,
      'created_by', NEW.teacher_id
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS highlight_created_trigger ON public.highlights;
CREATE TRIGGER highlight_created_trigger
  AFTER INSERT ON public.highlights
  FOR EACH ROW
  EXECUTE FUNCTION notify_highlight_created();

-- =====================================================
-- 4. ATTENDANCE TRIGGERS
-- =====================================================

-- Trigger: When attendance is marked as absent or late
CREATE OR REPLACE FUNCTION notify_attendance_marked()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify for absent or late status
  IF NEW.status IN ('absent', 'late') THEN
    -- Notify student
    INSERT INTO public.notifications (
      user_id,
      school_id,
      section,
      type,
      title,
      message,
      metadata
    )
    VALUES (
      (SELECT user_id FROM public.students WHERE id = NEW.student_id),
      (SELECT school_id FROM public.classes WHERE id = NEW.class_id),
      'attendance',
      'attendance_marked',
      'Attendance Marked: ' || UPPER(NEW.status),
      'You were marked ' || NEW.status || ' on ' || TO_CHAR(NEW.session_date, 'Mon DD, YYYY'),
      jsonb_build_object(
        'attendance_id', NEW.id,
        'class_id', NEW.class_id,
        'session_date', NEW.session_date,
        'status', NEW.status
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS attendance_marked_trigger ON public.attendance;
CREATE TRIGGER attendance_marked_trigger
  AFTER INSERT ON public.attendance
  FOR EACH ROW
  EXECUTE FUNCTION notify_attendance_marked();

-- =====================================================
-- 5. MASTERY TRIGGERS
-- =====================================================

-- Trigger: When student achieves mastery level on an ayah
CREATE OR REPLACE FUNCTION notify_mastery_updated()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify for positive mastery changes (proficient or mastered)
  IF NEW.level IN ('proficient', 'mastered') AND
     (OLD.level IS NULL OR OLD.level != NEW.level) THEN
    -- Notify student
    INSERT INTO public.notifications (
      user_id,
      school_id,
      section,
      type,
      title,
      message,
      metadata
    )
    VALUES (
      (SELECT user_id FROM public.students WHERE id = NEW.student_id),
      (SELECT school_id FROM public.students WHERE id = NEW.student_id),
      'mastery',
      'mastery_achieved',
      CASE
        WHEN NEW.level = 'mastered' THEN 'Mastery Achieved! 🎉'
        ELSE 'Proficiency Achieved! ⭐'
      END,
      'Congratulations! You have achieved ' || NEW.level || ' level on an ayah',
      jsonb_build_object(
        'mastery_id', NEW.id,
        'ayah_id', NEW.ayah_id,
        'level', NEW.level,
        'previous_level', OLD.level
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS mastery_updated_trigger ON public.ayah_mastery;
CREATE TRIGGER mastery_updated_trigger
  AFTER INSERT OR UPDATE ON public.ayah_mastery
  FOR EACH ROW
  EXECUTE FUNCTION notify_mastery_updated();

-- =====================================================
-- 6. TARGET TRIGGERS
-- =====================================================

-- Trigger: When a target is completed
CREATE OR REPLACE FUNCTION notify_target_completed()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify when status changes to completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Notify student
    INSERT INTO public.notifications (
      user_id,
      school_id,
      section,
      type,
      title,
      message,
      metadata
    )
    VALUES (
      (SELECT user_id FROM public.students WHERE id = NEW.student_id),
      (SELECT school_id FROM public.students WHERE id = NEW.student_id),
      'targets',
      'target_completed',
      'Target Completed! 🎯',
      'Congratulations! You have completed your target: ' || NEW.title,
      jsonb_build_object(
        'target_id', NEW.id,
        'title', NEW.title,
        'completed_at', NOW()
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if targets table exists before creating trigger
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'targets') THEN
    DROP TRIGGER IF EXISTS target_completed_trigger ON public.targets;
    CREATE TRIGGER target_completed_trigger
      AFTER UPDATE ON public.targets
      FOR EACH ROW
      EXECUTE FUNCTION notify_target_completed();
  END IF;
END $$;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Ensure we have indexes on foreign keys used in triggers
CREATE INDEX IF NOT EXISTS idx_assignments_student_id ON public.assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_assignments_school_id ON public.assignments(school_id);
CREATE INDEX IF NOT EXISTS idx_grades_student_id ON public.grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_assignment_id ON public.grades(assignment_id);
CREATE INDEX IF NOT EXISTS idx_highlights_student_id ON public.highlights(student_id);
CREATE INDEX IF NOT EXISTS idx_highlights_school_id ON public.highlights(school_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_class_id ON public.attendance(class_id);
CREATE INDEX IF NOT EXISTS idx_mastery_student_id ON public.ayah_mastery(student_id);

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant execute permissions on trigger functions to authenticated users
GRANT EXECUTE ON FUNCTION notify_assignment_created() TO authenticated;
GRANT EXECUTE ON FUNCTION notify_assignment_reviewed() TO authenticated;
GRANT EXECUTE ON FUNCTION notify_grade_posted() TO authenticated;
GRANT EXECUTE ON FUNCTION notify_highlight_created() TO authenticated;
GRANT EXECUTE ON FUNCTION notify_attendance_marked() TO authenticated;
GRANT EXECUTE ON FUNCTION notify_mastery_updated() TO authenticated;
GRANT EXECUTE ON FUNCTION notify_target_completed() TO authenticated;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON FUNCTION notify_assignment_created IS 'Automatically creates notification when new assignment is created';
COMMENT ON FUNCTION notify_assignment_reviewed IS 'Automatically creates notification when assignment is reviewed or completed';
COMMENT ON FUNCTION notify_grade_posted IS 'Automatically creates notification when new grade is posted';
COMMENT ON FUNCTION notify_highlight_created IS 'Automatically creates notification when teacher adds highlight for student';
COMMENT ON FUNCTION notify_attendance_marked IS 'Automatically creates notification when student is marked absent or late';
COMMENT ON FUNCTION notify_mastery_updated IS 'Automatically creates notification when student achieves proficiency or mastery';
COMMENT ON FUNCTION notify_target_completed IS 'Automatically creates notification when target is completed';
