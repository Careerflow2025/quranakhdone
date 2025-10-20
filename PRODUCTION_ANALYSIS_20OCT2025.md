# QuranAkh Production Analysis & Implementation Plan
**Date**: October 20, 2025
**Status**: Gap Analysis Complete - Implementation Phase Starting
**Project Value**: £100M Company - Production-Grade Requirements

---

## 📊 EXECUTIVE SUMMARY

**Overall Project Health**: 50% Complete
- **Database Infrastructure**: 95% ✅ (35 tables, RLS enabled, proper relationships)
- **Frontend Dashboards**: 55% ⚠️ (UI built, missing features)
- **Backend APIs**: 25% ❌ (Auth works, feature APIs missing)
- **Production Readiness**: 30% ❌ (Not production-ready)

---

## 🏗️ ARCHITECTURE DISCOVERED

### 1. Homepage & Landing
- **File**: `frontend/app/page.tsx`
- **Status**: ✅ 100% Complete
- **Features**: Hero, Features, Stats, Testimonials, Pricing, Footer, Mobile Responsive

### 2. School/Admin Dashboard
- **File**: `frontend/components/dashboard/SchoolDashboardProduction.tsx`
- **Status**: ✅ 70% Complete
- **Features**: Sidebar nav, Stats overview, User management (students/teachers/parents), Empty states
- **Missing**: Parent-student linking UI, Bulk CSV upload, Advanced reports

### 3. Teacher Dashboard
- **File**: `frontend/components/dashboard/TeacherDashboard.tsx`
- **Status**: ⚠️ 60% Complete
- **Features**: Overview stats, My classes, Students list, **Homework management**, **Targets system**, Messages
- **Missing**: Assignment creation, Gradebook interface, Calendar integration

### 4. Student Dashboard
- **File**: `frontend/components/dashboard/StudentDashboard.tsx`
- **Status**: ⚠️ 55% Complete
- **Features**: Quran reader, Homework view, Assignments list, Progress tracking, Targets view, Messages
- **Missing**: Assignment submission flow, Grade view, Mastery heatmap

### 5. Parent Dashboard
- **File**: `frontend/components/dashboard/ParentDashboard.tsx`
- **Status**: ⚠️ 50% Complete
- **Features**: Multi-child selector, Read-only access, Progress tracking, Messages
- **Missing**: Grade view for children, Calendar view, Notification preferences

### 6. Student Management Dashboard (Teacher Tool)
- **File**: `frontend/components/dashboard/StudentManagementDashboard.tsx`
- **Status**: ✅ 85% Complete
- **Features**: **Advanced highlighting** (4 mistake types), **Pen annotations**, **Practice session tracking**, Voice notes, Mushaf page viewer
- **Missing**: API integration for highlights, Save/load functionality

---

## 📁 EXISTING API ENDPOINTS (32 Found)

### ✅ Authentication (8 endpoints)
- `/api/auth/login` - User login
- `/api/auth/signin` - Alternative signin
- `/api/auth/register-school` - School registration
- `/api/auth/create-school` - Create school
- `/api/auth/create-teacher` - Create teacher
- `/api/auth/create-student-parent` - Create student + parent
- `/api/auth/delete-user-by-email` - Delete user
- `/api/auth/confirm` - Email confirmation

### ✅ User Management (10 endpoints)
- `/api/users` - Get users
- `/api/students` - CRUD students
- `/api/teachers` - CRUD teachers
- `/api/school/create-student` - School-scoped student creation
- `/api/school/create-teacher` - School-scoped teacher creation
- `/api/school/create-parent` - School-scoped parent creation
- `/api/school/update-student` - Update student
- `/api/school/delete-students` - Bulk delete students
- `/api/school/delete-teachers` - Bulk delete teachers
- `/api/school/delete-parents` - Bulk delete parents
- `/api/school/delete-all-users` - Clean slate
- `/api/school/cleanup-orphaned-users` - Cleanup utility

### ✅ Classes (3 endpoints)
- `/api/classes` - CRUD classes
- `/api/classes/[classId]` - Single class operations
- `/api/class-teachers` - Assign teachers to classes

