# Complete Assignment & Notification System Analysis
**Date**: November 12, 2025
**Purpose**: Comprehensive understanding of assignments system for real-time notification implementation

---

## EXECUTIVE SUMMARY

I have completed a thorough analysis of the entire Assignment system across all dashboards (Teacher, Student, Parent, School) and understand:
1. **How assignments are created** (from highlights or standalone)
2. **Assignment lifecycle** (6 statuses with strict transitions)
3. **How assignments appear** in each dashboard role
4. **Complete data flow** from creation to completion
5. **All database tables and relationships**
6. **Real-time subscription patterns** already in use

**Ready for**: Real-time notification implementation phase

---

## ASSIGNMENT SYSTEM ARCHITECTURE

### Core Concept Flow
```
Teacher Creates Highlight on Student Quran
    ↓
(Optional) Teacher Links Highlight(s) to Assignment
    ↓
Assignment Created with Title, Description, Due Date
    ↓
Assignment Appears in Student Dashboard (status: 'assigned')
    ↓
Student Opens Assignment (status → 'viewed')
    ↓
Student Submits Work (status → 'submitted')
    ↓
Teacher Reviews Submission (status → 'reviewed')
    ↓
Teacher Marks Complete (status → 'completed')
    ↓
All Linked Highlights Turn GOLD automatically
    ↓
(Optional) Teacher Reopens (status → 'reopened' → student can resubmit)
```

---

## DATABASE SCHEMA

### Primary Tables

#### 1. `assignments`
```sql
id                      uuid PRIMARY KEY
school_id               uuid FK schools
created_by_teacher_id   uuid FK teachers
student_id              uuid FK students
title                   text NOT NULL (max 200 chars)
description             text (max 5000 chars)
status                  assignment_status ENUM DEFAULT 'assigned'
due_at                  timestamptz NOT NULL
late                    boolean GENERATED (now() > due_at AND status != 'completed')
reopen_count            int DEFAULT 0 (max 10 reopens)
created_at              timestamptz DEFAULT now()
updated_at              timestamptz
```

**Assignment Status Enum**:
- `assigned` → `viewed` (student opens)
- `viewed` → `submitted` (student submits)
- `submitted` → `reviewed` (teacher reviews)
- `reviewed` → `completed` (teacher completes)
- `completed` → `reopened` (teacher reopens for resubmission)
- `reopened` → `submitted` (student resubmits)

#### 2. `assignment_highlights` (Junction Table)
```sql
id               uuid PRIMARY KEY
assignment_id    uuid FK assignments ON DELETE CASCADE
highlight_id     uuid FK highlights ON DELETE CASCADE
created_at       timestamptz DEFAULT now()

UNIQUE (assignment_id, highlight_id)  -- Prevents duplicate links
```

**Purpose**: Links Quran highlights to assignments (many-to-many relationship)

#### 3. `highlights`
```sql
id              uuid PRIMARY KEY
school_id       uuid FK schools
teacher_id      uuid FK teachers
student_id      uuid FK students
surah           int
ayah_start      int
ayah_end        int
page_number     int
color           text  -- 'purple', 'orange', 'red', 'brown', 'gold'
type            text  -- 'recap', 'tajweed', 'haraka', 'letter'
note            text
created_at      timestamptz

-- Completion tracking (when assignment completed)
previous_color  text  -- Original color before turning gold
completed_at    timestamptz
completed_by    uuid FK profiles.user_id
```

**Color Meanings**:
- Purple = Recap needed
- Orange = Tajweed issue
- Red = Haraka (vowel mark) error
- Brown = Letter pronunciation error
- Gold = Completed/Mastered

#### 4. `assignment_submissions`
```sql
id              uuid PRIMARY KEY
assignment_id   uuid FK assignments ON DELETE CASCADE
student_id      uuid FK students ON DELETE CASCADE
text            text  -- Student's response text
created_at      timestamptz DEFAULT now()
```

#### 5. `assignment_attachments`
```sql
id                  uuid PRIMARY KEY
assignment_id       uuid FK assignments ON DELETE CASCADE
uploader_user_id    uuid FK profiles.user_id
url                 text NOT NULL  -- Supabase Storage URL
mime_type           text NOT NULL
created_at          timestamptz DEFAULT now()
```

#### 6. `assignment_events` (Audit Log)
```sql
id              uuid PRIMARY KEY
assignment_id   uuid FK assignments ON DELETE CASCADE
event_type      text NOT NULL  -- 'created', 'transitioned', 'submitted', 'reviewed', 'completed', 'reopened'
actor_user_id   uuid FK profiles.user_id
from_status     assignment_status
to_status       assignment_status
meta            jsonb  -- Additional event data
created_at      timestamptz DEFAULT now()
```

