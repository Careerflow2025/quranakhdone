# 🧠 QuranAkh Project Memory & Database Roadmap
*Last Updated: January 2025*

## 📌 PROJECT CORE UNDERSTANDING

### System Type
**Private School Quran Management System** - NOT a public platform
- Closed ecosystem controlled entirely by school administration
- No self-registration - all accounts created by school
- Multi-tenant architecture (multiple schools, isolated data)

### The Fundamental Concept
The Quran text is **universal** but the **learning overlay is individual**:
- Same Quran for everyone
- Different highlights/homework per student
- Like transparent sheets over the same book
- Each student sees only their own marks

## 🏗️ SYSTEM HIERARCHY & CONTROL FLOW

```
SCHOOL ADMIN (Super Admin)
    ├── Creates & Manages Teachers
    │   └── Teachers Create Homework/Assignments
    │       └── Auto-appears in Student Dashboard
    │           └── Auto-appears in Parent Dashboard
    ├── Creates & Manages Students
    │   └── Each has unique Quran viewer
    └── Creates & Manages Parents
        └── Links them to their children
```

## 👥 USER ROLES & PERMISSIONS

### 1. School Admin
- **Creates**: All user accounts (teachers, students, parents)
- **Manages**: Classes, schedules, enrollments
- **Views**: Everything in the school
- **Controls**: All credentials and access

### 2. Teachers
- **Creates**: Homework (green highlights), assignments, notes
- **Manages**: Their assigned students only
- **Views**: Their classes and students
- **Cannot**: See other teachers' students

### 3. Students
- **Views**: Their own Quran with personal highlights
- **Submits**: Homework responses
- **Cannot**: See other students' work
- **Unique**: Each has individual Quran overlay

### 4. Parents
- **Views**: Their children's work (read-only)
- **Receives**: Notifications about homework
- **Cannot**: Modify anything
- **Multiple Children**: Can have multiple linked children

## 🎨 HIGHLIGHT COLOR SYSTEM

```javascript
const HIGHLIGHT_COLORS = {
  homework: 'green',      // Assigned work
  recap: 'purple',        // Review needed
  tajweed: 'orange',      // Tajweed mistakes
  haraka: 'red',          // Vowel mistakes
  letter: 'brown'         // Letter mistakes
}
```

## 📊 DATABASE SCHEMA BLUEPRINT

### Core Tables (Order of Creation)

