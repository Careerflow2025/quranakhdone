-- =====================================================
-- QURANAKH ROW LEVEL SECURITY (RLS) POLICIES
-- Multi-tenant data isolation
-- Created: October 16, 2025
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE quran_ayahs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mushaf_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pen_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE target_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE target_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ayah_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE rubrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE rubric_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_rubrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_settings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HELPER VIEW: Current User Context
-- =====================================================

CREATE OR REPLACE VIEW current_user_context AS
SELECT
    p.user_id,
    p.school_id,
    p.role,
    t.id as teacher_id,
    s.id as student_id,
    par.id as parent_id
FROM profiles p
LEFT JOIN teachers t ON t.user_id = p.user_id
LEFT JOIN students s ON s.user_id = p.user_id
LEFT JOIN parents par ON par.user_id = p.user_id
WHERE p.user_id = auth.uid();

-- =====================================================
-- QURAN DATA (Public Read Access)
-- =====================================================

-- Quran scripts - Public read
CREATE POLICY "quran_scripts_public_read" ON quran_scripts FOR SELECT USING (true);

-- Quran ayahs - Public read
CREATE POLICY "quran_ayahs_public_read" ON quran_ayahs FOR SELECT USING (true);

-- Mushaf pages - Public read
CREATE POLICY "mushaf_pages_public_read" ON mushaf_pages FOR SELECT USING (true);

-- =====================================================
-- SCHOOLS (Multi-tenant Root)
-- =====================================================

-- Schools - Users can only see their own school
CREATE POLICY "schools_select_own" ON schools FOR SELECT
USING (id = (SELECT school_id FROM current_user_context));

-- Schools - Only service role can insert/update/delete
CREATE POLICY "schools_service_role_only" ON schools FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- PROFILES
-- =====================================================

-- Profiles - Read own school's profiles
CREATE POLICY "profiles_select_own_school" ON profiles FOR SELECT
USING (school_id = (SELECT school_id FROM current_user_context));

-- Profiles - Service role can manage
CREATE POLICY "profiles_service_role" ON profiles FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- TEACHERS
-- =====================================================

CREATE POLICY "teachers_select_own_school" ON teachers FOR SELECT
USING (school_id = (SELECT school_id FROM current_user_context));

CREATE POLICY "teachers_insert_owner_admin" ON teachers FOR INSERT
WITH CHECK (
    school_id = (SELECT school_id FROM current_user_context) AND
    (SELECT role FROM current_user_context) IN ('owner', 'admin')
);

CREATE POLICY "teachers_update_owner_admin" ON teachers FOR UPDATE
USING (
    school_id = (SELECT school_id FROM current_user_context) AND
    (SELECT role FROM current_user_context) IN ('owner', 'admin')
);

CREATE POLICY "teachers_delete_owner_admin" ON teachers FOR DELETE
USING (
    school_id = (SELECT school_id FROM current_user_context) AND
    (SELECT role FROM current_user_context) IN ('owner', 'admin')
);

-- =====================================================
-- STUDENTS
-- =====================================================

CREATE POLICY "students_select_own_school" ON students FOR SELECT
USING (school_id = (SELECT school_id FROM current_user_context));

CREATE POLICY "students_insert_owner_admin" ON students FOR INSERT
WITH CHECK (
    school_id = (SELECT school_id FROM current_user_context) AND
    (SELECT role FROM current_user_context) IN ('owner', 'admin')
);

CREATE POLICY "students_update_owner_admin" ON students FOR UPDATE
USING (
    school_id = (SELECT school_id FROM current_user_context) AND
    (SELECT role FROM current_user_context) IN ('owner', 'admin')
);

CREATE POLICY "students_delete_owner_admin" ON students FOR DELETE
USING (
    school_id = (SELECT school_id FROM current_user_context) AND
    (SELECT role FROM current_user_context) IN ('owner', 'admin')
);

-- =====================================================
-- PARENTS
-- =====================================================

CREATE POLICY "parents_select_own_school" ON parents FOR SELECT
USING (school_id = (SELECT school_id FROM current_user_context));