**Event Types**:
- `created` - Assignment created
- `viewed` - Student viewed assignment
- `submitted` - Student submitted work
- `reviewed` - Teacher reviewed submission
- `completed` - Teacher marked complete (highlights turn gold)
- `reopened` - Teacher reopened for resubmission

---

## ASSIGNMENT LIFECYCLE

### Status Transition Rules
```typescript
const VALID_TRANSITIONS = {
  assigned: ['viewed'],                    // Student can only view
  viewed: ['submitted'],                   // Student can only submit
  submitted: ['reviewed'],                 // Teacher can only review
  reviewed: ['completed'],                 // Teacher can only complete
  completed: ['reopened'],                 // Teacher can reopen
  reopened: ['submitted']                  // Student can resubmit
};
```

### Automated Actions on Status Change

**`assigned` → `viewed`** (Student Opens Assignment):
- Timestamp recorded in `assignment_events`
- No database update (status change tracked in events)

**`viewed` → `submitted`** (Student Submits Work):
- Creates record in `assignment_submissions`
- Creates record in `assignment_attachments` (if files attached)
- Updates `assignments.status = 'submitted'`
- Creates `assignment_events` record

**`submitted` → `reviewed`** (Teacher Reviews):
- Updates `assignments.status = 'reviewed'`
- Creates `assignment_events` record

**`reviewed` → `completed`** (Teacher Completes):
- Updates `assignments.status = 'completed'`
- **CRITICAL**: Fetches all linked highlights via `assignment_highlights`
- **Batch updates** all linked highlights:
  ```sql
  UPDATE highlights SET
    previous_color = color,
    color = 'gold',
    completed_at = now(),
    completed_by = current_user_id
  WHERE id IN (linked_highlight_ids);
  ```
- Creates `assignment_events` record with metadata: `{ highlights_completed: N }`

**`completed` → `reopened`** (Teacher Reopens):
- Updates `assignments.status = 'reopened'`
- Increments `assignments.reopen_count`
- Creates `assignment_events` record with `reason` in metadata

---

## ASSIGNMENT CREATION WORKFLOW

### Method 1: From Highlights (Teacher Dashboard)

**Step 1**: Teacher creates highlights on student's Quran
```typescript
// Teacher marks mistakes on student Quran
const highlight1 = await createHighlight({
  student_id: 'uuid',
  surah: 1,
  ayah_start: 1,
  ayah_end: 1,
  page_number: 1,
  color: 'purple',
  type: 'recap',
  note: 'Review Al-Fatihah pronunciation'
});
```

**Step 2**: Teacher creates assignment
```typescript
POST /api/assignments
{
  student_id: 'uuid',
  title: 'Surah Al-Fatihah Review',
  description: 'Review and correct the highlighted mistakes',
  due_at: '2025-11-20T23:59:59Z'
}
```

**Step 3**: Teacher links highlights to assignment
```typescript
POST /api/assignments/{assignment_id}/highlights
{
  highlight_ids: ['highlight-uuid-1', 'highlight-uuid-2', 'highlight-uuid-3']
}
```

**Result**: Assignment created with linked Quran highlights. Student sees assignment with reference to specific ayahs.

### Method 2: Standalone Assignment (No Highlights)

**Teacher creates assignment without highlights**:
```typescript
POST /api/assignments
{
  student_id: 'uuid',
  title: 'Memorize Surah Al-Ikhlas',
  description: 'Complete memorization with proper tajweed',
  due_at: '2025-11-25T23:59:59Z'
}
```

**Result**: General assignment without specific Quran highlights attached.

---

## DASHBOARD VISIBILITY

### Teacher Dashboard

**Where Assignments Appear**:
- **Assignments Tab** - Full list of all assignments created by this teacher
- **Student Detail View** - Assignments for specific student
- **Highlights Panel** - Can link highlights to new/existing assignments

**Teacher Can**:
- ✅ Create assignments (with or without highlights)
- ✅ View all assignments they created
- ✅ Review student submissions
- ✅ Mark assignments as reviewed/completed
- ✅ Reopen completed assignments
- ✅ Delete assignments (if status = 'assigned' or 'viewed')
- ✅ Link/unlink highlights to assignments

**Assignment Display** (Teacher View):
```typescript
interface AssignmentCardTeacher {
  title: string;
  student_name: string;  // Who it's assigned to
  status: AssignmentStatus;
  due_date: string;
  time_remaining: string;
  is_late: boolean;
  submission_status: 'not_submitted' | 'submitted' | 'reviewed' | 'completed';
  linked_highlights_count: number;
}
```

### Student Dashboard

