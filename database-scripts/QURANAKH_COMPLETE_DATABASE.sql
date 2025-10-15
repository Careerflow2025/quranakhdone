-- =====================================================
-- QURANAKH COMPLETE DATABASE SCHEMA
-- =====================================================
-- Run this entire file in Supabase SQL Editor
-- It will create all tables, policies, functions, and triggers

-- Clean up if exists
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE user_role AS ENUM ('school', 'teacher', 'student', 'parent');
CREATE TYPE highlight_color AS ENUM ('green', 'purple', 'orange', 'red', 'brown', 'gold');
CREATE TYPE assignment_status AS ENUM ('pending', 'in-progress', 'submitted', 'reviewed', 'completed');
CREATE TYPE target_status AS ENUM ('active', 'completed', 'cancelled');
CREATE TYPE target_type AS ENUM ('individual', 'class', 'school');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'excused');
CREATE TYPE notification_type AS ENUM ('homework', 'assignment', 'target', 'message', 'milestone', 'completion');

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Schools table (multi-tenant root)
CREATE TABLE schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    logo_url TEXT,
    timezone VARCHAR(50) DEFAULT 'UTC',
    subscription_status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles (extends Supabase auth.users)
CREATE TABLE profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    display_name VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teachers
CREATE TABLE teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    subject VARCHAR(255),
    qualification TEXT,
    experience VARCHAR(100),
    bio TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Students
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    age INTEGER,
    grade VARCHAR(50),
    gender VARCHAR(20),
    date_of_birth DATE,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    active BOOLEAN DEFAULT true,
    memorized_juz INTEGER DEFAULT 0,
    revision_juz INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Parents
CREATE TABLE parents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    address TEXT,
    occupation VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Parent-Student relationships
CREATE TABLE parent_students (
    parent_id UUID REFERENCES parents(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    relationship VARCHAR(50) DEFAULT 'parent', -- parent, guardian, etc.
    PRIMARY KEY (parent_id, student_id)
);

-- Classes
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    grade VARCHAR(50),
    room VARCHAR(50),
    capacity INTEGER DEFAULT 25,
    schedule JSONB, -- {"days": ["Monday", "Wednesday"], "time": "9:00 AM"}
    created_by UUID REFERENCES teachers(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Class enrollments
CREATE TABLE class_enrollments (
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (class_id, student_id)
);

-- Class teachers
CREATE TABLE class_teachers (
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (class_id, teacher_id)
);

-- =====================================================
-- QURAN RELATED TABLES
-- =====================================================

-- Quran versions/scripts
CREATE TABLE quran_scripts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL, -- 'hafs', 'warsh', etc.
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT false
);

-- Insert default Quran versions
INSERT INTO quran_scripts (code, name, is_default) VALUES
    ('hafs', 'Hafs an Asim', true),
    ('warsh', 'Warsh an Nafi', false),
    ('qaloon', 'Qaloon an Nafi', false),
    ('al-duri', 'Al-Duri an Abu Amr', false),
    ('al-bazzi', 'Al-Bazzi', false),
    ('qunbul', 'Qunbul', false);

-- Student Quran version lock
CREATE TABLE student_script_locks (
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES teachers(id),
    script_id UUID REFERENCES quran_scripts(id),
    locked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (student_id)
);

-- Highlights (for homework and assignments)
CREATE TABLE highlights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE SET NULL,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    surah INTEGER NOT NULL,
    ayah_start INTEGER NOT NULL,
    ayah_end INTEGER NOT NULL,
    page_number INTEGER,
    color highlight_color NOT NULL,
    previous_color highlight_color, -- Store history when turned gold
    type VARCHAR(50), -- 'homework', 'tajweed', 'haraka', 'letter', 'review'
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    completed_by UUID REFERENCES teachers(id)
);

-- Notes on highlights (conversation threads)
CREATE TABLE highlight_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    highlight_id UUID NOT NULL REFERENCES highlights(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    author_role user_role NOT NULL,
    content TEXT,
    voice_url TEXT,
    voice_duration INTEGER, -- seconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    can_delete_until TIMESTAMP WITH TIME ZONE -- For 5-minute deletion window
);

-- =====================================================
-- TARGETS AND MILESTONES
-- =====================================================

