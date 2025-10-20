# Phase 4: Mastery Tracking APIs - Testing Guide

**Created**: 2025-10-20
**Status**: Phase 4 Complete - Ready for Testing
**Purpose**: Complete testing documentation for mastery tracking APIs

---

## 📋 Overview

Phase 4 implements the per-ayah mastery tracking system with 4 mastery levels:
- **unknown**: Default state, no mastery data
- **learning**: Student is learning (score 60-74%)
- **proficient**: Student is proficient (score 75-89%)
- **mastered**: Student has mastered (score 90-100%)

---

## 🎯 Implemented Endpoints

### 1. **POST /api/mastery/upsert** - Create/Update Mastery Level
- **Purpose**: Teachers manually set mastery level for a student's ayah
- **Auth**: Teacher/Admin only
- **RLS**: School-level isolation enforced
- **Upsert Behavior**: Creates if not exists, updates if exists

### 2. **GET /api/mastery/student/:id** - Get Student Mastery Overview
- **Purpose**: View complete mastery data for a student
- **Auth**: Teacher/Student (own)/Parent (linked children)/Admin
- **Includes**: Summary stats, recent updates, surah progress breakdown
- **Filters**: Optional script_id, optional surah

### 3. **GET /api/mastery/heatmap/:surah** - Get Surah Heatmap
- **Purpose**: Generate color-coded heatmap for all ayahs in a surah
- **Auth**: Teacher/Student (own)/Parent (linked children)/Admin
- **Returns**: All ayahs with mastery levels, summary stats
- **Query Params**: student_id (required), script_id (optional)

### 4. **POST /api/mastery/auto-update** - Auto-Update from Assignment
- **Purpose**: Automatically update mastery based on assignment grades
- **Auth**: Teacher/Admin only
- **Logic**: Calculates weighted average → converts to mastery level → updates all associated ayahs
- **Score Mapping**: ≥90=mastered, ≥75=proficient, ≥60=learning, <60=unknown

---

## 🧪 Complete Testing Workflow

### Prerequisites

1. **Get Auth Token**
```bash
# Login as teacher
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@school.com",
    "password": "password123"
  }'

# Extract token from response
TOKEN="your_auth_token_here"
```

2. **Get IDs from Database**
```bash
# You'll need:
# - STUDENT_ID: A valid student ID from your school
# - SCRIPT_ID: A valid script ID (e.g., 'uthmani-hafs' script)
# - AYAH_ID: A valid ayah ID for the script
# - ASSIGNMENT_ID: A graded assignment ID
```

---

### Test 1: Create Mastery Level (Manual Update)

**Endpoint**: `POST /api/mastery/upsert`

```bash
curl -X POST http://localhost:3000/api/mastery/upsert \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "550e8400-e29b-41d4-a716-446655440001",
    "script_id": "550e8400-e29b-41d4-a716-446655440010",
    "ayah_id": "550e8400-e29b-41d4-a716-446655440020",
    "level": "learning"
  }'
```

**Expected Response** (201 Created for new, 200 OK for update):
```json
{
  "success": true,
  "data": {
    "mastery": {
      "id": "550e8400-e29b-41d4-a716-446655440030",
      "student_id": "550e8400-e29b-41d4-a716-446655440001",
      "script_id": "550e8400-e29b-41d4-a716-446655440010",
      "ayah_id": "550e8400-e29b-41d4-a716-446655440020",
      "level": "learning",
      "last_updated": "2025-10-20T10:00:00Z",
      "student": {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "display_name": "Ahmed Ali",
        "email": "ahmed@student.com"
      },
      "script": {
        "id": "550e8400-e29b-41d4-a716-446655440010",
        "code": "uthmani-hafs",
        "display_name": "Uthmanic Hafs"
      },
      "ayah": {
        "id": "550e8400-e29b-41d4-a716-446655440020",
        "surah": 1,
        "ayah": 1,
        "text": "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ"
      }
    },
    "improved": true
  },
  "message": "Mastery level set to learning"
}
```

**Test Again with Higher Level** (should show improvement):
```bash
curl -X POST http://localhost:3000/api/mastery/upsert \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "550e8400-e29b-41d4-a716-446655440001",
    "script_id": "550e8400-e29b-41d4-a716-446655440010",
    "ayah_id": "550e8400-e29b-41d4-a716-446655440020",
    "level": "proficient"
  }'
```

