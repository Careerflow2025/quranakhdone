# Phase 3: Gradebook APIs - Testing Guide

**Created**: 2025-10-20
**Status**: ✅ COMPLETE
**Priority**: HIGH
**Timeline**: 3 days

## Overview

Complete testing guide for all Gradebook API endpoints. This phase implements rubric-based grading with weighted criteria, grade submissions, and CSV export functionality.

---

## Files Created

### TypeScript Types
- `frontend/lib/types/gradebook.ts` (~570 lines)
  - Complete type system for rubrics, criteria, grades
  - Helper functions for weighted averages and grade calculations
  - CSV export formatting utilities

### Validators
- `frontend/lib/validators/gradebook.ts` (~670 lines)
  - 9 Zod schemas for request validation
  - 9 business rule validators
  - 8 permission validators
  - Weight sum validation (must = 100)

### API Endpoints
- `frontend/app/api/rubrics/route.ts` - Create & list rubrics
- `frontend/app/api/rubrics/[id]/route.ts` - Get, update, delete rubric
- `frontend/app/api/rubrics/[id]/criteria/route.ts` - Add criterion to rubric
- `frontend/app/api/rubrics/criteria/[id]/route.ts` - Update, delete criterion
- `frontend/app/api/assignments/[id]/rubric/route.ts` - Attach rubric to assignment
- `frontend/app/api/grades/route.ts` - Submit grade
- `frontend/app/api/grades/assignment/[id]/route.ts` - Get assignment grades
- `frontend/app/api/grades/student/[id]/route.ts` - Get student grades
- `frontend/app/api/gradebook/export/route.ts` - Export gradebook to CSV

---

## Complete Testing Workflow

### 1. CREATE RUBRIC

**Endpoint**: `POST /api/rubrics`

**Test Case 1.1**: Create rubric without criteria
```bash
curl -X POST http://localhost:3000/api/rubrics \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Quranic Recitation Rubric",
    "description": "Assessment rubric for Quran recitation quality"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "rubric": {
      "id": "uuid",
      "school_id": "uuid",
      "name": "Quranic Recitation Rubric",
      "description": "Assessment rubric for Quran recitation quality",
      "created_by": "uuid",
      "created_at": "2025-10-20T...",
      "updated_at": "2025-10-20T...",
      "criteria": [],
      "total_criteria": 0,
      "total_weight": 0,
      "assignment_count": 0
    }
  },
  "message": "Rubric \"Quranic Recitation Rubric\" created successfully"
}
```

**Test Case 1.2**: Create rubric with criteria (weights must sum to 100)
```bash
curl -X POST http://localhost:3000/api/rubrics \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Complete Recitation Assessment",
    "description": "Full rubric with weighted criteria",
    "criteria": [
      {
        "name": "Tajweed Accuracy",
        "description": "Correct application of tajweed rules",
        "weight": 40,
        "max_score": 100,
        "order": 1
      },
      {
        "name": "Fluency",
        "description": "Smooth and continuous recitation",
        "weight": 30,
        "max_score": 100,
        "order": 2
      },
      {
        "name": "Memorization",
        "description": "Accuracy from memory",
        "weight": 30,
        "max_score": 100,
        "order": 3
      }
    ]
  }'
```

**Expected Response**: Success with rubric + 3 criteria

**Test Case 1.3**: FAIL - Invalid weight total
```bash
curl -X POST http://localhost:3000/api/rubrics \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Invalid Rubric",
    "criteria": [
      {"name": "Test1", "weight": 50, "max_score": 100},
      {"name": "Test2", "weight": 30, "max_score": 100}
    ]
  }'
```

**Expected Response**: 400 error - "Criterion weights must sum to 100. Current total: 80"

---

### 2. LIST RUBRICS

**Endpoint**: `GET /api/rubrics`

**Test Case 2.1**: List all rubrics
```bash
curl -X GET "http://localhost:3000/api/rubrics?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "rubrics": [
      {
        "id": "uuid",
        "name": "Complete Recitation Assessment",
        "description": "Full rubric with weighted criteria",
        "criteria": [...],
        "total_criteria": 3,
        "total_weight": 100
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 2,
      "total_pages": 1
    }
  }
}
```

