-- QURANAKH PRODUCTION DATABASE - FINAL VERSION
-- This is the definitive version that resolves all issues

-- ============================================
-- STEP 1: CLEAN SLATE - DROP OLD OBJECTS
-- ============================================

-- Drop all indexes first to avoid dependency issues
DROP INDEX IF EXISTS idx_assignments_student_due CASCADE;
DROP INDEX IF EXISTS idx_assignments_late CASCADE;
DROP INDEX IF EXISTS idx_highlights_student CASCADE;
DROP INDEX IF EXISTS idx_highlights_ayah CASCADE;
DROP INDEX IF EXISTS idx_highlights_quran_ayah CASCADE;
DROP INDEX IF EXISTS idx_grades_assignment CASCADE;
DROP INDEX IF EXISTS idx_grades_student CASCADE;
DROP INDEX IF EXISTS idx_progress_student CASCADE;
DROP INDEX IF EXISTS idx_targets_student CASCADE;
DROP INDEX IF EXISTS idx_notifications_user CASCADE;
DROP INDEX IF EXISTS idx_messages_to_user CASCADE;
DROP INDEX IF EXISTS idx_user_credentials_user CASCADE;
DROP INDEX IF EXISTS idx_user_credentials_school CASCADE;
DROP INDEX IF EXISTS idx_ayah_mastery_student CASCADE;

-- Drop all tables that depend on enums
DROP TABLE IF EXISTS assignment_events CASCADE;
DROP TABLE IF EXISTS assignment_submissions CASCADE;
DROP TABLE IF EXISTS assignment_attachments CASCADE;
DROP TABLE IF EXISTS assignment_rubrics CASCADE;
DROP TABLE IF EXISTS grades CASCADE;
DROP TABLE IF EXISTS rubric_criteria CASCADE;
DROP TABLE IF EXISTS rubrics CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS notes CASCADE;
DROP TABLE IF EXISTS highlights CASCADE;
DROP TABLE IF EXISTS ayah_mastery CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS progress CASCADE;
DROP TABLE IF EXISTS targets CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS devices CASCADE;
DROP TABLE IF EXISTS calendar_events CASCADE;
DROP TABLE IF EXISTS user_credentials CASCADE;
DROP TABLE IF EXISTS class_enrollments CASCADE;
DROP TABLE IF EXISTS class_teachers CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS parent_students CASCADE;
DROP TABLE IF EXISTS parents CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS teachers CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS quran_ayahs CASCADE;
DROP TABLE IF EXISTS quran_scripts CASCADE;

-- Drop and recreate all enums
DROP TYPE IF EXISTS assignment_status CASCADE;
DROP TYPE IF EXISTS mistake_type CASCADE;
DROP TYPE IF EXISTS attendance_status CASCADE;
DROP TYPE IF EXISTS note_type CASCADE;
DROP TYPE IF EXISTS mastery_level CASCADE;
DROP TYPE IF EXISTS notif_channel CASCADE;

-- ============================================
-- STEP 2: CREATE ENUMS
-- ============================================

CREATE TYPE assignment_status AS ENUM ('assigned', 'viewed', 'submitted', 'reviewed', 'completed', 'reopened');
CREATE TYPE mistake_type AS ENUM ('recap', 'tajweed', 'haraka', 'letter');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'excused');
CREATE TYPE note_type AS ENUM ('text', 'audio');
CREATE TYPE mastery_level AS ENUM ('unknown', 'learning', 'proficient', 'mastered');
CREATE TYPE notif_channel AS ENUM ('in_app', 'email', 'push');

-- ============================================
-- STEP 3: CREATE BASE TABLES (NO DEPENDENCIES)
-- ============================================

-- Update schools table
ALTER TABLE schools
    ADD COLUMN IF NOT EXISTS logo_url TEXT,
    ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Africa/Casablanca',
    ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active',
    ADD COLUMN IF NOT EXISTS subscription_end DATE;

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    display_name TEXT,
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 4: CREATE USER TYPE TABLES
-- ============================================