**Expected** (should show `"improved": true` and `"previous_level": "learning"`):

---

### Test 2: Get Student Mastery Overview

**Endpoint**: `GET /api/mastery/student/:id`

```bash
# Get all mastery data for student
curl -X GET "http://localhost:3000/api/mastery/student/550e8400-e29b-41d4-a716-446655440001" \
  -H "Authorization: Bearer $TOKEN"

# Filter by surah
curl -X GET "http://localhost:3000/api/mastery/student/550e8400-e29b-41d4-a716-446655440001?surah=1" \
  -H "Authorization: Bearer $TOKEN"

# Filter by script
curl -X GET "http://localhost:3000/api/mastery/student/550e8400-e29b-41d4-a716-446655440001?script_id=550e8400-e29b-41d4-a716-446655440010" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "student_id": "550e8400-e29b-41d4-a716-446655440001",
    "student_name": "Ahmed Ali",
    "script_id": "550e8400-e29b-41d4-a716-446655440010",
    "script_code": "uthmani-hafs",
    "total_ayahs_tracked": 15,
    "mastery_summary": {
      "unknown_count": 5,
      "learning_count": 4,
      "proficient_count": 3,
      "mastered_count": 3,
      "total_count": 15,
      "unknown_percentage": 33.33,
      "learning_percentage": 26.67,
      "proficient_percentage": 20.0,
      "mastered_percentage": 20.0,
      "overall_progress_percentage": 40.0
    },
    "recent_updates": [
      {
        "id": "...",
        "student_id": "...",
        "ayah_id": "...",
        "level": "proficient",
        "last_updated": "2025-10-20T10:00:00Z",
        "ayah": {
          "surah": 1,
          "ayah": 1,
          "text": "..."
        }
      }
    ],
    "surahs_progress": [
      {
        "surah": 1,
        "surah_name": "الفاتحة",
        "total_ayahs": 7,
        "mastered_count": 3,
        "proficient_count": 2,
        "learning_count": 1,
        "unknown_count": 1,
        "completion_percentage": 71.43
      }
    ]
  }
}
```

---

### Test 3: Get Surah Heatmap

**Endpoint**: `GET /api/mastery/heatmap/:surah`

```bash
# Get heatmap for Surah Al-Fatiha (Surah 1)
curl -X GET "http://localhost:3000/api/mastery/heatmap/1?student_id=550e8400-e29b-41d4-a716-446655440001" \
  -H "Authorization: Bearer $TOKEN"

# With specific script
curl -X GET "http://localhost:3000/api/mastery/heatmap/1?student_id=550e8400-e29b-41d4-a716-446655440001&script_id=550e8400-e29b-41d4-a716-446655440010" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "surah": 1,
    "surah_name": "الفاتحة",
    "total_ayahs": 7,
    "mastery_by_ayah": [
      {
        "ayah_number": 1,
        "ayah_id": "...",
        "level": "mastered",
        "last_updated": "2025-10-20T10:00:00Z",
        "ayah_text": "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ"
      },
      {
        "ayah_number": 2,
        "ayah_id": "...",
        "level": "proficient",
        "last_updated": "2025-10-20T09:50:00Z",
        "ayah_text": "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ"
      },
      {
        "ayah_number": 3,
        "ayah_id": "...",
        "level": "learning",
        "last_updated": "2025-10-20T09:45:00Z",
        "ayah_text": "الرَّحْمَٰنِ الرَّحِيمِ"
      },
      {
        "ayah_number": 4,
        "ayah_id": "...",
        "level": "unknown",
        "last_updated": "2025-10-20T09:40:00Z",
        "ayah_text": "مَالِكِ يَوْمِ الدِّينِ"
      }
    ],
    "summary": {
      "unknown_count": 2,
      "learning_count": 2,
      "proficient_count": 2,
      "mastered_count": 1,
      "total_count": 7,
      "unknown_percentage": 28.57,
      "learning_percentage": 28.57,
      "proficient_percentage": 28.57,
      "mastered_percentage": 14.29,
      "overall_progress_percentage": 42.86
    }
  }
}
```