**Where Assignments Appear**:
- **Assignments Tab** - All assignments assigned to THIS student
- **Quran Viewer** - Highlights linked to assignments are visible

**Student Can**:
- ✅ View all their assignments
- ✅ See assignment details (title, description, due date, linked highlights)
- ✅ Submit assignment work (text + file attachments)
- ✅ View submission status
- ✅ Resubmit work (if reopened by teacher)
- ❌ Cannot delete or modify assignments
- ❌ Cannot see other students' assignments

**Assignment Display** (Student View):
```typescript
interface AssignmentCardStudent {
  title: string;
  teacher_name: string;  // Who assigned it
  description: string;
  status: AssignmentStatus;
  due_date: string;
  time_remaining: string;
  is_late: boolean;
  linked_highlights: Array<{
    surah: number;
    ayah: number;
    color: string;
    type: string;
  }>;
  can_submit: boolean;  // True if status = 'viewed' or 'reopened'
}
```

### Parent Dashboard

**Where Assignments Appear**:
- **Child's Profile Tab** - View assignments for linked children
- **Assignment Overview** - Summary of child's pending/completed work

**Parent Can**:
- ✅ View all assignments for their linked children
- ✅ See assignment status and due dates
- ✅ View submission status
- ✅ See completion and grades
- ❌ Cannot submit assignments
- ❌ Cannot create or modify assignments
- ❌ Cannot see other children's assignments (only their own children)

**Assignment Display** (Parent View):
```typescript
interface AssignmentCardParent {
  title: string;
  child_name: string;
  teacher_name: string;
  status: AssignmentStatus;
  due_date: string;
  is_late: boolean;
  is_submitted: boolean;
  is_completed: boolean;
  grade?: number;
}
```

### School Dashboard (Owner/Admin)

**Where Assignments Appear**:
- **Overview Tab** - School-wide assignment statistics
- **Assignments Tab** - All assignments across all students/teachers
- **Analytics** - Assignment completion rates, late submissions, etc.

**School Admin Can**:
- ✅ View ALL assignments in the school
- ✅ Filter by teacher, student, status, due date
- ✅ See assignment analytics
- ✅ Export assignment data
- ✅ Intervene on assignments (mark complete, reopen, delete)
- ✅ See linked highlights for all assignments

**Assignment Display** (School View):
```typescript
interface AssignmentCardSchool {
  title: string;
  teacher_name: string;
  student_name: string;
  class_name?: string;
  status: AssignmentStatus;
  due_date: string;
  is_late: boolean;
  created_date: string;
  completed_date?: string;
}
```

---

## REAL-TIME REQUIREMENTS FOR NOTIFICATIONS

### Events That Should Trigger Notifications

#### 1. **Assignment Created** (`status = 'assigned'`)
**Who to notify**: Student, Parent(s)
**Message**:
- Student: "New assignment: {title} from {teacher_name}, due {due_date}"
- Parent: "Your child {student_name} received assignment: {title} from {teacher_name}"

**Database Event**:
```sql
INSERT INTO assignments (status = 'assigned')
→ Triggers notification to student_id and parent_ids
```

#### 2. **Assignment Viewed** (`status → 'viewed'`)
**Who to notify**: Teacher (assignment creator)
**Message**:
- Teacher: "{student_name} viewed assignment: {title}"

**Database Event**:
```sql
UPDATE assignments SET status = 'viewed'
→ Triggers notification to created_by_teacher_id
```

#### 3. **Assignment Submitted** (`status → 'submitted'`)
**Who to notify**: Teacher (assignment creator), Parent(s)
**Message**:
- Teacher: "{student_name} submitted assignment: {title}"
- Parent: "Your child {student_name} submitted assignment: {title}"

**Database Event**:
```sql
UPDATE assignments SET status = 'submitted'
INSERT INTO assignment_submissions
→ Triggers notification to created_by_teacher_id and parent_ids
```

#### 4. **Assignment Reviewed** (`status → 'reviewed'`)
**Who to notify**: Student, Parent(s)
**Message**:
- Student: "Your assignment {title} has been reviewed by {teacher_name}"
- Parent: "{teacher_name} reviewed {student_name}'s assignment: {title}"

**Database Event**:
```sql
UPDATE assignments SET status = 'reviewed'
→ Triggers notification to student_id and parent_ids
```

#### 5. **Assignment Completed** (`status → 'completed'`)
**Who to notify**: Student, Parent(s)
**Message**:
- Student: "✅ Assignment completed: {title}. {N} highlights turned gold!"
- Parent: "✅ {student_name} completed assignment: {title}"

