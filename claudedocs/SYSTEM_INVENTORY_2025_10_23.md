# QuranAkh Platform - Complete System Inventory
## Generated: October 23, 2025

**Purpose**: Comprehensive component inventory for final UI audit
**Scope**: All dashboards, panels, hooks, APIs, UI components, utilities, stores, and migrations

---

## 📊 INVENTORY SUMMARY

| Category | Count | Status |
|----------|-------|--------|
| **Primary Dashboards** | 4 | ✅ Identified |
| **Shared Panels** | 11 | ✅ Identified |
| **Custom Hooks** | 21 | ✅ Identified |
| **API Routes** | 90+ | ✅ Identified |
| **UI Components** | 50+ | ✅ Identified |
| **Library Files** | 33+ | ✅ Identified |
| **Zustand Stores** | 4 | ✅ Identified |
| **SQL Migrations** | 3 | ✅ Identified |

---

## 🎯 PRIMARY DASHBOARDS (4)

Located in `frontend/components/dashboard/`

1. **SchoolDashboard.tsx**
   - Role: Owner/Admin
   - Pattern: Direct Supabase (Pattern A)
   - Tabs: Overview, Students, Teachers, Parents, Classes, Homework, Assignments, Targets, Messages, Calendar, Credentials, Reports (12 tabs)

2. **TeacherDashboard.tsx**
   - Role: Teacher
   - Pattern: API Routes with JWT (Pattern B)
   - Tabs: Classes, Students, Homework, Assignments, Gradebook, Mastery, Messages, Calendar, Attendance, Targets, Reports (11 tabs)

3. **StudentDashboard.tsx**
   - Role: Student
   - Pattern: API Routes with JWT (Pattern B)
   - Tabs: My Work, Homework, Assignments, Grades, Progress, Messages, Calendar (6 tabs)

4. **ParentDashboard.tsx**
   - Role: Parent
   - Pattern: API Routes with JWT (Pattern B)
   - Features: Multi-child view, read-only access to linked children's data

---

## 🧩 SHARED PANELS (11)

Reusable components used across multiple dashboards:

1. **GradebookPanel.tsx** (`frontend/components/gradebook/`)
   - Used by: Teacher, Student, Parent dashboards
   - Features: Rubrics, grades, student/parent gradebook views, CSV/PDF export

2. **MasteryPanel.tsx** (`frontend/components/mastery/`)
   - Used by: Teacher, Student dashboards
   - Features: Per-ayah mastery tracking, surah heatmap, mastery level updates

3. **MessagesPanel.tsx** (`frontend/components/messages/`)
   - Used by: All dashboards
   - Features: Messaging, threads, attachments

4. **CalendarPanel.tsx** (`frontend/components/calendar/`)
   - Used by: All dashboards
   - Features: Events, iCal export, calendar management

5. **AssignmentsPanel.tsx** (`frontend/components/assignments/`)
   - Used by: Teacher, Student dashboards
   - Features: Assignment lifecycle, submissions, attachments

6. **AttendancePanel.tsx** (`frontend/components/attendance/`)
   - Used by: Teacher, Student dashboards
   - Features: Attendance tracking, session management, summaries

7. **TargetsPanel.tsx** (`frontend/components/targets/`)
   - Used by: Teacher, Student dashboards
   - Features: Target setting, progress tracking, milestones

8. **ClassesPanel.tsx** (`frontend/components/classes/`)
   - Used by: School, Teacher dashboards
   - Features: Class CRUD, enrollment management

9. **NotesPanel.tsx** (`frontend/features/annotations/components/`)
   - Used by: Quran annotation system
   - Features: Teacher notes on student Quran recitation

10. **HistoryPanel.tsx** (`frontend/features/annotations/components/`)
    - Used by: Quran annotation system
    - Features: Annotation history, event log

11. **ParentNotesPanel.tsx** (`frontend/features/parent/components/`)
    - Used by: Parent dashboard
    - Features: Parent-specific notes view