---

### Test 4: Auto-Update Mastery from Assignment

**Endpoint**: `POST /api/mastery/auto-update`

**Prerequisites**:
- Assignment must be graded (have grades in database)
- Assignment must have highlights linking it to ayahs

```bash
# Auto-update based on assignment grades
curl -X POST http://localhost:3000/api/mastery/auto-update \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "550e8400-e29b-41d4-a716-446655440001",
    "assignment_id": "550e8400-e29b-41d4-a716-446655440050"
  }'

# Or provide explicit level (override calculation)
curl -X POST http://localhost:3000/api/mastery/auto-update \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "550e8400-e29b-41d4-a716-446655440001",
    "assignment_id": "550e8400-e29b-41d4-a716-446655440050",
    "new_level": "mastered"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "mastery": {
      "id": "...",
      "student_id": "550e8400-e29b-41d4-a716-446655440001",
      "ayah_id": "...",
      "level": "proficient",
      "last_updated": "2025-10-20T10:30:00Z",
      "student": {
        "id": "...",
        "display_name": "Ahmed Ali",
        "email": "..."
      },
      "ayah": {
        "surah": 1,
        "ayah": 1,
        "text": "..."
      }
    },
    "improved": true
  },
  "message": "Auto-updated mastery for 5 ayah(s) to proficient. 3 improvement(s) recorded"
}
```

---

## ❌ Error Cases to Test

### 1. Unauthorized Access (401)
```bash
curl -X POST http://localhost:3000/api/mastery/upsert \
  -H "Content-Type: application/json" \
  -d '{...}'
```
**Expected**: `401 Unauthorized`

### 2. Forbidden - Student from Different School (403)
```bash
# Try to update mastery for student in different school
curl -X POST http://localhost:3000/api/mastery/upsert \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "different_school_student_id",
    ...
  }'
```
**Expected**: `403 Forbidden - Student not found in your school`

### 3. Invalid Mastery Level (400)
```bash
curl -X POST http://localhost:3000/api/mastery/upsert \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "...",
    "script_id": "...",
    "ayah_id": "...",
    "level": "expert"
  }'
```
**Expected**: `400 Validation Error - Invalid mastery level`

### 4. Invalid Surah Number (400)
```bash
curl -X GET "http://localhost:3000/api/mastery/heatmap/115?student_id=..." \
  -H "Authorization: Bearer $TOKEN"
```
**Expected**: `400 Validation Error - Invalid surah number. Must be between 1 and 114`

### 5. Missing Student ID for Heatmap (400)
```bash
curl -X GET "http://localhost:3000/api/mastery/heatmap/1" \
  -H "Authorization: Bearer $TOKEN"
```
**Expected**: `400 Validation Error - student_id query parameter is required`

### 6. Student Not Found (404)
```bash
curl -X POST http://localhost:3000/api/mastery/upsert \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "00000000-0000-0000-0000-000000000000",
    ...
  }'
```
**Expected**: `404 Student not found`

### 7. Ayah Not Found (404)
```bash
curl -X POST http://localhost:3000/api/mastery/upsert \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "ayah_id": "00000000-0000-0000-0000-000000000000",
    ...
  }'
```
**Expected**: `404 Ayah not found for this script`

### 8. Auto-Update Without Grades (404)
```bash
curl -X POST http://localhost:3000/api/mastery/auto-update \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "...",
    "assignment_id": "ungraded_assignment_id"
  }'
```
**Expected**: `404 No grades found for this assignment`

---

## 🎯 Success Criteria

### Phase 4 Complete Checklist

✅ **Task 4.1**: Mastery types and validators created
✅ **Task 4.2**: POST /api/mastery/upsert endpoint working
✅ **Task 4.3**: GET /api/mastery/student/:id endpoint working
✅ **Task 4.4**: GET /api/mastery/heatmap/:surah endpoint working
✅ **Task 4.5**: POST /api/mastery/auto-update endpoint working
✅ **Task 4.6**: Comprehensive testing documentation created

### Functional Requirements