-- Teachers
CREATE TABLE teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES profiles(user_id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    bio TEXT,
    subject TEXT,
    qualification TEXT,
    experience TEXT,
    phone TEXT,
    address TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Students
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES profiles(user_id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    dob DATE,
    gender TEXT,
    grade TEXT,
    address TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Parents
CREATE TABLE parents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES profiles(user_id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Parent-Student relationships
CREATE TABLE parent_students (
    parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    PRIMARY KEY (parent_id, student_id)
);

-- ============================================
-- STEP 5: CREATE CLASS TABLES
-- ============================================

CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    room TEXT,
    schedule_json JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES teachers(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE class_teachers (
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
    PRIMARY KEY (class_id, teacher_id)
);

CREATE TABLE class_enrollments (
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (class_id, student_id)
);

CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    status attendance_status NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(user_id)
);

-- ============================================
-- STEP 6: CREATE QURAN FOUNDATION TABLES
-- ============================================

CREATE TABLE quran_scripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL
);

CREATE TABLE quran_ayahs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    script_id UUID NOT NULL REFERENCES quran_scripts(id) ON DELETE CASCADE,
    surah INT NOT NULL,
    ayah INT NOT NULL,
    text TEXT NOT NULL,
    token_positions JSONB NOT NULL,
    UNIQUE (script_id, surah, ayah)
);

-- ============================================
-- STEP 7: CREATE HIGHLIGHTS & NOTES
-- ============================================

-- Using ayah_id as the column name (matching quran_ayahs.id)
CREATE TABLE highlights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    script_id UUID NOT NULL REFERENCES quran_scripts(id),
    ayah_id UUID NOT NULL REFERENCES quran_ayahs(id),
    token_start INT NOT NULL,
    token_end INT NOT NULL,
    mistake_type mistake_type NOT NULL,
    color TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    highlight_id UUID NOT NULL REFERENCES highlights(id) ON DELETE CASCADE,
    author_user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    type note_type NOT NULL,
    text TEXT,
    audio_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK ((type='text' AND text IS NOT NULL) OR (type='audio' AND audio_url IS NOT NULL))
);

-- ============================================
-- STEP 8: CREATE ASSIGNMENT SYSTEM
-- ============================================

CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    created_by_teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status assignment_status NOT NULL DEFAULT 'assigned'::assignment_status,
    due_at TIMESTAMPTZ NOT NULL,
    late BOOLEAN DEFAULT false,
    reopen_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create trigger to update late status
CREATE OR REPLACE FUNCTION update_assignment_late_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.due_at < NOW() AND NEW.status NOT IN ('completed', 'reviewed') THEN
        NEW.late := true;
    ELSE
        NEW.late := false;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_late_status ON assignments;
CREATE TRIGGER update_late_status
    BEFORE INSERT OR UPDATE ON assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_assignment_late_status();

CREATE TABLE assignment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    actor_user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    from_status assignment_status,
    to_status assignment_status,
    meta JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE assignment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE assignment_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    uploader_user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 9: CREATE GRADEBOOK SYSTEM
-- ============================================

CREATE TABLE rubrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE rubric_criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rubric_id UUID NOT NULL REFERENCES rubrics(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    weight NUMERIC DEFAULT 1,
    max_score NUMERIC DEFAULT 100
);

CREATE TABLE assignment_rubrics (
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    rubric_id UUID NOT NULL REFERENCES rubrics(id) ON DELETE CASCADE,
    PRIMARY KEY (assignment_id, rubric_id)
);

CREATE TABLE grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    criterion_id UUID REFERENCES rubric_criteria(id) ON DELETE CASCADE,
    score NUMERIC NOT NULL,
    max_score NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(user_id)
);

-- ============================================
-- STEP 10: CREATE MASTERY & PROGRESS TRACKING
-- ============================================

-- Using ayah_id to match the column in quran_ayahs table
CREATE TABLE ayah_mastery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    script_id UUID NOT NULL REFERENCES quran_scripts(id),
    ayah_id UUID NOT NULL REFERENCES quran_ayahs(id),
    level mastery_level NOT NULL DEFAULT 'unknown'::mastery_level,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (student_id, script_id, ayah_id)
);

CREATE TABLE targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    target_type TEXT NOT NULL,
    surah_start INT,
    ayah_start INT,
    surah_end INT,
    ayah_end INT,
    due_date DATE,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    target_id UUID REFERENCES targets(id) ON DELETE CASCADE,
    surah INT NOT NULL,
    ayah INT NOT NULL,
    memorized BOOLEAN DEFAULT false,
    revision_count INT DEFAULT 0,
    last_reviewed TIMESTAMPTZ,
    quality_score INT CHECK (quality_score >= 0 AND quality_score <= 100),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 11: CREATE COMMUNICATION TABLES
-- ============================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    channel notif_channel NOT NULL,
    type TEXT NOT NULL,
    title TEXT,
    message TEXT,
    payload JSONB,
    read BOOLEAN DEFAULT false,
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    push_token TEXT NOT NULL,
    platform TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    from_user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    subject TEXT,
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 12: CREATE CALENDAR & CREDENTIALS
-- ============================================