### ⚠️ Partial Features (6 endpoints)
- `/api/annotations/save` - Save highlights (exists but incomplete)
- `/api/annotations/load` - Load highlights
- `/api/annotations/latest` - Get latest
- `/api/notes/add` - Add note to highlight
- `/api/notes/list` - List notes
- `/api/renders/signed-url` - Mushaf renders (thumbnails)

### ⚠️ Utilities (5 endpoints)
- `/api/audit/list` - Audit log
- `/api/import/students` - Bulk import (incomplete)
- `/api/import/teachers` - Bulk import (incomplete)
- `/api/reports/export` - Export reports (incomplete)
- `/api/tajweed/analyze` - Tajweed analysis (incomplete)

---

## ❌ CRITICAL MISSING APIs (40+ Endpoints Needed)

### 1. Assignment Lifecycle (8 endpoints)
```typescript
POST   /api/assignments                    // Create assignment
GET    /api/assignments                    // List with filters
GET    /api/assignments/:id                // Get single
POST   /api/assignments/:id/transition     // Change status
POST   /api/assignments/:id/submit         // Student submission
POST   /api/assignments/:id/reopen         // Reopen for revision
PATCH  /api/assignments/:id                // Update
DELETE /api/assignments/:id                // Delete
```

### 2. Homework System (5 endpoints)
```typescript
POST   /api/homework                       // Create from highlight
GET    /api/homework                       // List with filters
PATCH  /api/homework/:id/status            // Update status (pending→completed)
POST   /api/homework/:id/reply             // Add reply/note
GET    /api/homework/student/:id           // Student's homework
```

### 3. Targets System (7 endpoints)
```typescript
POST   /api/targets                        // Create target
GET    /api/targets                        // List with filters
GET    /api/targets/:id                    // Get single with milestones
PATCH  /api/targets/:id/progress           // Update progress
POST   /api/targets/:id/milestones         // Add milestone
PATCH  /api/targets/milestones/:id         // Complete milestone
DELETE /api/targets/:id                    // Delete target
```

### 4. Gradebook & Rubrics (10 endpoints)
```typescript
POST   /api/rubrics                        // Create rubric
GET    /api/rubrics                        // List school rubrics
POST   /api/rubrics/:id/criteria           // Add criterion
PATCH  /api/rubrics/criteria/:id           // Update criterion
DELETE /api/rubrics/criteria/:id           // Delete criterion
POST   /api/assignments/:id/rubric         // Attach rubric
POST   /api/grades                         // Submit grade
GET    /api/grades/assignment/:id          // Assignment grades
GET    /api/grades/student/:id             // Student all grades
GET    /api/gradebook/export               // Export CSV/PDF
```

### 5. Mastery Tracking (5 endpoints)
```typescript
POST   /api/mastery/upsert                 // Set ayah mastery level
GET    /api/mastery/student/:id            // Student mastery data
GET    /api/mastery/heatmap/:surah         // Surah heatmap
PATCH  /api/mastery/auto-update            // Auto-update on assignment complete
GET    /api/mastery/class/:id              // Class mastery overview
```

### 6. Notifications (6 endpoints)
```typescript
POST   /api/notifications/send             // Create notification
GET    /api/notifications                  // List (paginated)
PATCH  /api/notifications/:id/read         // Mark as read
PATCH  /api/notifications/read-all         // Mark all read
POST   /api/notifications/schedule         // Schedule reminder
GET    /api/notifications/preferences      // Get user preferences
```

### 7. Calendar & Events (5 endpoints)
```typescript
POST   /api/events                         // Create event
GET    /api/events                         // List with date filters
PATCH  /api/events/:id                     // Update event
DELETE /api/events/:id                     // Delete event
GET    /api/events/ical                    // iCal export
```

### 8. Enhanced Messages (4 endpoints)
```typescript
POST   /api/messages/send                  // Send message
POST   /api/messages/:id/reply             // Reply in thread
GET    /api/messages/thread/:id            // Get full thread
POST   /api/messages/:id/attachments       // Add attachments
```

---