CREATE POLICY "parents_insert_owner_admin" ON parents FOR INSERT
WITH CHECK (
    school_id = (SELECT school_id FROM current_user_context) AND
    (SELECT role FROM current_user_context) IN ('owner', 'admin')
);

-- =====================================================
-- PARENT-STUDENTS
-- =====================================================

CREATE POLICY "parent_students_select_involved" ON parent_students FOR SELECT
USING (
    parent_id IN (SELECT parent_id FROM current_user_context) OR
    (SELECT role FROM current_user_context) IN ('owner', 'admin', 'teacher')
);

CREATE POLICY "parent_students_manage_owner_admin" ON parent_students FOR ALL
USING (
    (SELECT role FROM current_user_context) IN ('owner', 'admin')
);

-- =====================================================
-- CLASSES
-- =====================================================

CREATE POLICY "classes_select_own_school" ON classes FOR SELECT
USING (school_id = (SELECT school_id FROM current_user_context));

CREATE POLICY "classes_manage_owner_admin" ON classes FOR INSERT
WITH CHECK (
    school_id = (SELECT school_id FROM current_user_context) AND
    (SELECT role FROM current_user_context) IN ('owner', 'admin')
);

CREATE POLICY "classes_update_owner_admin" ON classes FOR UPDATE
USING (
    school_id = (SELECT school_id FROM current_user_context) AND
    (SELECT role FROM current_user_context) IN ('owner', 'admin')
);

-- =====================================================
-- CLASS TEACHERS
-- =====================================================

CREATE POLICY "class_teachers_select_own_school" ON class_teachers FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM classes c
        WHERE c.id = class_teachers.class_id
        AND c.school_id = (SELECT school_id FROM current_user_context)
    )
);

CREATE POLICY "class_teachers_manage_owner_admin" ON class_teachers FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM classes c
        WHERE c.id = class_teachers.class_id
        AND c.school_id = (SELECT school_id FROM current_user_context)
        AND (SELECT role FROM current_user_context) IN ('owner', 'admin')
    )
);

-- =====================================================
-- CLASS ENROLLMENTS
-- =====================================================

CREATE POLICY "class_enrollments_select_relevant" ON class_enrollments FOR SELECT
USING (
    -- Own student record
    student_id = (SELECT student_id FROM current_user_context) OR
    -- Parent of student
    student_id IN (
        SELECT ps.student_id FROM parent_students ps
        WHERE ps.parent_id = (SELECT parent_id FROM current_user_context)
    ) OR
    -- Teacher of class
    class_id IN (
        SELECT ct.class_id FROM class_teachers ct
        WHERE ct.teacher_id = (SELECT teacher_id FROM current_user_context)
    ) OR
    -- School admin
    (SELECT role FROM current_user_context) IN ('owner', 'admin')
);

CREATE POLICY "class_enrollments_manage_owner_admin" ON class_enrollments FOR ALL
USING (
    (SELECT role FROM current_user_context) IN ('owner', 'admin')
);

-- =====================================================
-- ATTENDANCE
-- =====================================================

CREATE POLICY "attendance_select_relevant" ON attendance FOR SELECT
USING (
    -- Own student record
    student_id = (SELECT student_id FROM current_user_context) OR
    -- Parent of student
    student_id IN (
        SELECT ps.student_id FROM parent_students ps
        WHERE ps.parent_id = (SELECT parent_id FROM current_user_context)
    ) OR
    -- Teacher of class
    class_id IN (
        SELECT ct.class_id FROM class_teachers ct
        WHERE ct.teacher_id = (SELECT teacher_id FROM current_user_context)
    ) OR
    -- School admin
    (SELECT role FROM current_user_context) IN ('owner', 'admin')
);

CREATE POLICY "attendance_manage_teachers" ON attendance FOR INSERT
WITH CHECK (
    class_id IN (
        SELECT ct.class_id FROM class_teachers ct
        WHERE ct.teacher_id = (SELECT teacher_id FROM current_user_context)
    )
);

CREATE POLICY "attendance_update_teachers" ON attendance FOR UPDATE
USING (
    class_id IN (
        SELECT ct.class_id FROM class_teachers ct
        WHERE ct.teacher_id = (SELECT teacher_id FROM current_user_context)
    )
);

