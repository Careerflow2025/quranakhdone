# Phase 2 API Testing Guide
## Homework & Targets API Endpoints

**Created**: 2025-10-20
**Purpose**: Comprehensive testing documentation for Phase 2 Homework and Targets APIs
**Status**: Ready for testing when endpoints are deployed

---

## Table of Contents

1. [Homework API Testing](#homework-api-testing)
   - [Workflow Tests](#homework-workflow-tests)
   - [Endpoint Tests](#homework-endpoint-tests)
   - [Edge Cases](#homework-edge-cases)
2. [Targets API Testing](#targets-api-testing)
   - [Workflow Tests](#targets-workflow-tests)
   - [Endpoint Tests](#targets-endpoint-tests)
   - [Edge Cases](#targets-edge-cases)
3. [Integration Tests](#integration-tests)
4. [Performance Tests](#performance-tests)
5. [Security Tests](#security-tests)

---

## Homework API Testing

### Test Environment Setup

**Prerequisites**:
- Authenticated users: Teacher (with teacher record), Student (with student record), Admin, Owner
- School context: All users belong to same school for valid operations
- Database: highlights table with proper indexes, notes table available
- Supabase client: Configured with RLS policies enabled

**Test Data**:
```json
{
  "teacher": {
    "user_id": "teacher-uuid-1",
    "school_id": "school-uuid-1",
    "teacher_id": "teacher-record-uuid-1",
    "role": "teacher",
    "display_name": "Test Teacher"
  },
  "student": {
    "user_id": "student-uuid-1",
    "school_id": "school-uuid-1",
    "student_id": "student-record-uuid-1",
    "role": "student",
    "display_name": "Test Student"
  },
  "homework_data": {
    "surah": 2,
    "ayah_start": 1,
    "ayah_end": 5,
    "page_number": 2,
    "type": "memorization",
    "note": "Please focus on tajweed rules"
  }
}
```

---

### Homework Workflow Tests

#### HW-WORKFLOW-01: Complete Homework Lifecycle (Happy Path)

**Scenario**: Teacher creates homework, student receives notification, teacher marks complete

**Steps**:
1. **Create Homework** - `POST /api/homework`
   ```bash
   curl -X POST http://localhost:3000/api/homework \
     -H "Authorization: Bearer {teacher_token}" \
     -H "Content-Type: application/json" \
     -d '{
       "student_id": "student-record-uuid-1",
       "surah": 2,
       "ayah_start": 1,
       "ayah_end": 5,
       "page_number": 2,
       "type": "memorization",
       "note": "Focus on tajweed"
     }'
   ```

   **Expected Response** (201):
   ```json
   {
     "success": true,
     "homework": {
       "id": "homework-uuid-1",
       "school_id": "school-uuid-1",
       "teacher_id": "teacher-record-uuid-1",
       "student_id": "student-record-uuid-1",
       "surah": 2,
       "ayah_start": 1,
       "ayah_end": 5,
       "page_number": 2,
       "color": "green",
       "status": "pending",
       "type": "memorization",
       "note": "Focus on tajweed",
       "completed_at": null,
       "completed_by": null,
       "created_at": "2025-10-20T10:00:00Z"
     },
     "message": "Homework created successfully"
   }
   ```

2. **Verify Notifications Created**
   - Query notifications table for student_user_id
   - Should have 2 notifications: in_app and email
   - Verify payload contains homework details

3. **List Student Homework** - `GET /api/homework/student/{student_id}`
   ```bash
   curl http://localhost:3000/api/homework/student/student-record-uuid-1 \
     -H "Authorization: Bearer {student_token}"
   ```

   **Expected Response** (200):
   ```json
   {
     "success": true,
     "student_id": "student-record-uuid-1",
     "pending_homework": [
       {
         "id": "homework-uuid-1",
         "color": "green",
         "status": "pending",
         "surah": 2,
         "ayah_start": 1,
         "ayah_end": 5
       }
     ],
     "completed_homework": [],
     "stats": {
       "total_pending": 1,
       "total_completed": 0,
       "completion_rate": 0
     }
   }
   ```

4. **Add Teacher Note** - `POST /api/homework/{id}/reply`
   ```bash
   curl -X POST http://localhost:3000/api/homework/homework-uuid-1/reply \
     -H "Authorization: Bearer {teacher_token}" \
     -H "Content-Type: application/json" \
     -d '{
       "type": "text",
       "text": "Great progress on the first 3 ayahs!"
     }'
   ```

   **Expected Response** (201):
   ```json
   {
     "success": true,
     "note": {
       "id": "note-uuid-1",
       "highlight_id": "homework-uuid-1",
       "author_user_id": "teacher-uuid-1",
       "type": "text",
       "text": "Great progress on the first 3 ayahs!",
       "created_at": "2025-10-20T10:30:00Z"
     },
     "message": "Note added successfully"
   }
   ```

5. **Complete Homework** - `PATCH /api/homework/{id}/complete`
   ```bash
   curl -X PATCH http://localhost:3000/api/homework/homework-uuid-1/complete \
     -H "Authorization: Bearer {teacher_token}" \
     -H "Content-Type: application/json" \
     -d '{
       "completion_note": "Excellent recitation! Well done."
     }'
   ```

   **Expected Response** (200):
   ```json
   {
     "success": true,
     "homework": {
       "id": "homework-uuid-1",
       "color": "gold",
       "status": "completed",
       "previous_color": "green",
       "completed_at": "2025-10-20T11:00:00Z",
       "completed_by": "teacher-uuid-1",
       "note": "Focus on tajweed\n\nCompletion note: Excellent recitation! Well done."
     },
     "message": "Homework completed successfully",
     "previous_color": "green",
     "new_color": "gold"
   }
   ```

6. **Verify Final State**
   - Query student homework again
   - Should show 0 pending, 1 completed
   - Completion rate should be 100%
   - Verify 2 new notifications created for completion

**Success Criteria**:
- ✅ Homework created with green color
- ✅ Notifications sent to student (2 notifications)
- ✅ Student can view pending homework
- ✅ Teacher can add notes
- ✅ Homework completed with gold color transition
- ✅ Completion notifications sent
- ✅ Statistics updated correctly

---

#### HW-WORKFLOW-02: Multiple Homework Lifecycle

**Scenario**: Teacher creates multiple homework assignments for same student

**Steps**:
1. Create 3 homework assignments with different surahs
2. Complete 2 out of 3
3. Verify statistics show 33.33% pending, 66.67% completed
4. List all homework for student
5. Verify filtering by status works

**Expected Outcomes**:
- All 3 homework created successfully
- 2 marked as completed (gold), 1 remains pending (green)
- Student statistics accurate
- Notifications sent for each create and complete action

---

#### HW-WORKFLOW-03: Cross-School Isolation Test

**Scenario**: Verify teachers cannot create homework for students in different schools

**Steps**:
1. Teacher from School A attempts to create homework for Student from School B
2. Should receive 403 Forbidden error
3. Verify no homework created in database

**Expected Response** (403):
```json
{
  "success": false,
  "error": "Cannot create homework for student in different school",
  "code": "FORBIDDEN"
}
```

---

### Homework Endpoint Tests

#### POST /api/homework - Create Homework

**Test Cases**:

| Test ID | Scenario | Auth | Data | Expected Status | Expected Response |
|---------|----------|------|------|-----------------|-------------------|
| HW-POST-01 | Valid creation | Teacher | Valid homework data | 201 | Homework created with green color |
| HW-POST-02 | Missing auth | None | Valid data | 401 | Unauthorized |
| HW-POST-03 | Student creates | Student | Valid data | 403 | Teacher profile not found |
| HW-POST-04 | Invalid surah (0) | Teacher | surah=0 | 400 | Validation error: surah 1-114 |
| HW-POST-05 | Invalid surah (115) | Teacher | surah=115 | 400 | Validation error: surah 1-114 |
| HW-POST-06 | ayah_end < ayah_start | Teacher | ayah_start=5, ayah_end=3 | 400 | Validation error: ayah_end >= ayah_start |
| HW-POST-07 | Range too large (>10) | Teacher | ayah_start=1, ayah_end=15 | 400 | Max 10 ayahs per homework |
| HW-POST-08 | Missing student_id | Teacher | No student_id | 400 | Validation error: required field |
| HW-POST-09 | Non-existent student | Teacher | student_id="fake-uuid" | 404 | Student not found |
| HW-POST-10 | Different school student | Teacher | student from School B | 403 | Cannot create for different school |
| HW-POST-11 | Very long note (>2000) | Teacher | note with 2001 chars | 400 | Note exceeds max length |
| HW-POST-12 | Optional fields omitted | Teacher | Only required fields | 201 | Created with defaults |
| HW-POST-13 | All optional fields | Teacher | All fields populated | 201 | Created with all data |

---

#### GET /api/homework - List Homework

**Test Cases**:

| Test ID | Scenario | Auth | Query Params | Expected Status | Expected Response |
|---------|----------|------|--------------|-----------------|-------------------|
| HW-GET-01 | List all homework | Teacher | None | 200 | All homework for teacher's school |
| HW-GET-02 | Filter by student | Teacher | student_id=uuid | 200 | Only that student's homework |
| HW-GET-03 | Filter by status | Teacher | status=pending | 200 | Only green homework |
| HW-GET-04 | Filter by surah | Teacher | surah=2 | 200 | Only Surah 2 homework |
| HW-GET-05 | Filter by page | Teacher | page_number=5 | 200 | Only page 5 homework |
| HW-GET-06 | Pagination | Teacher | page=2&limit=10 | 200 | Second page of results |
| HW-GET-07 | Sort by created_at desc | Teacher | sort_by=created_at&sort_order=desc | 200 | Newest first |
| HW-GET-08 | Include completed | Teacher | include_completed=true | 200 | Both green and gold |
| HW-GET-09 | Student access | Student | None | 200 | Only their own homework |
| HW-GET-10 | Cross-school isolation | Teacher A | student from School B | 200 | Empty results (RLS blocks) |

---

#### PATCH /api/homework/:id/complete - Complete Homework

**Test Cases**:

| Test ID | Scenario | Auth | Homework State | Data | Expected Status | Expected Response |
|---------|----------|------|----------------|------|-----------------|-------------------|
| HW-COMP-01 | Valid completion | Teacher | Green (pending) | Optional note | 200 | Color changed to gold |
| HW-COMP-02 | Already completed | Teacher | Gold (completed) | None | 400 | Already completed error |
| HW-COMP-03 | Not homework | Teacher | Purple (tajweed) | None | 400 | Not homework error |
| HW-COMP-04 | Missing auth | None | Green | None | 401 | Unauthorized |
| HW-COMP-05 | Student completes | Student | Green | None | 403 | Forbidden |
| HW-COMP-06 | Non-existent ID | Teacher | N/A | None | 404 | Homework not found |
| HW-COMP-07 | Different school | Teacher A | School B homework | None | 200 | Empty (RLS blocks query) |
| HW-COMP-08 | With completion note | Teacher | Green | "Great job!" | 200 | Note appended to homework.note |
| HW-COMP-09 | Admin completes | Admin | Green | None | 200 | Completed successfully |
| HW-COMP-10 | Owner completes | Owner | Green | None | 200 | Completed successfully |

---

#### POST /api/homework/:id/reply - Add Note

**Test Cases**:

| Test ID | Scenario | Auth | Data | Expected Status | Expected Response |
|---------|----------|------|------|-----------------|-------------------|
| HW-NOTE-01 | Text note | Teacher | type=text, text="Good" | 201 | Note created |
| HW-NOTE-02 | Audio note | Teacher | type=audio, audio_url | 201 | Note created |
| HW-NOTE-03 | Missing type | Teacher | No type | 400 | Validation error |
| HW-NOTE-04 | Text without text field | Teacher | type=text (no text) | 400 | Validation error |
| HW-NOTE-05 | Audio without URL | Teacher | type=audio (no URL) | 400 | Validation error |
| HW-NOTE-06 | Student adds note | Student | Valid text note | 403 | Forbidden |
| HW-NOTE-07 | Very long text (>2000) | Teacher | 2001 char text | 400 | Exceeds max length |
| HW-NOTE-08 | Non-existent homework | Teacher | Valid data | 404 | Homework not found |
| HW-NOTE-09 | Different school homework | Teacher A | School B homework | 200 | Empty (RLS blocks) |
| HW-NOTE-10 | Multiple notes | Teacher | 3 sequential notes | 201 each | All 3 notes created |

---

#### GET /api/homework/student/:id - Student Homework Summary

**Test Cases**:

| Test ID | Scenario | Auth | Student State | Expected Status | Expected Response |
|---------|----------|------|---------------|-----------------|-------------------|
| HW-STU-01 | Student's own homework | Student | 3 pending, 2 completed | 200 | Full summary with stats |
| HW-STU-02 | Teacher views student | Teacher | Same school | 200 | Full summary |
| HW-STU-03 | Admin views student | Admin | Same school | 200 | Full summary |
| HW-STU-04 | Parent views child | Parent | Linked student | 200 | Full summary |
| HW-STU-05 | Cross-school access | Teacher A | School B student | 200 | Empty (RLS blocks) |
| HW-STU-06 | Student with no homework | Student | 0 homework | 200 | Empty lists, 0 stats |
| HW-STU-07 | Student with notes | Student | Homework has 3 notes | 200 | Notes included with teacher info |
| HW-STU-08 | Non-existent student | Teacher | Fake UUID | 404 | Student not found |
| HW-STU-09 | Verify statistics | Student | 5 pending, 5 completed | 200 | 50% completion rate |
| HW-STU-10 | Verify ayah counts | Student | Multiple homework | 200 | Accurate ayah totals |

---

### Homework Edge Cases

#### HW-EDGE-01: Rapid Completion Attempts
- **Scenario**: Teacher clicks complete button multiple times rapidly
- **Expected**: First request succeeds (200), subsequent requests fail (400 already completed)
- **Verification**: Only one completion event in database

#### HW-EDGE-02: Concurrent Note Addition
- **Scenario**: Multiple teachers add notes to same homework simultaneously
- **Expected**: All notes saved successfully, no data loss
- **Verification**: All notes present in database with correct timestamps

#### HW-EDGE-03: Large Batch Creation
- **Scenario**: Teacher creates 50 homework assignments in quick succession
- **Expected**: All created successfully, all notifications sent
- **Verification**: 50 homework records, 100 notifications (50 × 2 channels)

#### HW-EDGE-04: Unicode and Special Characters
- **Scenario**: Notes contain Arabic text, emojis, special characters
- **Expected**: All characters preserved correctly
- **Verification**: Retrieved text matches input exactly

#### HW-EDGE-05: Boundary Value - Exactly 10 Ayahs
- **Scenario**: Create homework with ayah_start=1, ayah_end=10
- **Expected**: Created successfully (exactly at limit)
- **Verification**: Homework created with 10 ayah range

---

## Targets API Testing

### Test Environment Setup

**Prerequisites**:
- Same as Homework + classes table, target_students table (when available)
- Test data includes individual, class, and school type targets

**Test Data**:
```json
{
  "individual_target": {
    "title": "Memorize Surah Al-Baqarah",
    "description": "Complete memorization with tajweed",
    "type": "individual",
    "category": "memorization",
    "student_id": "student-record-uuid-1",
    "due_date": "2025-12-31T23:59:59Z",
    "milestones": [
      {
        "title": "Complete Juz 1",
        "description": "Ayahs 1-141",
        "target_value": 141,
        "order": 1
      },
      {
        "title": "Complete Juz 2",
        "description": "Ayahs 142-252",
        "target_value": 111,
        "order": 2
      }
    ]
  },
  "class_target": {
    "title": "Class Quran Completion Goal",
    "description": "Entire class completes Juz 30",
    "type": "class",
    "category": "quran_completion",
    "class_id": "class-uuid-1",
    "due_date": "2025-06-30T23:59:59Z"
  },
  "school_target": {
    "title": "School-wide Attendance Goal",
    "description": "95% attendance rate",
    "type": "school",
    "category": "attendance",
    "target_value": 95,
    "due_date": "2025-12-31T23:59:59Z"
  }
}
```

---

### Targets Workflow Tests

#### TGT-WORKFLOW-01: Complete Individual Target Lifecycle

**Scenario**: Teacher creates individual target with milestones, tracks progress, marks complete

**Steps**:
1. **Create Individual Target** - `POST /api/targets`
   ```bash
   curl -X POST http://localhost:3000/api/targets \
     -H "Authorization: Bearer {teacher_token}" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Memorize Surah Al-Baqarah",
       "description": "Complete with tajweed",
       "type": "individual",
       "category": "memorization",
       "student_id": "student-record-uuid-1",
       "due_date": "2025-12-31T23:59:59Z",
       "milestones": [
         {
           "title": "Complete Juz 1",
           "target_value": 141,
           "order": 1
         },
         {
           "title": "Complete Juz 2",
           "target_value": 111,
           "order": 2
         }
       ]
     }'
   ```

   **Expected Response** (201):
   ```json
   {
     "success": true,
     "target": {
       "id": "target-uuid-1",
       "school_id": "school-uuid-1",
       "teacher_id": "teacher-record-uuid-1",
       "title": "Memorize Surah Al-Baqarah",
       "type": "individual",
       "category": "memorization",
       "status": "active",
       "due_date": "2025-12-31T23:59:59Z",
       "milestones": [
         {
           "id": "milestone-uuid-1",
           "title": "Complete Juz 1",
           "target_value": 141,
           "current_value": 0,
           "completed": false,
           "order": 1
         },
         {
           "id": "milestone-uuid-2",
           "title": "Complete Juz 2",
           "target_value": 111,
           "current_value": 0,
           "completed": false,
           "order": 2
         }
       ],
       "progress_percentage": 0,
       "stats": {
         "total_milestones": 2,
         "completed_milestones": 0,
         "progress_percentage": 0
       }
     },
     "message": "Target created successfully"
   }
   ```

2. **Get Single Target** - `GET /api/targets/{id}`
   ```bash
   curl http://localhost:3000/api/targets/target-uuid-1 \
     -H "Authorization: Bearer {teacher_token}"
   ```

   **Expected Response** (200):
   - Full target details with all milestones
   - Teacher information
   - Student information
   - Statistics showing 0% progress

3. **Complete First Milestone** - `PATCH /api/targets/milestones/{id}`
   ```bash
   curl -X PATCH http://localhost:3000/api/targets/milestones/milestone-uuid-1 \
     -H "Authorization: Bearer {teacher_token}" \
     -H "Content-Type: application/json" \
     -d '{
       "current_value": 141
     }'
   ```

   **Expected Response** (200):
   ```json
   {
     "success": true,
     "milestone": {
       "id": "milestone-uuid-1",
       "completed": true,
       "completed_at": "2025-10-20T12:00:00Z",
       "completed_by": "teacher-uuid-1",
       "current_value": 141
     },
     "target_id": "target-uuid-1",
     "message": "Milestone completed successfully",
     "previous_progress": 0,
     "new_progress": 50
   }
   ```

4. **Verify Progress Updated**
   - Target progress_percentage should be 50% (1 of 2 milestones)
   - Notification sent to student

5. **Add Another Milestone** - `POST /api/targets/{id}/milestones`
   ```bash
   curl -X POST http://localhost:3000/api/targets/target-uuid-1/milestones \
     -H "Authorization: Bearer {teacher_token}" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Complete Juz 3",
       "target_value": 200,
       "order": 3
     }'
   ```

   **Expected Response** (201):
   - New milestone added
   - Progress recalculated to 33% (1 of 3 milestones)

6. **Update Progress Manually** - `PATCH /api/targets/{id}/progress`
   ```bash
   curl -X PATCH http://localhost:3000/api/targets/target-uuid-1/progress \
     -H "Authorization: Bearer {teacher_token}" \
     -H "Content-Type: application/json" \
     -d '{
       "progress_percentage": 75
     }'
   ```

   **Expected Response** (200):
   - Progress updated to 75%
   - Previous progress returned

7. **Complete Target** - `PATCH /api/targets/{id}/progress`
   ```bash
   curl -X PATCH http://localhost:3000/api/targets/target-uuid-1/progress \
     -H "Authorization: Bearer {teacher_token}" \
     -H "Content-Type: application/json" \
     -d '{
       "status": "completed"
     }'
   ```

   **Expected Response** (200):
   ```json
   {
     "success": true,
     "target": {
       "status": "completed",
       "completed_at": "2025-10-20T13:00:00Z",
       "progress_percentage": 100
     },
     "message": "Target completed successfully"
   }
   ```

8. **Verify Final State**
   - Target status = completed
   - Progress = 100%
   - Completion notification sent
   - completed_at timestamp set

**Success Criteria**:
- ✅ Individual target created with student_id
- ✅ Milestones created and stored
- ✅ Milestone completion updates target progress
- ✅ Can add milestones after creation
- ✅ Manual progress updates work
- ✅ Target can be marked completed
- ✅ All notifications sent properly

---

#### TGT-WORKFLOW-02: Class Target Lifecycle

**Scenario**: Teacher creates class-wide target, manages progress

**Steps**:
1. Create class target with class_id
2. Verify all students in class can view it
3. Add milestones
4. Complete milestones
5. Verify all class students receive notifications

**Expected Outcomes**:
- Class target created successfully
- All class students see the target
- Progress tracked at class level
- Notifications sent to all students in class

---

#### TGT-WORKFLOW-03: School Target Lifecycle

**Scenario**: Admin creates school-wide target

**Steps**:
1. Admin creates school target (no student_id or class_id)
2. All users in school can view it
3. Track progress at school level
4. Complete target

**Expected Outcomes**:
- School target created without student/class constraints
- Visible to all school users
- Progress managed by admins/teachers

---

#### TGT-WORKFLOW-04: Target Cancellation

**Scenario**: Teacher cancels an active target

**Steps**:
1. Create active target
2. Update status to "cancelled"
3. Verify cannot complete cancelled target
4. Verify cannot add milestones to cancelled target

**Expected Outcomes**:
- Status transitions to cancelled
- Further modifications prevented
- Notifications sent about cancellation

---

### Targets Endpoint Tests

#### POST /api/targets - Create Target

**Test Cases**:

| Test ID | Scenario | Auth | Data | Expected Status | Expected Response |
|---------|----------|------|------|-----------------|-------------------|
| TGT-POST-01 | Individual target | Teacher | Valid with student_id | 201 | Target created |
| TGT-POST-02 | Class target | Teacher | Valid with class_id | 201 | Target created |
| TGT-POST-03 | School target | Admin | No student/class | 201 | Target created |
| TGT-POST-04 | Missing auth | None | Valid data | 401 | Unauthorized |
| TGT-POST-05 | Student creates | Student | Valid data | 403 | Teacher profile not found |
| TGT-POST-06 | Individual without student_id | Teacher | type=individual, no student_id | 400 | student_id required |
| TGT-POST-07 | Class without class_id | Teacher | type=class, no class_id | 400 | class_id required |
| TGT-POST-08 | School with student_id | Teacher | type=school, has student_id | 400 | School targets shouldn't have student/class |
| TGT-POST-09 | Title too long (>200) | Teacher | 201 char title | 400 | Title exceeds max |
| TGT-POST-10 | Description too long | Teacher | 2001 char description | 400 | Description exceeds max |
| TGT-POST-11 | 21 milestones | Teacher | 21 milestones array | 400 | Max 20 milestones |
| TGT-POST-12 | start_date after due_date | Teacher | start > due | 400 | start_date must be before due_date |
| TGT-POST-13 | Different school student | Teacher A | School B student_id | 403 | Cannot create for different school |
| TGT-POST-14 | Different school class | Teacher A | School B class_id | 403 | Cannot create for different school |
| TGT-POST-15 | With milestones | Teacher | 5 milestones | 201 | All milestones created |

---

#### GET /api/targets - List Targets

**Test Cases**:

| Test ID | Scenario | Auth | Query Params | Expected Status | Expected Response |
|---------|----------|------|--------------|-----------------|-------------------|
| TGT-LIST-01 | All targets | Teacher | None | 200 | School's targets |
| TGT-LIST-02 | Filter by student | Teacher | student_id=uuid | 200 | Individual targets only |
| TGT-LIST-03 | Filter by class | Teacher | class_id=uuid | 200 | Class targets only |
| TGT-LIST-04 | Filter by teacher | Teacher | teacher_id=uuid | 200 | That teacher's targets |
| TGT-LIST-05 | Filter by type | Teacher | type=individual | 200 | Individual targets only |
| TGT-LIST-06 | Filter by status | Teacher | status=active | 200 | Active targets only |
| TGT-LIST-07 | Filter by category | Teacher | category=memorization | 200 | Memorization targets only |
| TGT-LIST-08 | Include completed | Teacher | include_completed=true | 200 | All statuses |
| TGT-LIST-09 | Default excludes completed | Teacher | None | 200 | Active targets only |
| TGT-LIST-10 | Pagination | Teacher | page=2&limit=10 | 200 | Second page |
| TGT-LIST-11 | Sort by due_date | Teacher | sort_by=due_date&sort_order=asc | 200 | Earliest due first |
| TGT-LIST-12 | Sort by created_at | Teacher | sort_by=created_at&sort_order=desc | 200 | Newest first |
| TGT-LIST-13 | Student views | Student | None | 200 | Only their individual + class/school targets |
| TGT-LIST-14 | Cross-school isolation | Teacher A | None | 200 | Only School A targets (RLS) |

---

#### GET /api/targets/:id - Get Single Target

**Test Cases**:

| Test ID | Scenario | Auth | Target Type | Expected Status | Expected Response |
|---------|----------|------|-------------|-----------------|-------------------|
| TGT-GET-01 | Get individual target | Teacher | Individual | 200 | Full details + student info |
| TGT-GET-02 | Get class target | Teacher | Class | 200 | Full details + class info |
| TGT-GET-03 | Get school target | Admin | School | 200 | Full details |
| TGT-GET-04 | Student views own | Student | Individual (theirs) | 200 | Full details |
| TGT-GET-05 | Student views class | Student | Class (enrolled) | 200 | Full details |
| TGT-GET-06 | Student views school | Student | School | 200 | Full details |
| TGT-GET-07 | Non-existent ID | Teacher | N/A | 404 | Target not found |
| TGT-GET-08 | Different school | Teacher A | School B target | 200 | Empty (RLS blocks) |
| TGT-GET-09 | With milestones | Teacher | Has 5 milestones | 200 | All milestones included |
| TGT-GET-10 | Verify statistics | Teacher | Mixed milestones | 200 | Accurate stats (progress, counts) |

---

#### PATCH /api/targets/:id/progress - Update Progress

**Test Cases**:

| Test ID | Scenario | Auth | Current Status | Data | Expected Status | Expected Response |
|---------|----------|------|----------------|------|-----------------|-------------------|
| TGT-PROG-01 | Update percentage | Teacher | active | progress_percentage=50 | 200 | Progress updated |
| TGT-PROG-02 | Complete target | Teacher | active | status=completed | 200 | Status changed, progress=100 |
| TGT-PROG-03 | Cancel target | Teacher | active | status=cancelled | 200 | Status changed |
| TGT-PROG-04 | Complete already completed | Teacher | completed | status=completed | 400 | Already completed |
| TGT-PROG-05 | Complete cancelled | Teacher | cancelled | status=completed | 400 | Cannot complete cancelled |
| TGT-PROG-06 | Cancel completed | Teacher | completed | status=cancelled | 400 | Cannot cancel completed |
| TGT-PROG-07 | Invalid percentage (<0) | Teacher | active | progress_percentage=-10 | 400 | Validation error |
| TGT-PROG-08 | Invalid percentage (>100) | Teacher | active | progress_percentage=150 | 400 | Validation error |
| TGT-PROG-09 | Student updates | Student | active | progress_percentage=50 | 403 | Forbidden |
| TGT-PROG-10 | Different school | Teacher A | School B target | active | progress=50 | 200 | Empty (RLS) |
| TGT-PROG-11 | Admin updates | Admin | active | status=completed | 200 | Updated successfully |
| TGT-PROG-12 | Owner updates | Owner | active | status=cancelled | 200 | Updated successfully |

---

#### POST /api/targets/:id/milestones - Add Milestone

**Test Cases**:

| Test ID | Scenario | Auth | Target State | Data | Expected Status | Expected Response |
|---------|----------|------|--------------|------|-----------------|-------------------|
| TGT-MS-ADD-01 | Valid milestone | Teacher | Active, <20 milestones | Valid data | 201 | Milestone created |
| TGT-MS-ADD-02 | At limit (20) | Teacher | Has 20 milestones | Valid data | 400 | Max milestones reached |
| TGT-MS-ADD-03 | Missing title | Teacher | Active | No title | 400 | Validation error |
| TGT-MS-ADD-04 | Title too long | Teacher | Active | 201 char title | 400 | Title exceeds max |
| TGT-MS-ADD-05 | With description | Teacher | Active | Has description | 201 | Created with description |
| TGT-MS-ADD-06 | With target_value | Teacher | Active | Has target_value | 201 | Created with value |
| TGT-MS-ADD-07 | Custom order | Teacher | Active | order=5 | 201 | Created with order=5 |
| TGT-MS-ADD-08 | Auto order | Teacher | Has 3 milestones | No order | 201 | Created with order=4 |
| TGT-MS-ADD-09 | Student adds | Student | Active | Valid data | 403 | Forbidden |
| TGT-MS-ADD-10 | Different school | Teacher A | School B target | Valid data | 200 | Empty (RLS) |
| TGT-MS-ADD-11 | Completed target | Teacher | Completed | Valid data | 200 | Can still add (no restriction) |
| TGT-MS-ADD-12 | Cancelled target | Teacher | Cancelled | Valid data | 200 | Can still add (no restriction) |

---

#### PATCH /api/targets/milestones/:id - Complete Milestone

**Test Cases**:

| Test ID | Scenario | Auth | Milestone State | Data | Expected Status | Expected Response |
|---------|----------|------|-----------------|------|-----------------|-------------------|
| TGT-MS-COMP-01 | Valid completion | Teacher | Not completed | None | 200 | Milestone completed, progress updated |
| TGT-MS-COMP-02 | Already completed | Teacher | Completed | None | 400 | Already completed |
| TGT-MS-COMP-03 | With current_value | Teacher | Not completed | current_value=100 | 200 | Completed with value |
| TGT-MS-COMP-04 | Student completes | Student | Not completed | None | 403 | Forbidden |
| TGT-MS-COMP-05 | Admin completes | Admin | Not completed | None | 200 | Completed successfully |
| TGT-MS-COMP-06 | Owner completes | Owner | Not completed | None | 200 | Completed successfully |
| TGT-MS-COMP-07 | Verify progress calc | Teacher | 1 of 4 milestones | None | 200 | Progress = 25% |
| TGT-MS-COMP-08 | Last milestone | Teacher | 3 of 4 completed | None | 200 | Progress = 100% |
| TGT-MS-COMP-09 | Non-existent ID | Teacher | N/A | None | 404 | Milestone not found |
| TGT-MS-COMP-10 | Different school | Teacher A | School B milestone | None | 200 | Empty (RLS) |

---

#### DELETE /api/targets/:id - Delete Target

**Test Cases**:

| Test ID | Scenario | Auth | Target Owner | Expected Status | Expected Response |
|---------|----------|------|--------------|-----------------|-------------------|
| TGT-DEL-01 | Delete own target | Teacher | Same teacher | 200 | Target deleted |
| TGT-DEL-02 | Delete other's target | Teacher A | Teacher B | 200 | Empty (RLS blocks) |
| TGT-DEL-03 | Admin deletes | Admin | Any teacher | 200 | Target deleted |
| TGT-DEL-04 | Owner deletes | Owner | Any teacher | 200 | Target deleted |
| TGT-DEL-05 | Student deletes | Student | Any | 403 | Forbidden |
| TGT-DEL-06 | Non-existent ID | Teacher | N/A | 404 | Target not found |
| TGT-DEL-07 | Verify cascade | Teacher | Has milestones | 200 | Target + milestones deleted |
| TGT-DEL-08 | Different school | Teacher A | School B target | 200 | Empty (RLS) |

---

### Targets Edge Cases

#### TGT-EDGE-01: Milestone Order Conflicts
- **Scenario**: Multiple milestones added with same order number
- **Expected**: System handles gracefully, maintains unique orders
- **Verification**: Orders remain distinct

#### TGT-EDGE-02: Progress Calculation with Decimal Milestones
- **Scenario**: Target has 3 milestones, 1 completed = 33.33%
- **Expected**: Progress rounded to integer (33%)
- **Verification**: progress_percentage is integer

#### TGT-EDGE-03: Rapid Milestone Completions
- **Scenario**: 5 milestones completed in rapid succession
- **Expected**: All completions processed, progress updates correctly
- **Verification**: Final progress = 100%

#### TGT-EDGE-04: Target Without Due Date
- **Scenario**: Create target with no due_date
- **Expected**: Created successfully, no overdue calculations
- **Verification**: is_overdue = false

#### TGT-EDGE-05: Overdue Target
- **Scenario**: Target with due_date in past, status still active
- **Expected**: is_overdue = true in response
- **Verification**: Computed field shows overdue status

---

## Integration Tests

### INT-01: Homework → Targets Integration
**Scenario**: Homework assignments contribute to target milestones

**Flow**:
1. Create memorization target for student
2. Add milestone "Complete Surah 2"
3. Create homework for Surah 2
4. Complete homework
5. Teacher manually completes milestone
6. Verify target progress updates

**Expected**:
- Both systems work independently
- Target progress reflects milestone completion
- No automatic linkage (manual tracking by teacher)

---

### INT-02: Multi-User Concurrent Operations
**Scenario**: Multiple teachers working simultaneously

**Flow**:
1. Teacher A creates target for Student 1
2. Teacher B creates target for Student 1 (same student)
3. Both add milestones concurrently
4. Both complete milestones concurrently

**Expected**:
- All operations succeed
- No data corruption
- RLS prevents cross-school interference
- Notifications sent correctly for all actions

---

### INT-03: Full Student Journey
**Scenario**: Complete student experience from creation to target completion

**Flow**:
1. Teacher creates student account
2. Assigns 3 homework assignments
3. Creates individual target with 5 milestones
4. Student views their homework list (3 pending)
5. Student views their target (0% progress)
6. Teacher completes 2 homework (green → gold)
7. Teacher completes 3 milestones
8. Student views updated stats (2 completed homework, 60% target progress)

**Expected**:
- Seamless workflow across all endpoints
- Student sees accurate real-time data
- All notifications delivered

---

## Performance Tests

### PERF-01: Bulk Homework Creation
- **Load**: Create 100 homework assignments
- **Expected Time**: < 30 seconds
- **Success Criteria**: All created, all notifications sent

### PERF-02: Large Target with Many Milestones
- **Load**: Create target with 20 milestones
- **Expected Time**: < 2 seconds for creation
- **Success Criteria**: All milestones stored correctly

### PERF-03: List Targets with Pagination
- **Load**: School with 500 targets, fetch page 1 (limit=20)
- **Expected Time**: < 500ms
- **Success Criteria**: Correct page returned with accurate total count

### PERF-04: Student Homework Summary (Heavy Load)
- **Load**: Student with 200 homework assignments (100 pending, 100 completed)
- **Expected Time**: < 1 second
- **Success Criteria**: Accurate statistics, all homework returned

---

## Security Tests

### SEC-01: SQL Injection in Filters
**Test**: Inject SQL in query parameters
```bash
GET /api/homework?student_id='; DROP TABLE highlights; --
```
**Expected**: Parameter validation prevents injection, returns validation error

---

### SEC-02: Cross-School Data Access via Direct IDs
**Test**: Teacher from School A uses School B's student_id
```bash
POST /api/homework
{ "student_id": "school-b-student-uuid" }
```
**Expected**: Either 403 Forbidden or RLS blocks query, no data leakage

---

### SEC-03: Authorization Bypass Attempts
**Test**: Student attempts to complete homework without teacher token
```bash
PATCH /api/homework/{id}/complete
Authorization: Bearer {student_token}
```
**Expected**: 403 Forbidden, homework unchanged

---

### SEC-04: Role Escalation via Parameter Tampering
**Test**: Student creates target by sending teacher-only request
```bash
POST /api/targets
Authorization: Bearer {student_token}
{ "title": "Unauthorized Target" }
```
**Expected**: 403 Forbidden, teacher profile not found

---

### SEC-05: UUID Enumeration
**Test**: Attempt to iterate through UUIDs to find valid homework/target IDs
```bash
GET /api/homework/{random-uuid}
GET /api/homework/{random-uuid-2}
...
```
**Expected**: 404 for non-existent, RLS blocks cross-school even if UUID exists

---

## Test Execution Checklist

### Pre-Deployment Testing
- [ ] All homework endpoint tests passing
- [ ] All targets endpoint tests passing
- [ ] All workflow tests passing
- [ ] All edge cases handled
- [ ] All integration tests passing

### Post-Deployment Validation
- [ ] Smoke tests in production
- [ ] Performance benchmarks met
- [ ] Security scans clean
- [ ] RLS policies enforced
- [ ] Notifications delivering

### Regression Testing
- [ ] Run full test suite after any code changes
- [ ] Verify no existing functionality broken
- [ ] Test cross-feature interactions

---

## Test Automation Recommendations

### Unit Tests
- Create Jest/Vitest tests for:
  - All validator functions
  - All helper functions (calculateTargetProgress, getHomeworkStatus, etc.)
  - Business rule validators

### Integration Tests
- Use Supertest or similar for API endpoint testing
- Mock Supabase client for isolated testing
- Test complete workflows end-to-end

### E2E Tests
- Playwright or Cypress for full user journeys
- Test in actual browser with real database
- Verify notifications and UI updates

---

## Bug Reporting Template

When issues are found during testing, report using this template:

```markdown
### Bug Report: [Brief Description]

**Test ID**: TGT-POST-05
**Endpoint**: POST /api/targets
**Auth**: Student token
**Severity**: High | Medium | Low

**Steps to Reproduce**:
1. Login as student
2. Send POST request to /api/targets
3. Observe response

**Expected Behavior**:
403 Forbidden response, teacher profile not found

**Actual Behavior**:
500 Internal Server Error

**Request**:
```json
{
  "title": "Test Target"
}
```

**Response**:
```json
{
  "success": false,
  "error": "Internal server error",
  "code": "INTERNAL_ERROR"
}
```

**Database State**: [Any relevant database state]
**Logs**: [Relevant server logs]
**Fix Priority**: Immediate | High | Medium | Low
```

---

## Success Criteria Summary

**Homework API**:
- ✅ All 6 endpoints functional (POST, GET list, GET student, PATCH complete, POST reply)
- ✅ Green → Gold transitions working correctly
- ✅ Notifications sent for all user-facing actions
- ✅ RLS enforcing school isolation
- ✅ Statistics calculations accurate
- ✅ Edge cases handled gracefully

**Targets API**:
- ✅ All 7 endpoints functional (POST, GET list, GET single, DELETE, PATCH progress, POST milestones, PATCH milestone complete)
- ✅ All 3 target types working (individual, class, school)
- ✅ Milestone system functional
- ✅ Progress calculations accurate
- ✅ Status transitions validated
- ✅ Notifications sent appropriately

**Overall Phase 2**:
- ✅ 12 total HTTP endpoints implemented
- ✅ Type-safe throughout (100% TypeScript coverage)
- ✅ Comprehensive validation (Zod + business rules)
- ✅ Permission checks on all operations
- ✅ Multi-tenant isolation enforced
- ✅ Production-ready code quality

---

**Document Version**: 1.0
**Last Updated**: 2025-10-20
**Status**: Ready for testing