## 🎨 CRITICAL MISSING UI COMPONENTS

### 1. Gradebook System (Teacher Dashboard)
- [ ] **Rubric Creator Modal**
  - Form: name, description
  - Criteria table: name, weight, max_score
  - Add/remove criteria dynamically

- [ ] **Attach Rubric to Assignment**
  - Rubric selector dropdown
  - Preview rubric criteria
  - Confirm attachment

- [ ] **Grade Submission Interface**
  - Student list for assignment
  - Rubric criteria scoring table
  - Per-criterion score input
  - Comments field
  - Bulk grade entry

- [ ] **Student Gradebook View** (Student Dashboard)
  - Assignment list with grades
  - Per-criterion breakdown
  - Overall score calculation
  - Teacher comments

- [ ] **Parent Gradebook View** (Parent Dashboard)
  - Child selector
  - Grade history table
  - Performance trends chart

### 2. Calendar Component (All Dashboards)
- [ ] **Full Calendar View**
  - Month/Week/Day views
  - Event markers
  - Color coding by type
  - Click to view details

- [ ] **Create Event Modal** (School/Teacher)
  - Title, description
  - Date/time pickers
  - All-day toggle
  - Class assignment (optional)
  - Recurrence rules

- [ ] **Event List View**
  - Upcoming events
  - Past events
  - Filter by type/class
  - Quick actions

### 3. Mastery Tracking (Student/Teacher Dashboards)
- [ ] **Per-Surah Ayah Mastery Heatmap**
  - Grid layout (ayah numbers)
  - 4-color coding: unknown (gray), learning (yellow), proficient (orange), mastered (green)
  - Clickable ayahs
  - Progress percentage

- [ ] **Teacher Update Mastery Interface**
  - Student selector
  - Surah/Ayah selector
  - Mastery level dropdown
  - Bulk update option

- [ ] **Student Progress Visualization**
  - Mastery stats dashboard
  - Progress charts
  - Recent achievements
  - Next milestones

### 4. Assignment System Enhancements
- [ ] **Assignment Creation Modal** (Teacher Dashboard)
  - Student/class selector
  - Title, description
  - Due date picker with validation
  - Attachment uploader
  - Rubric assignment

- [ ] **Assignment Submission Flow** (Student Dashboard)
  - Text input area
  - File uploader (images, PDF, docx, audio)
  - Preview before submit
  - Submit confirmation

- [ ] **Assignment Review Interface** (Teacher Dashboard)
  - Student submission view
  - Inline commenting
  - Grade assignment
  - Status transition buttons
  - Reopen option

### 5. Notification Center
- [ ] **Notification Dropdown** (All Dashboards)
  - Unread count badge
  - Notification list (recent 10)
  - Mark as read
  - See all link

- [ ] **Notification Preferences Modal**
  - Channel toggles (in-app/email/push)
  - Notification type filters
  - Quiet hours setting
  - Save preferences

### 6. Parent-Student Linking (School Dashboard)
- [ ] **Link Student to Parent Modal**
  - Parent selector (search)
  - Student multi-selector
  - Relationship type
  - Confirm linking

- [ ] **Parent View Student List**
  - Linked students table
  - Unlink action
  - Add student action

### 7. Bulk Upload (School Dashboard)
- [ ] **CSV Upload Modal**
  - File drop zone
  - Template download
  - CSV preview table
  - Validation errors
  - Import confirmation

---

## 🗄️ DATABASE ASSESSMENT

### ✅ Complete Tables (35/35)
All required tables exist with proper structure:
- **Tenancy**: schools ✅
- **Users**: profiles, teachers, students, parents, parent_students ✅
- **Classes**: classes, class_teachers, class_enrollments, attendance ✅
- **Quran**: quran_scripts, quran_ayahs, mushaf_pages ✅
- **Highlights**: highlights, notes, pen_annotations ✅
- **Assignments**: assignments, assignment_events, assignment_submissions, assignment_attachments ✅
- **Homework**: homework ✅
- **Targets**: targets, target_students, target_milestones ✅
- **Practice**: practice_logs ✅
- **Mastery**: ayah_mastery ✅
- **Grading**: rubrics, rubric_criteria, assignment_rubrics, grades ✅
- **Communication**: messages, notifications, calendar_events ✅
- **System**: devices, activity_logs, school_settings ✅