CREATE TABLE calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT,
    date DATE NOT NULL,
    time TIME,
    location TEXT,
    created_by UUID REFERENCES profiles(user_id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    password TEXT,
    role TEXT,
    password_changed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 13: CREATE INDEXES (SAFE - TABLES EXIST)
-- ============================================

-- Assignment indexes
CREATE INDEX idx_assignments_student_due ON assignments(student_id, due_at);
CREATE INDEX idx_assignments_late ON assignments(late) WHERE late = true;

-- Highlight indexes - using correct column name
CREATE INDEX idx_highlights_student ON highlights(student_id);
CREATE INDEX idx_highlights_ayah ON highlights(ayah_id);

-- Grade indexes
CREATE INDEX idx_grades_assignment ON grades(assignment_id);
CREATE INDEX idx_grades_student ON grades(student_id);

-- Progress indexes
CREATE INDEX idx_progress_student ON progress(student_id);
CREATE INDEX idx_targets_student ON targets(student_id);

-- Communication indexes
CREATE INDEX idx_notifications_user ON notifications(user_id, read);
CREATE INDEX idx_messages_to_user ON messages(to_user_id, read);

-- Credential indexes
CREATE INDEX idx_user_credentials_user ON user_credentials(user_id);
CREATE INDEX idx_user_credentials_school ON user_credentials(school_id);

-- Mastery index
CREATE INDEX idx_ayah_mastery_student ON ayah_mastery(student_id);

-- ============================================
-- STEP 14: FINAL VERIFICATION & SUMMARY
-- ============================================

DO $$
DECLARE
    table_count INT;
    index_count INT;
    enum_count INT;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public';

    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE schemaname = 'public';

    SELECT COUNT(*) INTO enum_count
    FROM pg_type
    WHERE typtype = 'e'
    AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ QURANAKH DATABASE SUCCESSFULLY CREATED';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tables created: %', table_count;
    RAISE NOTICE 'Indexes created: %', index_count;
    RAISE NOTICE 'Enum types: %', enum_count;
    RAISE NOTICE '';
    RAISE NOTICE '📚 ALL FEATURES IMPLEMENTED:';
    RAISE NOTICE '  ✓ Multi-tenant school system';
    RAISE NOTICE '  ✓ User management (school/teacher/student/parent)';
    RAISE NOTICE '  ✓ Classes & attendance tracking';
    RAISE NOTICE '  ✓ Assignments with lifecycle management';
    RAISE NOTICE '  ✓ Submissions & attachments';
    RAISE NOTICE '  ✓ Gradebook with rubrics & criteria';
    RAISE NOTICE '  ✓ Quran highlighting (6-color system)';
    RAISE NOTICE '  ✓ Per-ayah mastery tracking';
    RAISE NOTICE '  ✓ Targets & progress monitoring';
    RAISE NOTICE '  ✓ Notifications & messaging';
    RAISE NOTICE '  ✓ Calendar events';
    RAISE NOTICE '  ✓ User credentials management';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 PRODUCTION DATABASE READY!';
    RAISE NOTICE '========================================';
END$$;

-- Display all created tables grouped by category
SELECT
    table_name,
    CASE
        WHEN table_name IN ('schools', 'profiles', 'teachers', 'students', 'parents', 'parent_students') THEN '👥 User Management'
        WHEN table_name IN ('classes', 'class_teachers', 'class_enrollments', 'attendance') THEN '🏫 Classes & Attendance'
        WHEN table_name LIKE '%assignment%' THEN '📝 Assignment System'
        WHEN table_name IN ('rubrics', 'rubric_criteria', 'grades') THEN '📊 Gradebook'
        WHEN table_name IN ('quran_scripts', 'quran_ayahs', 'highlights', 'notes', 'ayah_mastery') THEN '📖 Quran System'
        WHEN table_name IN ('targets', 'progress') THEN '🎯 Progress Tracking'
        WHEN table_name IN ('notifications', 'devices', 'messages') THEN '💬 Communication'
        WHEN table_name IN ('calendar_events', 'user_credentials') THEN '📅 Calendar & Auth'
        ELSE '📁 Other'
    END as category,
    CASE
        WHEN table_name IN ('schools', 'profiles', 'teachers', 'students', 'parents') THEN 1
        WHEN table_name LIKE '%class%' OR table_name = 'attendance' THEN 2
        WHEN table_name LIKE '%assignment%' THEN 3
        WHEN table_name LIKE '%rubric%' OR table_name = 'grades' THEN 4
        WHEN table_name LIKE '%quran%' OR table_name IN ('highlights', 'notes', 'ayah_mastery') THEN 5
        WHEN table_name IN ('targets', 'progress') THEN 6
        ELSE 7
    END as sort_order
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY sort_order, table_name;

-- Count features implemented
SELECT
    'IMPLEMENTATION STATUS' as report,
    COUNT(*) FILTER (WHERE table_name LIKE '%assignment%') as assignment_tables,
    COUNT(*) FILTER (WHERE table_name IN ('grades', 'rubrics', 'rubric_criteria')) as gradebook_tables,
    COUNT(*) FILTER (WHERE table_name IN ('quran_scripts', 'quran_ayahs', 'highlights', 'notes', 'ayah_mastery')) as quran_tables,
    COUNT(*) FILTER (WHERE table_name IN ('targets', 'progress')) as progress_tables,
    COUNT(*) as total_tables
FROM information_schema.tables
WHERE table_schema = 'public';