**Test Case 2.2**: Search rubrics
```bash
curl -X GET "http://localhost:3000/api/rubrics?search=recitation" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 3. GET SINGLE RUBRIC

**Endpoint**: `GET /api/rubrics/:id`

**Test Case 3.1**: Get rubric with criteria
```bash
curl -X GET http://localhost:3000/api/rubrics/RUBRIC_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response**: Full rubric details with sorted criteria array

---

### 4. ADD CRITERION TO RUBRIC

**Endpoint**: `POST /api/rubrics/:id/criteria`

**Test Case 4.1**: Add criterion (must maintain weight sum = 100)
```bash
curl -X POST http://localhost:3000/api/rubrics/RUBRIC_ID/criteria \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Voice Quality",
    "description": "Tone and pronunciation clarity",
    "weight": 20,
    "max_score": 100,
    "order": 4
  }'
```

**Expected Behavior**: This will FAIL if existing criteria weights already sum to 100.
**Solution**: First update existing criterion weights to make room.

---

### 5. UPDATE CRITERION

**Endpoint**: `PATCH /api/rubrics/criteria/:id`

**Test Case 5.1**: Update criterion weight
```bash
curl -X PATCH http://localhost:3000/api/rubrics/criteria/CRITERION_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "weight": 35
  }'
```

**Expected Behavior**: Validates that new weight total still sums to 100

---

### 6. DELETE CRITERION

**Endpoint**: `DELETE /api/rubrics/criteria/:id`

**Test Case 6.1**: Delete unused criterion
```bash
curl -X DELETE http://localhost:3000/api/rubrics/criteria/CRITERION_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Test Case 6.2**: FAIL - Delete criterion with grades
```bash
curl -X DELETE http://localhost:3000/api/rubrics/criteria/CRITERION_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response**: 400 error - "Cannot delete criterion. It has X grade(s) associated with it"

---

### 7. ATTACH RUBRIC TO ASSIGNMENT

**Endpoint**: `POST /api/assignments/:id/rubric`

**Test Case 7.1**: Attach complete rubric
```bash
curl -X POST http://localhost:3000/api/assignments/ASSIGNMENT_ID/rubric \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "rubric_id": "RUBRIC_ID"
  }'
```

**Expected Response**: Success with rubric details

**Test Case 7.2**: FAIL - Attach incomplete rubric (no criteria)
```bash
curl -X POST http://localhost:3000/api/assignments/ASSIGNMENT_ID/rubric \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "rubric_id": "EMPTY_RUBRIC_ID"
  }'
```

**Expected Response**: 400 error - "Rubric has no criteria"

**Test Case 7.3**: FAIL - Attach rubric with invalid weights
```bash
curl -X POST http://localhost:3000/api/assignments/ASSIGNMENT_ID/rubric \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "rubric_id": "INVALID_RUBRIC_ID"
  }'
```

**Expected Response**: 400 error - "Criterion weights must sum to 100"

---

### 8. SUBMIT GRADE

**Endpoint**: `POST /api/grades`

**Test Case 8.1**: Submit first grade for assignment
```bash
curl -X POST http://localhost:3000/api/grades \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "assignment_id": "ASSIGNMENT_ID",
    "student_id": "STUDENT_ID",
    "criterion_id": "TAJWEED_CRITERION_ID",
    "score": 85,
    "max_score": 100,
    "comments": "Good tajweed, minor errors in madd rules"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "grade": {
      "id": "uuid",
      "assignment_id": "uuid",
      "student_id": "uuid",
      "criterion_id": "uuid",
      "score": 85,
      "max_score": 100,
      "comments": "Good tajweed, minor errors in madd rules",
      "graded_by": "uuid",
      "created_at": "2025-10-20T...",
      "updated_at": "2025-10-20T...",
      "student": {...},
      "criterion": {
        "id": "uuid",
        "name": "Tajweed Accuracy",
        "weight": 40,
        "max_score": 100
      },
      "percentage": 85
    },
    "overall_progress": {
      "graded_criteria": 1,
      "total_criteria": 3,
      "percentage": 33.33
    }
  },
  "message": "Grade submitted successfully"
}
```