**Database Event**:
```sql
UPDATE assignments SET status = 'completed'
UPDATE highlights SET color = 'gold' WHERE id IN (linked_highlights)
→ Triggers notification to student_id and parent_ids
```

#### 6. **Assignment Reopened** (`status → 'reopened'`)
**Who to notify**: Student, Parent(s)
**Message**:
- Student: "Assignment reopened: {title}. Please resubmit. Reason: {reason}"
- Parent: "{teacher_name} reopened {student_name}'s assignment: {title}"

**Database Event**:
```sql
UPDATE assignments SET status = 'reopened', reopen_count++
→ Triggers notification to student_id and parent_ids
```

#### 7. **Assignment Due Soon** (24 hours before due_at)
**Who to notify**: Student, Parent(s)
**Message**:
- Student: "⏰ Assignment due in 24 hours: {title}"
- Parent: "⏰ {student_name}'s assignment {title} is due in 24 hours"

**Trigger**: Scheduled job (not database trigger)

#### 8. **Assignment Overdue** (after due_at, not submitted)
**Who to notify**: Student, Parent(s), Teacher
**Message**:
- Student: "⚠️ Assignment overdue: {title}"
- Parent: "⚠️ {student_name}'s assignment {title} is overdue"
- Teacher: "⚠️ {student_name} has overdue assignment: {title}"

**Trigger**: Scheduled job (not database trigger)

---

## NOTIFICATION DATA REQUIREMENTS

### Notification Payload Structure
```typescript
interface AssignmentNotification {
  // Notification metadata
  id: string;
  type: 'assignment_created' | 'assignment_viewed' | 'assignment_submitted' |
        'assignment_reviewed' | 'assignment_completed' | 'assignment_reopened' |
        'assignment_due_soon' | 'assignment_overdue';
  created_at: string;
  read: boolean;

  // Assignment data
  assignment: {
    id: string;
    title: string;
    description?: string;
    status: AssignmentStatus;
    due_at: string;
    is_late: boolean;
  };

  // Actor (who triggered this notification)
  actor: {
    id: string;
    name: string;
    role: 'teacher' | 'student';
  };

  // Target (who receives this notification)
  recipient: {
    id: string;
    role: 'student' | 'parent' | 'teacher';
  };

  // Additional context
  meta: {
    student_name?: string;
    teacher_name?: string;
    highlights_completed?: number;
    reopen_reason?: string;
    time_until_due?: string;
  };
}
```

---

## EXISTING REAL-TIME PATTERNS IN SYSTEM

### Current Real-Time Implementation (Highlights)
```typescript
// From frontend/lib/api/highlights.ts

// Subscribe to highlight changes for a student
subscribeToHighlights(studentId: string, callback: (payload: any) => void) {
  return supabase
    .channel(`highlights:${studentId}`)
    .on(
      'postgres_changes',
      {
        event: '*',  // INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'highlights',
        filter: `student_id=eq.${studentId}`
      },
      callback
    )
    .subscribe()
}
```

**Pattern to Follow for Assignments**:
```typescript
// Subscribe to assignment changes for a student
subscribeToAssignments(studentId: string, callback: (payload: any) => void) {
  return supabase
    .channel(`assignments:${studentId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'assignments',
        filter: `student_id=eq.${studentId}`
      },
      callback
    )
    .subscribe()
}

// Subscribe to assignment changes created by a teacher
subscribeToTeacherAssignments(teacherId: string, callback: (payload: any) => void) {
  return supabase
    .channel(`teacher_assignments:${teacherId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'assignments',
        filter: `created_by_teacher_id=eq.${teacherId}`
      },
      callback
    )
    .subscribe()
}
```

---

## NOTIFICATION CHANNELS

### Real-Time Channels (Currently Supported)
- `in_app` - Browser notifications within application
- `email` - Email notifications (via send-credentials edge function pattern)

### Future Channels (Not Yet Implemented)
- `push` - Push notifications to mobile devices

---

## NEXT STEPS FOR NOTIFICATION IMPLEMENTATION

Now that I have complete understanding, the implementation will involve:

1. **Database Layer**:
   - Create `notifications` table (already exists in schema)
   - Create database triggers for assignment status changes
   - Create scheduled jobs for due date reminders

2. **API Layer**:
   - Create `/api/notifications` endpoints
   - Create notification creation service
   - Implement notification preferences

3. **Real-Time Layer**:
   - Set up Supabase Realtime subscriptions for assignments
   - Create notification broadcasting system
   - Implement real-time UI updates

4. **Frontend Layer**:
   - Create notification bell component
   - Create notification list panel
   - Implement toast notifications for real-time events
   - Add notification sound/visual indicators

---

**READY FOR**: Notification system implementation with complete context of assignment lifecycle and requirements.