-- Learning targets
CREATE TABLE targets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type target_type NOT NULL,
    category VARCHAR(50), -- 'memorization', 'tajweed', 'revision'
    status target_status DEFAULT 'active',
    start_date DATE,
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Target assignments (who the target is for)
CREATE TABLE target_assignments (
    target_id UUID REFERENCES targets(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK ((student_id IS NOT NULL AND class_id IS NULL) OR
           (student_id IS NULL AND class_id IS NOT NULL))
);

-- Target milestones
CREATE TABLE target_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    target_id UUID NOT NULL REFERENCES targets(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    order_index INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PRACTICE AND PROGRESS TRACKING
-- =====================================================

-- Practice sessions
CREATE TABLE practice_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    login_time TIMESTAMP WITH TIME ZONE NOT NULL,
    logout_time TIMESTAMP WITH TIME ZONE,
    total_duration_minutes INTEGER,
    active_duration_minutes INTEGER, -- Excluding idle time
    idle_periods INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Page views during practice
CREATE TABLE practice_page_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES practice_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    surah INTEGER NOT NULL,
    page_number INTEGER NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student progress (page-based)
CREATE TABLE student_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    target_id UUID REFERENCES targets(id) ON DELETE SET NULL,
    total_pages INTEGER NOT NULL,
    completed_pages INTEGER DEFAULT 0,
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, target_id)
);

-- =====================================================
-- ATTENDANCE
-- =====================================================

CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES teachers(id),
    date DATE NOT NULL,
    status attendance_status NOT NULL,
    notes TEXT,
    marked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(class_id, student_id, date)
);

-- =====================================================
-- MESSAGING SYSTEM
-- =====================================================

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    subject VARCHAR(255),
    content TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Message recipients
CREATE TABLE message_recipients (
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (message_id, recipient_id)
);

-- =====================================================
-- NOTIFICATIONS
-- =====================================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    data JSONB, -- Additional data for deep linking
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days') -- Auto-delete after 30 days
);

-- Notification preferences
CREATE TABLE notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES profiles(user_id) ON DELETE CASCADE,
    in_app BOOLEAN DEFAULT true,
    email BOOLEAN DEFAULT true,
    push BOOLEAN DEFAULT false,
    homework_notifications BOOLEAN DEFAULT true,
    assignment_notifications BOOLEAN DEFAULT true,
    message_notifications BOOLEAN DEFAULT true,
    milestone_notifications BOOLEAN DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CREDENTIALS MANAGEMENT
-- =====================================================

CREATE TABLE user_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    username VARCHAR(255) NOT NULL,
    temp_password VARCHAR(255), -- Store temporarily for email sending
    password_set BOOLEAN DEFAULT false,
    last_login TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES profiles(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(school_id, username)
);

-- =====================================================
-- CALENDAR EVENTS
-- =====================================================

CREATE TABLE calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES profiles(user_id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    location VARCHAR(255),
    type VARCHAR(50), -- 'school', 'class', 'meeting'
    attendees JSONB, -- List of user IDs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE highlight_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE target_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE target_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_script_locks ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's school_id
CREATE OR REPLACE FUNCTION get_user_school_id()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT school_id FROM profiles WHERE user_id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
BEGIN
    RETURN (SELECT role FROM profiles WHERE user_id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schools policies
CREATE POLICY "Schools visible to their members" ON schools
    FOR SELECT USING (id = get_user_school_id());

CREATE POLICY "Only school role can update school" ON schools
    FOR UPDATE USING (id = get_user_school_id() AND get_user_role() = 'school');

-- Profiles policies
CREATE POLICY "Profiles visible to same school" ON profiles
    FOR SELECT USING (school_id = get_user_school_id());

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "School can create profiles" ON profiles
    FOR INSERT WITH CHECK (get_user_role() = 'school' AND school_id = get_user_school_id());

-- Teachers policies
CREATE POLICY "Teachers visible to same school" ON teachers
    FOR SELECT USING (school_id = get_user_school_id());

CREATE POLICY "School can manage teachers" ON teachers
    FOR ALL USING (school_id = get_user_school_id() AND get_user_role() = 'school');

-- Students policies
CREATE POLICY "Students visible to same school" ON students
    FOR SELECT USING (school_id = get_user_school_id());

CREATE POLICY "School can manage students" ON students
    FOR ALL USING (school_id = get_user_school_id() AND get_user_role() = 'school');

-- Parents policies
CREATE POLICY "Parents visible to same school" ON parents
    FOR SELECT USING (school_id = get_user_school_id());

CREATE POLICY "School can manage parents" ON parents
    FOR ALL USING (school_id = get_user_school_id() AND get_user_role() = 'school');

-- Parent-student relationships
CREATE POLICY "Parent-student visible to school" ON parent_students
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM parents WHERE id = parent_id AND school_id = get_user_school_id())
    );

CREATE POLICY "Parents can view own children" ON parent_students
    FOR SELECT USING (
        parent_id IN (SELECT id FROM parents WHERE user_id = auth.uid())
    );

-- Highlights policies
CREATE POLICY "Highlights visible to school members" ON highlights
    FOR SELECT USING (school_id = get_user_school_id());

CREATE POLICY "Teachers can create highlights" ON highlights
    FOR INSERT WITH CHECK (
        get_user_role() = 'teacher' AND
        school_id = get_user_school_id()
    );