**Test Case 8.2**: Update existing grade
```bash
curl -X POST http://localhost:3000/api/grades \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "assignment_id": "ASSIGNMENT_ID",
    "student_id": "STUDENT_ID",
    "criterion_id": "TAJWEED_CRITERION_ID",
    "score": 90,
    "max_score": 100,
    "comments": "Improved performance on review"
  }'
```

**Expected Response**: 200 with message "Grade updated successfully"

**Test Case 8.3**: FAIL - Score exceeds max_score
```bash
curl -X POST http://localhost:3000/api/grades \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "assignment_id": "ASSIGNMENT_ID",
    "student_id": "STUDENT_ID",
    "criterion_id": "FLUENCY_CRITERION_ID",
    "score": 110,
    "max_score": 100
  }'
```

**Expected Response**: 400 error - "Score (110) cannot exceed max_score (100)"

---

### 9. GET ASSIGNMENT GRADES

**Endpoint**: `GET /api/grades/assignment/:id`

**Test Case 9.1**: Get grades for assignment
```bash
curl -X GET http://localhost:3000/api/grades/assignment/ASSIGNMENT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "assignment": {
      "id": "uuid",
      "title": "Surah Al-Fatiha Recitation",
      "description": "...",
      "student_id": "uuid",
      "rubric": {...},
      "grades": [
        {
          "id": "uuid",
          "criterion": {"name": "Tajweed Accuracy", "weight": 40},
          "score": 85,
          "percentage": 85
        },
        {
          "id": "uuid",
          "criterion": {"name": "Fluency", "weight": 30},
          "score": 80,
          "percentage": 80
        },
        {
          "id": "uuid",
          "criterion": {"name": "Memorization", "weight": 30},
          "score": 90,
          "percentage": 90
        }
      ],
      "overall_score": 84.5,
      "overall_percentage": 84.5,
      "graded": true
    }
  }
}
```

**Calculation**: Weighted average = (85×40 + 80×30 + 90×30) / 100 = 84.5

---

### 10. GET STUDENT GRADES

**Endpoint**: `GET /api/grades/student/:id`

**Test Case 10.1**: Get all grades for student
```bash
curl -X GET http://localhost:3000/api/grades/student/STUDENT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "student_id": "uuid",
    "entries": [
      {
        "assignment_id": "uuid",
        "assignment_title": "Surah Al-Fatiha Recitation",
        "assignment_due_at": "2025-10-25T...",
        "assignment_status": "reviewed",
        "rubric_name": "Complete Recitation Assessment",
        "grades": [...],
        "overall_score": 84.5,
        "overall_percentage": 84.5,
        "graded_at": "2025-10-20T..."
      }
    ],
    "stats": {
      "total_assignments": 5,
      "graded_assignments": 3,
      "pending_assignments": 2,
      "average_score": 82.3,
      "highest_score": 92.0,
      "lowest_score": 75.5,
      "total_criteria_graded": 9
    }
  }
}
```

---

### 11. EXPORT GRADEBOOK

**Endpoint**: `GET /api/gradebook/export`

**Test Case 11.1**: Export all grades to CSV
```bash
curl -X GET "http://localhost:3000/api/gradebook/export?format=csv" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o gradebook_export.csv
```

**Expected Response**: CSV file with headers:
```csv
"Assignment","Due Date","Status","Rubric","Overall Score","Percentage","Letter Grade","Graded At"
"Surah Al-Fatiha Recitation","2025-10-25T...","reviewed","Complete Recitation Assessment","84.50","84.50%","B","2025-10-20T..."
```

**Test Case 11.2**: Export filtered by student
```bash
curl -X GET "http://localhost:3000/api/gradebook/export?student_id=STUDENT_ID&format=csv" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o student_grades.csv
```

**Test Case 11.3**: Export with date range
```bash
curl -X GET "http://localhost:3000/api/gradebook/export?start_date=2025-10-01T00:00:00Z&end_date=2025-10-31T23:59:59Z&format=csv" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o october_grades.csv
```

---

## Permission Testing