-- =====================================================
-- HIGHLIGHTS
-- =====================================================

CREATE POLICY "highlights_select_involved" ON highlights FOR SELECT
USING (
    school_id = (SELECT school_id FROM current_user_context) AND (
        -- Own student highlights
        student_id = (SELECT student_id FROM current_user_context) OR
        -- Created by current teacher
        teacher_id = (SELECT teacher_id FROM current_user_context) OR
        -- Parent viewing child's highlights
        student_id IN (
            SELECT ps.student_id FROM parent_students ps
            WHERE ps.parent_id = (SELECT parent_id FROM current_user_context)
        ) OR
        -- School admin
        (SELECT role FROM current_user_context) IN ('owner', 'admin')
    )
);

CREATE POLICY "highlights_insert_teachers" ON highlights FOR INSERT
WITH CHECK (
    school_id = (SELECT school_id FROM current_user_context) AND
    teacher_id = (SELECT teacher_id FROM current_user_context)
);

CREATE POLICY "highlights_update_teachers" ON highlights FOR UPDATE
USING (
    school_id = (SELECT school_id FROM current_user_context) AND
    teacher_id = (SELECT teacher_id FROM current_user_context)
);

CREATE POLICY "highlights_delete_teachers" ON highlights FOR DELETE
USING (
    school_id = (SELECT school_id FROM current_user_context) AND
    teacher_id = (SELECT teacher_id FROM current_user_context)
);

-- =====================================================
-- NOTES
-- =====================================================

CREATE POLICY "notes_select_involved" ON notes FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM highlights h
        WHERE h.id = notes.highlight_id
        AND h.school_id = (SELECT school_id FROM current_user_context)
        AND (
            h.student_id = (SELECT student_id FROM current_user_context) OR
            h.teacher_id = (SELECT teacher_id FROM current_user_context) OR
            h.student_id IN (
                SELECT ps.student_id FROM parent_students ps
                WHERE ps.parent_id = (SELECT parent_id FROM current_user_context)
            ) OR
            (SELECT role FROM current_user_context) IN ('owner', 'admin')
        )
    )
);

CREATE POLICY "notes_insert_teacher_student" ON notes FOR INSERT
WITH CHECK (
    (SELECT role FROM current_user_context) IN ('teacher', 'student') AND
    author_user_id = auth.uid()
);

-- =====================================================
-- ASSIGNMENTS
-- =====================================================

CREATE POLICY "assignments_select_involved" ON assignments FOR SELECT
USING (
    school_id = (SELECT school_id FROM current_user_context) AND (
        -- Own student assignments
        student_id = (SELECT student_id FROM current_user_context) OR
        -- Created by current teacher
        created_by_teacher_id = (SELECT teacher_id FROM current_user_context) OR
        -- Parent viewing child's assignments
        student_id IN (
            SELECT ps.student_id FROM parent_students ps
            WHERE ps.parent_id = (SELECT parent_id FROM current_user_context)
        ) OR
        -- School admin
        (SELECT role FROM current_user_context) IN ('owner', 'admin')
    )
);

CREATE POLICY "assignments_insert_teachers" ON assignments FOR INSERT
WITH CHECK (
    school_id = (SELECT school_id FROM current_user_context) AND
    created_by_teacher_id = (SELECT teacher_id FROM current_user_context)
);

CREATE POLICY "assignments_update_teachers_admins" ON assignments FOR UPDATE
USING (
    school_id = (SELECT school_id FROM current_user_context) AND (
        created_by_teacher_id = (SELECT teacher_id FROM current_user_context) OR
        (SELECT role FROM current_user_context) IN ('owner', 'admin')
    )
);

-- =====================================================
-- HOMEWORK
-- =====================================================

CREATE POLICY "homework_select_involved" ON homework FOR SELECT
USING (
    school_id = (SELECT school_id FROM current_user_context) AND (
        student_id = (SELECT student_id FROM current_user_context) OR
        teacher_id = (SELECT teacher_id FROM current_user_context) OR
        student_id IN (
            SELECT ps.student_id FROM parent_students ps
            WHERE ps.parent_id = (SELECT parent_id FROM current_user_context)
        ) OR
        (SELECT role FROM current_user_context) IN ('owner', 'admin')
    )
);