### ✅ RLS Policies
All tables have RLS enabled (except reference data like quran_scripts)

### ⚠️ Missing Storage Buckets
```sql
-- Need to create in Supabase
CREATE BUCKET voice-notes;
CREATE BUCKET attachments;
CREATE BUCKET mushaf-renders;

-- Set policies
ALTER BUCKET voice-notes SET PUBLIC false;
ALTER BUCKET attachments SET PUBLIC false;
ALTER BUCKET mushaf-renders SET PUBLIC true;
```

---

## 🚀 IMPLEMENTATION PLAN (9 Phases)

### **Phase 1: Assignment Lifecycle APIs** ⏱️ 2-3 days
**Priority**: CRITICAL
**Dependencies**: None

Tasks:
1. Create `/api/assignments` (POST, GET)
2. Create `/api/assignments/:id/transition` (status changes)
3. Create `/api/assignments/:id/submit` (student submission)
4. Create `/api/assignments/:id/reopen` (reopen logic)
5. Add validation for status transitions
6. Add late flag calculation
7. Test assignment lifecycle flow

### **Phase 2: Homework & Targets APIs** ⏱️ 2 days
**Priority**: CRITICAL
**Dependencies**: Phase 1 (assignments)

Tasks:
1. Create `/api/homework` (POST, GET, PATCH)
2. Link homework to highlights
3. Implement green→gold transition logic
4. Create `/api/targets` (full CRUD)
5. Implement progress calculation
6. Add milestone management
7. Test homework assignment flow

### **Phase 3: Gradebook APIs** ⏱️ 3 days
**Priority**: HIGH
**Dependencies**: Phase 1 (assignments)

Tasks:
1. Create `/api/rubrics` (CRUD)
2. Create `/api/rubrics/:id/criteria` (manage criteria)
3. Create `/api/assignments/:id/rubric` (attach rubric)
4. Create `/api/grades` (submit grades)
5. Implement grade calculation logic
6. Add export endpoint (CSV)
7. Test complete grading workflow

### **Phase 4: Mastery Tracking APIs** ⏱️ 2 days
**Priority**: HIGH
**Dependencies**: Phase 1 (assignments)

Tasks:
1. Create `/api/mastery/upsert` (set mastery level)
2. Create `/api/mastery/student/:id` (get student data)
3. Create `/api/mastery/heatmap/:surah` (surah heatmap)
4. Implement auto-update on assignment complete
5. Add mastery level validation
6. Test mastery tracking flow

### **Phase 5: Notification System** ⏱️ 3-4 days
**Priority**: HIGH
**Dependencies**: Phases 1-4 (trigger events)

Tasks:
1. Create `/api/notifications` (CRUD)
2. Implement in-app notifications
3. Set up email service (Resend or SendGrid)
4. Set up push notifications (OneSignal or Firebase)
5. Create notification scheduler (Supabase Edge Function)
6. Implement reminder logic (24h before, on due, 24h after)
7. Add notification preferences
8. Test notification delivery

### **Phase 6: Missing UI Components** ⏱️ 4-5 days
**Priority**: HIGH
**Dependencies**: Phases 1-5 (APIs)

Tasks:
1. Build Gradebook UI components
2. Build Calendar component
3. Build Mastery Heatmap
4. Build Assignment creation/submission UI
5. Build Notification center
6. Build Parent-student linking
7. Build CSV bulk upload
8. Wire all components to APIs

### **Phase 7: PWA Implementation** ⏱️ 2-3 days
**Priority**: MEDIUM
**Dependencies**: Phase 6 (UI complete)

Tasks:
1. Create service worker (`frontend/src/service-worker.ts`)
2. Implement precache strategy (shell, manifest, fonts)
3. Implement Quran text caching (StaleWhileRevalidate)
4. Implement voice note caching (CacheFirst)
5. Add offline fallback pages
6. Register service worker in app layout
7. Test offline functionality