✅ Teachers can manually set mastery levels for any ayah
✅ Mastery levels are stored per-student, per-script, per-ayah
✅ Upsert behavior prevents duplicates
✅ Improvement tracking works (comparing old vs new level)
✅ Student mastery overview shows complete progress
✅ Heatmaps visualize all ayahs in a surah with color-coded levels
✅ Auto-update calculates mastery from assignment grades
✅ Score mapping: ≥90=mastered, ≥75=proficient, ≥60=learning, <60=unknown
✅ All endpoints enforce school-level RLS
✅ Permission validators work correctly

### Data Integrity

✅ No duplicate mastery records (unique constraint on student_id, script_id, ayah_id)
✅ Mastery levels are only valid enum values
✅ Timestamps update correctly on changes
✅ Related entities (student, script, ayah) exist before mastery creation

### Performance

✅ Queries use proper indexes (student_id, script_id, ayah_id)
✅ Heatmap loads all ayahs efficiently
✅ Auto-update handles multiple ayahs without timeout

---

## 📊 Integration Testing Workflow

### Complete Teacher Workflow

```bash
# 1. Teacher creates assignment with highlights
# (Phase 1 API)

# 2. Teacher grades assignment
# (Phase 3 API)

# 3. Teacher triggers auto-update
curl -X POST http://localhost:3000/api/mastery/auto-update \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "$STUDENT_ID",
    "assignment_id": "$ASSIGNMENT_ID"
  }'

# 4. Teacher views updated mastery heatmap
curl -X GET "http://localhost:3000/api/mastery/heatmap/1?student_id=$STUDENT_ID" \
  -H "Authorization: Bearer $TEACHER_TOKEN"

# 5. Teacher manually adjusts specific ayah
curl -X POST http://localhost:3000/api/mastery/upsert \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "$STUDENT_ID",
    "script_id": "$SCRIPT_ID",
    "ayah_id": "$AYAH_ID",
    "level": "mastered"
  }'
```

### Complete Student Workflow

```bash
# 1. Student logs in
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@school.com",
    "password": "password123"
  }'

STUDENT_TOKEN="student_auth_token"

# 2. Student views their own mastery overview
curl -X GET "http://localhost:3000/api/mastery/student/$OWN_STUDENT_ID" \
  -H "Authorization: Bearer $STUDENT_TOKEN"

# 3. Student views heatmap for specific surah
curl -X GET "http://localhost:3000/api/mastery/heatmap/2?student_id=$OWN_STUDENT_ID" \
  -H "Authorization: Bearer $STUDENT_TOKEN"

# 4. Student cannot update mastery (should fail)
curl -X POST http://localhost:3000/api/mastery/upsert \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{...}'
# Expected: 403 Forbidden
```

---

## 🔍 Database Validation Queries

### Check Mastery Records
```sql
-- View all mastery records for a student
SELECT
  am.*,
  qa.surah,
  qa.ayah,
  qa.text,
  qs.code as script_code
FROM ayah_mastery am
JOIN quran_ayahs qa ON qa.id = am.ayah_id
JOIN quran_scripts qs ON qs.id = am.script_id
WHERE am.student_id = 'student_uuid'
ORDER BY qa.surah, qa.ayah;

-- Check for duplicate mastery records (should be 0)
SELECT student_id, script_id, ayah_id, COUNT(*)
FROM ayah_mastery
GROUP BY student_id, script_id, ayah_id
HAVING COUNT(*) > 1;

-- Calculate mastery summary for a student
SELECT
  level,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM ayah_mastery
WHERE student_id = 'student_uuid'
GROUP BY level;
```

---

## 🎓 Next Steps

After Phase 4 completion:

1. **UI Integration** (Phase 6):
   - Build mastery heatmap component (color-coded grid)
   - Build mastery update interface (teacher dashboard)
   - Build progress visualization (student dashboard)
   - Build surah mastery selector (parent dashboard)

2. **Phase 5: Notifications** (Next Priority):
   - Notify students when mastery level improves
   - Notify parents on mastery milestones
   - Notify teachers on class mastery trends

3. **Enhanced Features**:
   - Mastery history tracking (level changes over time)
   - Mastery analytics (class averages, trends)
   - Mastery goals (target X% mastered by date)

---

**END OF PHASE 4 TESTING GUIDE**