---

## 🪝 CUSTOM HOOKS (21)

Located in `frontend/hooks/`

### Core Data Fetching Hooks:
1. **useGradebook.ts** (12 fetch calls)
   - Functions: fetchRubrics, fetchRubric, createRubric, updateRubric, deleteRubric, submitGrade, fetchAssignmentGrades, fetchStudentGrades, attachRubric, fetchStudentGradebook, fetchParentGradebook, exportGradebook
   - Status: ✅ 12/12 Authorization headers verified (from previous audit)

2. **useAssignments.ts** (9 fetch calls)
   - Functions: Assignment CRUD, transitions, submissions
   - Status: ✅ 9/9 Authorization headers verified

3. **useHomework.ts** (6 fetch calls)
   - Functions: Homework CRUD, replies, completion
   - Status: ✅ 6/6 Authorization headers verified

4. **useCalendar.ts** (6 fetch calls)
   - Functions: Event management, iCal export
   - Status: ⚠️ 5/6 Authorization headers (1 potential gap noted)

5. **useStudents.ts** (7 fetch calls)
   - Functions: Student CRUD, management
   - Status: ⚠️ 2/7 Authorization headers (5 potential gaps noted)

6. **useParentStudentLinks.ts** (6 fetch calls)
   - Functions: Parent-student link management
   - Status: ⚠️ 3/6 Authorization headers (3 potential gaps noted)

7. **useAttendance.ts** (5 fetch calls)
   - Functions: Attendance tracking
   - Status: ⚠️ 4/5 Authorization headers (1 potential gap noted)

8. **useMessages.ts** (5 fetch calls)
   - Functions: Message CRUD, threads
   - Status: ⚠️ 3/5 Authorization headers (2 potential gaps noted)

9. **useParents.ts** (5 fetch calls)
   - Functions: Parent CRUD, management
   - Status: ⚠️ 1/5 Authorization headers (4 potential gaps noted)

10. **useTargets.ts** (5 fetch calls)
    - Functions: Target CRUD, progress, milestones
    - Status: ✅ 5/5 Authorization headers verified

11. **useClasses.ts** (4 fetch calls)
    - Functions: Class CRUD
    - Status: ✅ 4/4 Authorization headers verified (from previous audit)

12. **useNotifications.ts** (3 fetch calls)
    - Functions: Notification management
    - Status: ✅ 3/3 Authorization headers verified

13. **useMastery.ts** (3 fetch calls)
    - Functions: Mastery tracking, heatmap
    - Status: ✅ 3/3 Authorization headers verified (from previous audit)

### Utility Hooks:
14. **useAuth.ts** - Authentication state management
15. **useQuran.ts** - Quran text fetching
16. **useRealtimeSubscriptions.ts** - Real-time data sync
17. **useSocket.ts** - WebSocket connections
18. **useReportsData.ts** - Reports data aggregation
19. **useSchoolData.ts** - School-level data management

### Backup Files (Not Active):
20. **useReportsData.BACKUP.ts**
21. **useSchoolData.BACKUP.ts**

---

## 🌐 API ROUTES (90+)

Located in `frontend/app/api/`

### Authentication (9 routes):
- `/api/auth/login` - User login
- `/api/auth/signin` - Alternative signin
- `/api/auth/register-school` - School registration
- `/api/auth/create-school` - School creation
- `/api/auth/create-teacher` - Teacher account creation
- `/api/auth/create-student` - Student account creation
- `/api/auth/create-parent` - Parent account creation
- `/api/auth/create-student-parent` - Combined student-parent creation
- `/api/auth/delete-user-by-email` - User deletion

