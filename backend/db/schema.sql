-- QuranAkh Database Schema
-- Production-ready schema for multi-tenant school management

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Schools table (multi-tenant)
CREATE TABLE IF NOT EXISTS schools (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    address TEXT,
    city TEXT,
    country TEXT,
    principal_name TEXT,
    subscription_type TEXT DEFAULT 'basic',
    valid_until DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User profiles table (extends auth)
CREATE TABLE IF NOT EXISTS profiles (
    user_id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    school_id TEXT REFERENCES schools(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'teacher', 'student', 'parent')),
    avatar_url TEXT,
    phone TEXT,
    active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT UNIQUE REFERENCES profiles(user_id) ON DELETE CASCADE,
    student_code TEXT UNIQUE,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female')),
    grade TEXT,
    class_id TEXT,
    parent_id TEXT,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    memorized_juz INTEGER DEFAULT 0,
    current_surah INTEGER,
    current_ayah INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Teachers table
CREATE TABLE IF NOT EXISTS teachers (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT UNIQUE REFERENCES profiles(user_id) ON DELETE CASCADE,
    employee_code TEXT UNIQUE,
    qualification TEXT,
    experience_years INTEGER,
    subjects TEXT, -- JSON array of subjects
    bio TEXT,
    join_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Parents table
CREATE TABLE IF NOT EXISTS parents (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT UNIQUE REFERENCES profiles(user_id) ON DELETE CASCADE,
    occupation TEXT,
    address TEXT,
    emergency_contact TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Parent-Student relationships
CREATE TABLE IF NOT EXISTS parent_students (
    parent_id TEXT REFERENCES parents(id) ON DELETE CASCADE,
    student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
    relationship TEXT DEFAULT 'parent', -- parent, guardian, etc.
    PRIMARY KEY (parent_id, student_id)
);

-- Classes table
CREATE TABLE IF NOT EXISTS classes (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    grade TEXT,
    room TEXT,
    capacity INTEGER DEFAULT 30,
    schedule TEXT, -- JSON schedule data
    subjects TEXT, -- JSON array of subjects
    academic_year TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Class enrollments
CREATE TABLE IF NOT EXISTS class_enrollments (
    class_id TEXT REFERENCES classes(id) ON DELETE CASCADE,
    student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    PRIMARY KEY (class_id, student_id)
);

-- Class teachers
CREATE TABLE IF NOT EXISTS class_teachers (
    class_id TEXT REFERENCES classes(id) ON DELETE CASCADE,
    teacher_id TEXT REFERENCES teachers(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT 0,
    PRIMARY KEY (class_id, teacher_id)
);

-- Assignments table
CREATE TABLE IF NOT EXISTS assignments (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    class_id TEXT REFERENCES classes(id) ON DELETE SET NULL,
    teacher_id TEXT REFERENCES teachers(id) ON DELETE SET NULL,
    student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT CHECK (type IN ('memorization', 'revision', 'tajweed', 'exercise')),
    surah_start INTEGER,
    ayah_start INTEGER,
    surah_end INTEGER,
    ayah_end INTEGER,
    due_date DATE,
    status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'submitted', 'graded', 'completed')),
    grade REAL,
    feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    class_id TEXT REFERENCES classes(id) ON DELETE CASCADE,
    student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT CHECK (status IN ('present', 'absent', 'late', 'excused')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, date)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    sender_id TEXT REFERENCES profiles(user_id) ON DELETE SET NULL,
    recipient_id TEXT REFERENCES profiles(user_id) ON DELETE SET NULL,
    subject TEXT,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT 0,
    is_archived BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    event_time TIME,
    event_type TEXT,
    location TEXT,
    created_by TEXT REFERENCES profiles(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Credentials table (for managing login access)
CREATE TABLE IF NOT EXISTS credentials (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT UNIQUE REFERENCES profiles(user_id) ON DELETE CASCADE,
    temp_password TEXT,
    must_change_password BOOLEAN DEFAULT 1,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Session/refresh tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT REFERENCES profiles(user_id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_school ON profiles(school_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_students_user ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_teachers_user ON teachers(user_id);
CREATE INDEX IF NOT EXISTS idx_parents_user ON parents(user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_school ON assignments(school_id);
CREATE INDEX IF NOT EXISTS idx_assignments_student ON assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance(student_id, date);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_events_school_date ON events(school_id, event_date);