```sql
-- 1. SCHOOLS (Master Tenant)
schools
├── id (UUID, PK)
├── name
├── subdomain (unique)
├── timezone
├── settings (JSON)
└── created_at

-- 2. USERS (Authentication)
users
├── id (UUID, PK)
├── email (unique)
├── password_hash
├── created_by_school_id (FK → schools)
└── created_at

-- 3. PROFILES (User Details)
profiles
├── user_id (FK → users, PK)
├── school_id (FK → schools)
├── role (ENUM: school_admin, teacher, student, parent)
├── full_name
├── phone
├── avatar_url
└── metadata (JSON)

-- 4. CLASSES
classes
├── id (UUID, PK)
├── school_id (FK → schools)
├── name
├── room
├── subject
├── schedule_type (regular, custom, flexible)
├── schedule_data (JSON)
├── capacity
└── created_by (FK → users)

-- 5. ENROLLMENTS (Student ↔ Class)
enrollments
├── id (UUID, PK)
├── class_id (FK → classes)
├── student_id (FK → users)
├── enrolled_date
└── status (active, dropped, completed)

-- 6. CLASS_TEACHERS (Teacher ↔ Class)
class_teachers
├── class_id (FK → classes)
├── teacher_id (FK → users)
└── PRIMARY KEY (class_id, teacher_id)

-- 7. PARENT_CHILDREN (Parent ↔ Student)
parent_children
├── parent_id (FK → users)
├── student_id (FK → users)
├── relationship (father, mother, guardian)
└── PRIMARY KEY (parent_id, student_id)

-- 8. QURAN_HIGHLIGHTS (Core Feature)
quran_highlights
├── id (UUID, PK)
├── school_id (FK → schools)
├── student_id (FK → users)
├── teacher_id (FK → users)
├── surah_number
├── ayah_start
├── ayah_end
├── highlight_type (homework, recap, tajweed, haraka, letter)
├── color
├── note
├── due_date (for homework)
├── status (pending, completed, reviewed)
├── created_at
└── INDEX on (student_id, surah_number)

-- 9. ASSIGNMENTS
assignments
├── id (UUID, PK)
├── school_id (FK → schools)
├── highlight_id (FK → quran_highlights, nullable)
├── teacher_id (FK → users)
├── student_id (FK → users)
├── title
├── description
├── type (memorization, revision, test)
├── status (assigned, viewed, submitted, reviewed, completed)
├── due_date
├── submitted_at
├── reviewed_at
└── grade

-- 10. ATTENDANCE
attendance
├── id (UUID, PK)
├── school_id (FK → schools)
├── class_id (FK → classes)
├── student_id (FK → users)
├── date
├── status (present, absent, late, excused)
├── notes
└── marked_by (FK → users)

-- 11. MESSAGES
messages
├── id (UUID, PK)
├── school_id (FK → schools)
├── sender_id (FK → users)
├── recipient_id (FK → users, nullable)
├── recipient_type (individual, class, all_parents, all_teachers)
├── subject
├── content
├── read_at
├── created_at
└── thread_id (for conversations)

-- 12. NOTIFICATIONS
notifications
├── id (UUID, PK)
├── school_id (FK → schools)
├── user_id (FK → users)
├── type (homework_assigned, grade_posted, message_received)
├── title
├── body
├── data (JSON)
├── read_at
└── created_at
```

## 🔒 ROW LEVEL SECURITY RULES

```sql
-- Every table must filter by school_id
CREATE POLICY school_isolation ON ALL TABLES
  USING (school_id = current_user_school_id());

-- Students see only their highlights
CREATE POLICY student_highlights ON quran_highlights
  FOR SELECT USING (
    student_id = auth.uid()
    OR teacher_id = auth.uid()
    OR user_role() = 'school_admin'
  );

-- Parents see only their children's data
CREATE POLICY parent_access ON quran_highlights
  FOR SELECT USING (
    student_id IN (
      SELECT student_id FROM parent_children
      WHERE parent_id = auth.uid()
    )
  );

-- Teachers see only their students
CREATE POLICY teacher_access ON quran_highlights
  FOR ALL USING (
    teacher_id = auth.uid()
    OR student_id IN (
      SELECT e.student_id
      FROM enrollments e
      JOIN class_teachers ct ON e.class_id = ct.class_id
      WHERE ct.teacher_id = auth.uid()
    )
  );
```

## 🔄 REAL-TIME DATA FLOW

### When Teacher Creates Homework:

```mermaid
Teacher Dashboard
    ↓ (Creates green highlight)
PostgreSQL Trigger
    ↓ (Fires on insert)
Creates Assignment Record
    ↓
Creates Notification
    ↓
Supabase Realtime
    ├→ Updates Student Dashboard (instantly)
    ├→ Updates Parent Dashboard (instantly)
    └→ Updates School Overview (instantly)
```

## 🎯 CRITICAL IMPLEMENTATION NOTES

### 1. User Creation Flow
```javascript
// School admin creates user
async function createUser(role, userData) {
  // 1. Create auth user (Supabase Auth)
  const { user } = await supabase.auth.admin.createUser({
    email: userData.email,
    password: generateSecurePassword(),
    email_confirm: true
  });

  // 2. Create profile
  await supabase.from('profiles').insert({
    user_id: user.id,
    school_id: currentSchoolId,
    role: role,
    full_name: userData.name
  });

  // 3. If parent, link to children
  if (role === 'parent') {
    await linkParentToChildren(user.id, userData.childrenIds);
  }

  // 4. Send credentials to user
  await sendCredentialsEmail(userData.email, password);
}
```