### **Phase 8: Frontend-Backend Integration** ⏱️ 3-4 days
**Priority**: CRITICAL
**Dependencies**: Phases 1-7

Tasks:
1. Connect all dashboards to real APIs
2. Replace mock data with Supabase calls
3. Add loading states
4. Add error handling
5. Implement optimistic updates
6. Add retry logic
7. Test complete user flows

### **Phase 9: Production Validation** ⏱️ 2-3 days
**Priority**: CRITICAL
**Dependencies**: Phase 8

Tasks:
1. End-to-end testing (all user roles)
2. Performance optimization
3. Security audit
4. RLS policy testing
5. Mobile responsiveness testing
6. Cross-browser testing
7. Load testing
8. Production deployment checklist

---

## 📋 FEATURE COMPLETION STATUS

| Feature | DB | API | UI | Status | Priority |
|---------|----|----|-----|--------|----------|
| **Quran Highlights** | ✅ | ⚠️ | ✅ | 85% | HIGH |
| **Homework System** | ✅ | ❌ | ✅ | 60% | HIGH |
| **Targets System** | ✅ | ❌ | ✅ | 60% | HIGH |
| **Auth & Users** | ✅ | ✅ | ⚠️ | 70% | MEDIUM |
| **Assignment Lifecycle** | ✅ | ❌ | ⚠️ | 40% | CRITICAL |
| **Messaging** | ✅ | ⚠️ | ⚠️ | 35% | MEDIUM |
| **Gradebook** | ✅ | ❌ | ❌ | 10% | HIGH |
| **Mastery Tracking** | ✅ | ❌ | ❌ | 15% | HIGH |
| **Notifications** | ✅ | ❌ | ⚠️ | 10% | HIGH |
| **Calendar** | ✅ | ❌ | ❌ | 10% | MEDIUM |
| **PWA Offline** | ❌ | ❌ | ❌ | 5% | MEDIUM |

---

## ⏱️ ESTIMATED TIMELINE

- **Phase 1-2** (APIs Critical): 4-5 days
- **Phase 3-4** (APIs High): 5 days
- **Phase 5** (Notifications): 3-4 days
- **Phase 6** (UI Components): 4-5 days
- **Phase 7** (PWA): 2-3 days
- **Phase 8** (Integration): 3-4 days
- **Phase 9** (Validation): 2-3 days

**Total**: 23-29 days (1 month intensive development)

---

## 🎯 SUCCESS CRITERIA

### Must Have (Production Launch)
- ✅ All 5 dashboards fully functional
- ✅ Complete assignment lifecycle
- ✅ Homework & targets system working
- ✅ Gradebook with rubrics
- ✅ Mastery tracking with heatmaps
- ✅ In-app notifications
- ✅ Calendar with events
- ✅ All RLS policies tested
- ✅ Mobile responsive

### Should Have (Post-Launch)
- ⚠️ Email notifications
- ⚠️ Push notifications
- ⚠️ PWA offline mode
- ⚠️ CSV bulk import
- ⚠️ Advanced reporting
- ⚠️ iCal integration

### Nice to Have (Future)
- ⏳ AI Tajweed auto-scoring
- ⏳ Reciter audio playback
- ⏳ Payments/billing
- ⏳ Calendar sync (Google/Outlook)

---

## 🔒 SECURITY CHECKLIST

- [x] RLS enabled on all tables
- [x] School_id isolation implemented
- [x] Authentication required for all routes
- [ ] Rate limiting on APIs
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF tokens
- [ ] Secure file uploads
- [ ] API key rotation
- [ ] Environment variables secured

---

## 📝 NEXT STEPS

**IMMEDIATE ACTION**: Start Phase 1 - Assignment Lifecycle APIs

**Command**:
```bash
cd frontend/app/api
mkdir -p assignments/[id]
# Create: assignments/route.ts, assignments/[id]/transition/route.ts, etc.
```

**Remember**: Save progress to memory after each phase completion.

---

**END OF ANALYSIS** | Next: Begin Implementation Phase 1