### School Management (18 routes):
- `/api/school/classes` - School classes list
- `/api/school/create-teacher` - Create teacher
- `/api/school/create-student` - Create student
- `/api/school/create-parent` - Create parent
- `/api/school/update-teacher` - Update teacher
- `/api/school/update-student` - Update student
- `/api/school/update-parent` - Update parent
- `/api/school/delete-teachers` - Bulk delete teachers
- `/api/school/delete-students` - Bulk delete students
- `/api/school/delete-parents` - Bulk delete parents
- `/api/school/bulk-create-teachers` - Bulk create teachers
- `/api/school/bulk-create-students` - Bulk create students
- `/api/school/link-parent-student` - Link parent to student
- `/api/school/cleanup-orphaned-users` - Cleanup utility
- `/api/school/delete-all-users` - Cleanup utility

### Classes (5 routes):
- `/api/classes` - Class CRUD
- `/api/classes/[classId]` - Individual class operations
- `/api/classes/my-classes` - Teacher's classes
- `/api/class-teachers` - Class-teacher assignments

### Homework (4 routes):
- `/api/homework` - Homework CRUD
- `/api/homework/[id]/reply` - Reply to homework
- `/api/homework/[id]/complete` - Mark homework complete
- `/api/homework/student/[id]` - Student homework list

### Assignments (6 routes):
- `/api/assignments` - Assignment CRUD
- `/api/assignments/[id]` - Individual assignment
- `/api/assignments/[id]/transition` - Status transitions
- `/api/assignments/[id]/submit` - Submit assignment
- `/api/assignments/[id]/reopen` - Reopen assignment
- `/api/assignments/[id]/rubric` - Attach rubric

### Messages (5 routes):
- `/api/messages` - Message CRUD
- `/api/messages/[id]` - Individual message
- `/api/messages/[id]/attachments` - Message attachments
- `/api/messages/thread/[id]` - Message threads

### Calendar/Events (4 routes):
- `/api/events` - Event CRUD
- `/api/events/[id]` - Individual event
- `/api/events/ical` - iCal export

### Attendance (7 routes):
- `/api/attendance` - Attendance CRUD
- `/api/attendance/[id]` - Individual attendance record
- `/api/attendance/session` - Session attendance
- `/api/attendance/summary` - Attendance summaries
- `/api/attendance/student/[id]` - Student attendance
- `/api/attendance/class/[id]` - Class attendance

### Targets (6 routes):
- `/api/targets` - Target CRUD
- `/api/targets/[id]` - Individual target
- `/api/targets/[id]/progress` - Progress updates
- `/api/targets/[id]/milestones` - Milestones
- `/api/targets/milestones/[id]` - Individual milestone

### Gradebook/Rubrics (11 routes):
- `/api/rubrics` - Rubric CRUD
- `/api/rubrics/[id]` - Individual rubric
- `/api/rubrics/[id]/criteria` - Rubric criteria
- `/api/rubrics/criteria/[id]` - Individual criterion
- `/api/grades` - Grade submission
- `/api/grades/assignment/[id]` - Assignment grades
- `/api/grades/student/[id]` - Student grades
- `/api/gradebook/export` - Export gradebook

### Mastery (4 routes):
- `/api/mastery/upsert` - Update mastery level
- `/api/mastery/student/[id]` - Student mastery overview
- `/api/mastery/heatmap/[surah]` - Surah heatmap
- `/api/mastery/auto-update` - Auto-update mastery

### Notifications (6 routes):
- `/api/notifications` - Notification CRUD
- `/api/notifications/send` - Send notification
- `/api/notifications/[id]/read` - Mark as read
- `/api/notifications/read-all` - Mark all as read
- `/api/notifications/preferences` - Notification preferences

### Annotations/Highlights (8 routes):
- `/api/highlights` - Highlight CRUD
- `/api/highlights/[id]/notes` - Highlight notes
- `/api/annotations/save` - Save annotations
- `/api/annotations/load` - Load annotations
- `/api/annotations/latest` - Latest annotations
- `/api/notes/add` - Add note
- `/api/notes/list` - List notes