### 2. Homework Assignment Flow
```javascript
// Teacher assigns homework
async function assignHomework(studentId, quranSelection, dueDate, note) {
  // 1. Create highlight
  const { data: highlight } = await supabase
    .from('quran_highlights')
    .insert({
      school_id: currentSchoolId,
      student_id: studentId,
      teacher_id: currentTeacherId,
      surah_number: quranSelection.surah,
      ayah_start: quranSelection.ayahStart,
      ayah_end: quranSelection.ayahEnd,
      highlight_type: 'homework',
      color: 'green',
      note: note,
      due_date: dueDate,
      status: 'pending'
    })
    .select()
    .single();

  // 2. Create assignment record
  await supabase.from('assignments').insert({
    school_id: currentSchoolId,
    highlight_id: highlight.id,
    teacher_id: currentTeacherId,
    student_id: studentId,
    title: `Memorize Surah ${quranSelection.surah}`,
    type: 'memorization',
    status: 'assigned',
    due_date: dueDate
  });

  // 3. Notify student and parent
  await createNotifications(studentId, 'homework_assigned', highlight);
}
```

### 3. Student Quran Viewer Query
```javascript
// Get student's personalized Quran view
async function getStudentQuranView(studentId, surahNumber) {
  // Get base Quran text
  const quranText = await getQuranText(surahNumber);

  // Get student's highlights for this surah
  const { data: highlights } = await supabase
    .from('quran_highlights')
    .select('*')
    .eq('student_id', studentId)
    .eq('surah_number', surahNumber);

  // Merge highlights with Quran text
  return mergeHighlightsWithText(quranText, highlights);
}
```

## 📈 DATABASE RELATIONSHIPS MAP

```
schools
  ↓ (1:many)
users
  ↓ (1:1)
profiles
  ↓ (role-based branching)
  ├→ school_admin: manages everything
  ├→ teacher: → class_teachers → enrollments → students
  ├→ student: → enrollments → classes
  │            → quran_highlights (personalized)
  │            → assignments
  │            → attendance
  └→ parent: → parent_children → students → view all student data
```

## 🚀 IMPLEMENTATION PRIORITIES

### Phase 1: Foundation (Week 1)
1. Set up Supabase project
2. Create schools and users tables
3. Implement authentication with RLS
4. Create profiles with role system

### Phase 2: Core Features (Week 2)
1. Classes and enrollments
2. Quran highlights table
3. Student Quran viewer with highlights
4. Teacher homework creation

### Phase 3: Communication (Week 3)
1. Real-time updates
2. Notifications system
3. Messages between users
4. Parent dashboard views

### Phase 4: Advanced (Week 4)
1. Attendance tracking
2. Progress reports
3. Grade management
4. Analytics dashboard

## 💡 KEY INSIGHTS FROM DEVELOPMENT

1. **School Isolation is Critical**: Every query must include school_id
2. **Highlights are Per-Student**: Never show one student's work to another
3. **Parents are Read-Only**: They can view but never modify
4. **Real-time is Essential**: Parents expect instant updates
5. **Credentials are School-Managed**: No public registration

## 🔧 TECHNICAL DECISIONS

- **Database**: PostgreSQL via Supabase
- **Auth**: Supabase Auth with custom claims
- **Real-time**: Supabase Realtime subscriptions
- **Storage**: Supabase Storage for audio notes
- **Frontend**: Next.js with React Query for caching
- **State**: Zustand for global state management

## 📝 NOTES FOR NEXT SESSION

1. Start with creating the Supabase project
2. Run the SQL migrations in order
3. Set up RLS policies before adding any data
4. Create test school with sample users
5. Test the highlight system thoroughly
6. Ensure real-time updates work across dashboards

## 🎓 THE SYSTEM IN ONE SENTENCE

**"A school-controlled, multi-tenant Quran learning platform where each student has their own personalized overlay of highlights and homework on the same Quran text, visible to their teachers and parents in real-time."**

---

*This document contains the complete understanding of the QuranAkh system architecture, ready for database implementation.*