CREATE POLICY "Teachers can update own highlights" ON highlights
    FOR UPDATE USING (
        teacher_id IN (SELECT id FROM teachers WHERE user_id = auth.uid())
    );

-- Highlight notes policies
CREATE POLICY "Notes visible to participants" ON highlight_notes
    FOR SELECT USING (
        highlight_id IN (
            SELECT id FROM highlights
            WHERE school_id = get_user_school_id()
        )
    );

CREATE POLICY "Teachers and students can add notes" ON highlight_notes
    FOR INSERT WITH CHECK (
        get_user_role() IN ('teacher', 'student') AND
        author_id = auth.uid()
    );

-- Notifications policies
CREATE POLICY "Users see own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

-- =====================================================
-- TRIGGERS AND FUNCTIONS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON schools
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to mark highlight as complete (turn to gold)
CREATE OR REPLACE FUNCTION mark_highlight_complete(highlight_id UUID)
RETURNS VOID AS $$
DECLARE
    v_student_id UUID;
    v_school_id UUID;
BEGIN
    -- Update highlight to gold
    UPDATE highlights
    SET
        previous_color = color,
        color = 'gold',
        completed_at = NOW(),
        completed_by = (SELECT id FROM teachers WHERE user_id = auth.uid() LIMIT 1)
    WHERE id = highlight_id
    RETURNING student_id, school_id INTO v_student_id, v_school_id;

    -- Create notification for student
    INSERT INTO notifications (user_id, type, title, message, data)
    SELECT user_id, 'completion', 'Homework Completed!',
           'Your homework has been marked as complete',
           jsonb_build_object('highlight_id', highlight_id)
    FROM students WHERE id = v_student_id;

    -- Create notifications for parents
    INSERT INTO notifications (user_id, type, title, message, data)
    SELECT p.user_id, 'completion', 'Child''s Homework Completed',
           'Your child''s homework has been marked as complete',
           jsonb_build_object('highlight_id', highlight_id, 'student_id', v_student_id)
    FROM parents p
    JOIN parent_students ps ON p.id = ps.parent_id
    WHERE ps.student_id = v_student_id;

    -- Update progress if linked to target
    CALL update_student_progress(v_student_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate page-based progress
CREATE OR REPLACE FUNCTION calculate_page_progress(p_student_id UUID, p_target_id UUID)
RETURNS TABLE(completed_pages INT, total_pages INT, percentage DECIMAL) AS $$
DECLARE
    v_total_pages INT;
    v_completed_pages INT := 0;
    v_page INT;
BEGIN
    -- Get target total pages (this would come from target details)
    v_total_pages := 100; -- Example, should be from target

    -- Count pages where ALL highlights are gold
    FOR v_page IN 1..v_total_pages LOOP
        IF NOT EXISTS (
            SELECT 1 FROM highlights
            WHERE student_id = p_student_id
            AND page_number = v_page
            AND color != 'gold'
        ) AND EXISTS (
            SELECT 1 FROM highlights
            WHERE student_id = p_student_id
            AND page_number = v_page
        ) THEN
            v_completed_pages := v_completed_pages + 1;
        END IF;
    END LOOP;

    RETURN QUERY SELECT
        v_completed_pages,
        v_total_pages,
        CASE
            WHEN v_total_pages > 0 THEN (v_completed_pages::DECIMAL / v_total_pages * 100)
            ELSE 0
        END;
END;
$$ LANGUAGE plpgsql;

-- Auto-delete old notifications after 30 days
CREATE OR REPLACE FUNCTION delete_old_notifications()
RETURNS VOID AS $$
BEGIN
    DELETE FROM notifications
    WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Schedule notification cleanup (would need pg_cron extension or external scheduler)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('delete-old-notifications', '0 0 * * *', 'SELECT delete_old_notifications();');

-- =====================================================
-- STORAGE BUCKETS (Run in Supabase Dashboard)
-- =====================================================
-- Navigate to Storage in Supabase Dashboard and create these buckets:
-- 1. voice-notes (for teacher/student voice recordings)
-- 2. avatars (for profile pictures)
-- 3. school-logos (for school branding)
-- 4. attachments (for message attachments)

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- You can add initial test data here if needed

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_highlights_student ON highlights(student_id);
CREATE INDEX idx_highlights_teacher ON highlights(teacher_id);
CREATE INDEX idx_highlights_school ON highlights(school_id);
CREATE INDEX idx_highlights_color ON highlights(color);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_created ON notifications(created_at);
CREATE INDEX idx_practice_sessions_student ON practice_sessions(student_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_student ON attendance(student_id);

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- =====================================================
-- END OF SCHEMA
-- =====================================================
-- Your QuranAkh database is now ready!
-- Next step: Update the frontend to use these tables