### Teacher Permissions
✅ Can create rubrics
✅ Can view all rubrics in school
✅ Can update own rubrics
✅ Can delete own rubrics (if not in use)
✅ Can attach rubrics to assignments
✅ Can submit grades
✅ Can view all grades
✅ Can export gradebook

### Student Permissions
✅ Can view own grades
❌ Cannot create rubrics
❌ Cannot submit grades
❌ Cannot export gradebook

### Parent Permissions
✅ Can view children's grades
❌ Cannot create rubrics
❌ Cannot submit grades
❌ Cannot export gradebook

---

## Edge Cases

### Weight Validation
- ✅ Weights must sum to exactly 100 (±0.01 tolerance for floating point)
- ✅ Cannot add criterion if total exceeds 100
- ✅ Cannot update criterion if total won't sum to 100

### Rubric In-Use Protection
- ✅ Cannot delete rubric attached to assignments
- ✅ Cannot delete criterion with existing grades
- ✅ Can update rubric/criterion even if in use

### Score Validation
- ✅ Score cannot be negative
- ✅ Score cannot exceed max_score
- ✅ Handles score updates (overwrite existing grade)

### Assignment Rubric Validation
- ✅ Cannot attach rubric with no criteria
- ✅ Cannot attach rubric with incomplete weights
- ✅ Can update assignment rubric (replaces existing)

---

## Database Integrity

### Foreign Key Constraints
- `rubrics.school_id` → `schools.id`
- `rubrics.created_by` → `profiles.user_id` (teacher)
- `rubric_criteria.rubric_id` → `rubrics.id` (CASCADE DELETE)
- `assignment_rubrics.assignment_id` → `assignments.id` (CASCADE DELETE)
- `assignment_rubrics.rubric_id` → `rubrics.id` (CASCADE DELETE)
- `grades.assignment_id` → `assignments.id` (CASCADE DELETE)
- `grades.student_id` → `students.id` (CASCADE DELETE)
- `grades.criterion_id` → `rubric_criteria.id` (PROTECT)
- `grades.graded_by` → `profiles.user_id` (teacher)

### RLS Policies
All tables have `school_id` isolation enforced by Row Level Security policies.

---

## Success Criteria

✅ **Phase 3.1**: TypeScript types created with complete type system
✅ **Phase 3.2**: Validators created with Zod schemas and business rules
✅ **Phase 3.3**: POST /api/rubrics - Create rubric with criteria
✅ **Phase 3.4**: GET /api/rubrics - List rubrics with pagination
✅ **Phase 3.5**: GET /api/rubrics/:id - Get single rubric with criteria
✅ **Phase 3.6**: PATCH /api/rubrics/:id - Update rubric
✅ **Phase 3.7**: DELETE /api/rubrics/:id - Delete rubric (with protection)
✅ **Phase 3.8**: POST /api/rubrics/:id/criteria - Add criterion
✅ **Phase 3.9**: PATCH /api/rubrics/criteria/:id - Update criterion
✅ **Phase 3.10**: DELETE /api/rubrics/criteria/:id - Delete criterion
✅ **Phase 3.11**: POST /api/assignments/:id/rubric - Attach rubric
✅ **Phase 3.12**: POST /api/grades - Submit grade (create/update)
✅ **Phase 3.13**: GET /api/grades/assignment/:id - View assignment grades
✅ **Phase 3.14**: GET /api/grades/student/:id - View student gradebook
✅ **Phase 3.15**: GET /api/gradebook/export - Export to CSV
✅ **Phase 3.16**: Complete testing documentation created

---

## Next Steps (Phase 4)

Once all tests pass:
1. Proceed to **Phase 4: Notifications APIs**
2. Build real-time notification system
3. Integrate with gradebook events (grade submitted, assignment graded, etc.)
4. Implement in-app, email, and push notification channels

---

## Notes

- All endpoints enforce school-level isolation via RLS
- Weight validation ensures criterion weights always sum to 100%
- Grades support both creation and updates (upsert behavior)
- CSV export includes letter grades (A+, A, B+, etc.)
- Weighted average calculation prioritizes criteria with higher weights
- Assignment rubrics can be updated/replaced without deleting grades