CREATE POLICY "homework_manage_teachers" ON homework FOR ALL
USING (
    school_id = (SELECT school_id FROM current_user_context) AND
    teacher_id = (SELECT teacher_id FROM current_user_context)
);

-- =====================================================
-- TARGETS
-- =====================================================

CREATE POLICY "targets_select_involved" ON targets FOR SELECT
USING (
    school_id = (SELECT school_id FROM current_user_context) AND (
        teacher_id = (SELECT teacher_id FROM current_user_context) OR
        EXISTS (
            SELECT 1 FROM target_students ts
            WHERE ts.target_id = targets.id
            AND (
                ts.student_id = (SELECT student_id FROM current_user_context) OR
                ts.student_id IN (
                    SELECT ps.student_id FROM parent_students ps
                    WHERE ps.parent_id = (SELECT parent_id FROM current_user_context)
                )
            )
        ) OR
        (SELECT role FROM current_user_context) IN ('owner', 'admin')
    )
);

CREATE POLICY "targets_manage_teachers" ON targets FOR ALL
USING (
    school_id = (SELECT school_id FROM current_user_context) AND
    teacher_id = (SELECT teacher_id FROM current_user_context)
);

-- =====================================================
-- MESSAGES
-- =====================================================

CREATE POLICY "messages_select_involved" ON messages FOR SELECT
USING (
    school_id = (SELECT school_id FROM current_user_context) AND (
        from_user_id = auth.uid() OR
        to_user_id = auth.uid() OR
        (SELECT role FROM current_user_context) IN ('owner', 'admin')
    )
);

CREATE POLICY "messages_insert_authenticated" ON messages FOR INSERT
WITH CHECK (
    school_id = (SELECT school_id FROM current_user_context) AND
    from_user_id = auth.uid()
);

-- =====================================================
-- NOTIFICATIONS
-- =====================================================

CREATE POLICY "notifications_select_own" ON notifications FOR SELECT
USING (
    user_id = auth.uid() OR
    (SELECT role FROM current_user_context) IN ('owner', 'admin')
);

CREATE POLICY "notifications_manage_system" ON notifications FOR INSERT
WITH CHECK (
    school_id = (SELECT school_id FROM current_user_context)
);

-- =====================================================
-- PRACTICE LOGS
-- =====================================================

CREATE POLICY "practice_logs_select_involved" ON practice_logs FOR SELECT
USING (
    student_id = (SELECT student_id FROM current_user_context) OR
    student_id IN (
        SELECT ps.student_id FROM parent_students ps
        WHERE ps.parent_id = (SELECT parent_id FROM current_user_context)
    ) OR
    student_id IN (
        SELECT ce.student_id FROM class_enrollments ce
        JOIN class_teachers ct ON ct.class_id = ce.class_id
        WHERE ct.teacher_id = (SELECT teacher_id FROM current_user_context)
    ) OR
    (SELECT role FROM current_user_context) IN ('owner', 'admin')
);

CREATE POLICY "practice_logs_insert_students" ON practice_logs FOR INSERT
WITH CHECK (
    student_id = (SELECT student_id FROM current_user_context)
);

-- =====================================================
-- CALENDAR EVENTS
-- =====================================================

CREATE POLICY "calendar_events_select_own_school" ON calendar_events FOR SELECT
USING (school_id = (SELECT school_id FROM current_user_context));

CREATE POLICY "calendar_events_manage_owner_admin" ON calendar_events FOR ALL
USING (
    school_id = (SELECT school_id FROM current_user_context) AND
    (SELECT role FROM current_user_context) IN ('owner', 'admin')
);

-- =====================================================
-- SCHOOL SETTINGS
-- =====================================================

CREATE POLICY "school_settings_select_own" ON school_settings FOR SELECT
USING (school_id = (SELECT school_id FROM current_user_context));

CREATE POLICY "school_settings_manage_owner_admin" ON school_settings FOR ALL
USING (
    school_id = (SELECT school_id FROM current_user_context) AND
    (SELECT role FROM current_user_context) IN ('owner', 'admin')
);

COMMIT;