### Reports/Audit (4 routes):
- `/api/reports/export` - Export reports
- `/api/audit/list` - Audit logs
- `/api/renders/list` - Render list
- `/api/renders/history` - Render history
- `/api/renders/signed-url` - Signed URLs

### Imports (2 routes):
- `/api/import/teachers` - Bulk import teachers
- `/api/import/students` - Bulk import students

### Utilities (4 routes):
- `/api/users` - User management
- `/api/students` - Student utilities
- `/api/teachers` - Teacher utilities
- `/api/parents` - Parent utilities
- `/api/tajweed/analyze` - Tajweed analysis

---

## 🎨 UI COMPONENTS (50+)

Located in `frontend/components/`

### Authentication (3):
- `auth/LoginForm.tsx` - Login form
- `auth/AuthModal.tsx` - Auth modal
- `auth/ProtectedRoute.tsx` - Route protection

### Landing Page (10):
- `landing/Navbar.tsx`
- `landing/HeroSection.tsx`
- `landing/FeaturesSection.tsx`
- `landing/PricingSection.tsx`
- `landing/TestimonialsSection.tsx`
- `landing/StatsSection.tsx`
- `landing/TrustSection.tsx`
- `landing/CTASection.tsx`
- `landing/Footer.tsx`
- `landing/AuthModalSimple.tsx`

### Quran Components (4):
- `quran/QuranViewer.tsx` - Main Quran viewer
- `quran/MushafPageDisplay.tsx` - Mushaf page rendering
- `quran/HighlightPopover.tsx` - Highlight interactions
- `quran/VoiceNoteRecorder.tsx` - Voice note recording

### Onboarding (2):
- `onboarding/SchoolOnboarding.tsx`
- `onboarding/TeacherOnboarding.tsx`

### Modals (3):
- `CreateUserModal.tsx`
- `dashboard/SchoolModals.tsx`
- `dashboard/parent-modals.tsx`

### UI Primitives (5):
- `ui/button.tsx`
- `ui/card.tsx`
- `ui/input.tsx`
- `ui/toast.tsx`
- `ui/toaster.tsx`

### Class Builders (3):
- `dashboard/ClassBuilder.tsx`
- `dashboard/ClassBuilderPro.tsx`
- `dashboard/ClassBuilderUltra.tsx`

### Dashboard Additions (4):
- `dashboard/SchoolDashboard-additions.tsx`
- `dashboard/SchoolDashboardProduction.tsx`
- `dashboard/SchoolProfile.tsx`
- `dashboard/AdvancedScheduler.tsx`

---

## 📚 LIBRARY UTILITIES (33+)

Located in `frontend/lib/`

### Type Definitions (8):
- `types/assignments.ts`
- `types/homework.ts`
- `types/targets.ts`
- `types/gradebook.ts`
- `types/mastery.ts`
- `types/notifications.ts`
- `types/events.ts`
- `types/messages.ts`

### Validators (8):
- `validators/assignments.ts`
- `validators/homework.ts`
- `validators/targets.ts`
- `validators/gradebook.ts`
- `validators/mastery.ts`
- `validators/notifications.ts`
- `validators/events.ts`
- `validators/messages.ts`

### API Clients (5):
- `api/highlights.ts`
- `api/notifications.ts`
- `api/practice.ts`
- `api/storage.ts`
- `api/schools.ts`

### Authentication (3):
- `auth-helpers.ts`
- `auth-client.ts`
- `supabase-auth-service.ts`

### Supabase Integration (4):
- `supabase/client.ts`
- `supabase/server.ts`
- `supabase-admin.ts`
- `supabase-server.ts`

### Utilities (5):
- `utils.ts` - General utilities
- `socket.ts` - WebSocket client
- `credentials-system.ts` - Credentials management
- `database.types.ts` - Database type definitions
- `api.ts` - API utilities

---

## 🗄️ ZUSTAND STORES (4)

Located in `frontend/store/`

1. **authStore.ts**
   - Purpose: Authentication state management
   - State: User, session, role, school_id

2. **schoolStore.ts**
   - Purpose: School-level data caching
   - State: Classes, students, teachers
   - Status: ✅ 3/3 Authorization headers verified (from previous audit)

3. **assignmentStore.ts**
   - Purpose: Assignment state management
   - State: Assignments, submissions

4. **highlightStore.ts**
   - Purpose: Quran highlight management
   - State: Highlights, notes, annotations

---

## 🗃️ DATABASE MIGRATIONS (3)

Located in `supabase/migrations/`

1. **20251016000001_complete_production_schema.sql**
   - Purpose: Complete database schema
   - Tables: 30+ tables (schools, profiles, teachers, students, parents, classes, assignments, homework, grades, mastery, etc.)
   - Enums: role, assignment_status, mistake_type, attendance_status, note_type, mastery_level, notif_channel

2. **20251016000002_rls_policies.sql**
   - Purpose: Row Level Security policies
   - Coverage: All tables with school_id isolation
   - Policies: School-based RLS, role-based access control

3. **20251021000001_calendar_events_advanced.sql**
   - Purpose: Advanced calendar/events functionality
   - Features: Event CRUD, recurrence, iCal export

---

## ⚠️ DUPLICATE FILES DETECTED

### Duplicate Dashboards:
1. **SchoolDashboard.tsx**
   - Location A: `frontend/components/dashboard/SchoolDashboard.tsx`
   - Location B: `frontend/features/school/components/SchoolDashboard.tsx`
   - Action Required: Determine which is active/canonical

2. **TeacherDashboard.tsx**
   - Location A: `frontend/components/dashboard/TeacherDashboard.tsx`
   - Location B: `frontend/features/teacher/components/TeacherDashboard.tsx`
   - Action Required: Determine which is active/canonical

---

## 📋 ARCHITECTURAL PATTERNS

### Pattern A: Direct Supabase
- **Used By**: SchoolDashboard (owner/admin role)
- **Approach**: Direct Supabase client queries
- **Authorization**: Supabase RLS policies
- **Advantage**: Simpler code, fewer layers

### Pattern B: API Routes with JWT
- **Used By**: TeacherDashboard, StudentDashboard, ParentDashboard
- **Approach**: API routes with JWT Bearer token authorization
- **Authorization**: `Authorization: Bearer ${session.access_token}`
- **Advantage**: Centralized business logic, better validation

### Component Delegation Pattern:
- Dashboards delegate to shared panels
- Panels adapt UI based on user role
- Panels use custom hooks for data fetching
- Hooks handle authorization and error handling

---

## 🎯 NEXT STEPS FOR AUDIT

Based on this inventory, the final UI audit will proceed in this order:

1. ✅ **System Inventory** - COMPLETED
2. ⏳ **Dashboard UI Audit** - NEXT
   - SchoolDashboard.tsx (12 tabs)
   - TeacherDashboard.tsx (11 tabs)
   - StudentDashboard.tsx (6 tabs)
   - ParentDashboard.tsx (multi-child view)
3. **Panel UI Audit** - PENDING
   - All 11 shared panels one-by-one
4. **Hooks Authorization Audit** - PENDING
   - Verify all authorization headers
   - Investigate potential gaps in useStudents, useParents, etc.
5. **API Routes Audit** - PENDING
   - Verify all 90+ API routes
6. **Database Schema Audit** - PENDING
   - Verify RLS policies
7. **UI Components Audit** - PENDING
   - Verify all 50+ components
8. **Final Report** - PENDING
   - Comprehensive findings document
9. **Save to Memory** - PENDING
   - All findings and observations

---

**Generated By**: Claude Code (Sonnet 4.5)
**Date**: October 23, 2025
**Purpose**: Complete system inventory for final UI audit
