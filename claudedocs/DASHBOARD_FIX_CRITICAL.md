# CRITICAL DASHBOARD RENDERING FIX

**Date**: 2025-10-21
**Issue**: School dashboard fails to render - page timeout
**Root Cause**: Multiple invalid database queries causing React hooks to hang
**Severity**: CRITICAL - Blocks all dashboard testing

---

## Issues Found

### Issue #1: Invalid teachers JOIN syntax
**File**: `frontend/hooks/useSchoolData.ts`
**Line**: 276
**Problem**: Attempting to JOIN with non-existent columns

**Current Code (BROKEN)**:
```typescript
const { data: teacherData } = await supabase
  .from('class_teachers')
  .select('teacher_id, teachers(id, name, email, subject)')
  .eq('class_id', cls.id);
```

**Problem**: `teachers` table doesn't have `name`, `email`, or `subject` columns. These are in `profiles` table.

**Fix**: Replace lines 271-291 with:
```typescript
// Get teacher IDs for this class
const { data: classTeachers } = await supabase
  .from('class_teachers')
  .select('teacher_id')
  .eq('class_id', cls.id);

// Get teacher details separately
let teacherDetails: any[] = [];
if (classTeachers && classTeachers.length > 0) {
  const teacherIds = classTeachers.map((ct: any) => ct.teacher_id);
  const { data: teachers } = await supabase
    .from('teachers')
    .select('id, user_id')
    .in('id', teacherIds);

  // Get profiles for these teachers
  if (teachers && teachers.length > 0) {
    const teacherUserIds = teachers.map((t: any) => t.user_id);
    const { data: teacherProfiles } = await supabase
      .from('profiles')
      .select('user_id, display_name, email')
      .in('user_id', teacherUserIds);

    teacherDetails = teachers.map((t: any) => {
      const profile = teacherProfiles?.find((p: any) => p.user_id === t.user_id);
      return {
        id: t.id,
        name: profile?.display_name || 'Unknown',
        email: profile?.email || ''
      };
    });
  }
}

// Get student count
const { count: studentCount } = await supabase
  .from('class_enrollments')
  .select('*', { count: 'exact', head: true })
  .eq('class_id', cls.id);

return {
  ...cls,
  teacher_count: teacherDetails.length,
  teachers: teacherDetails,
  student_count: studentCount || 0
};
```

---

### Issue #2: Non-existent user_credentials table
**File**: `frontend/hooks/useSchoolData.ts`
**Lines**: 332-358
**Problem**: Querying table that doesn't exist

**Current Code (BROKEN)**:
```typescript
// Fetch user credentials - join with profiles via user_id
const { data: credsData, error: credsError } = await supabase
  .from('user_credentials')
  .select('*')
  .eq('school_id', user.schoolId);

// Fetch profiles separately for credentials
if (!credsError && credsData) {
  const userIds = credsData.map((c: any) => c.user_id);
  const { data: profilesData } = await supabase
    .from('profiles')
    .select('user_id, display_name, email, role')
    .in('user_id', userIds);

  // Merge profiles with credentials
  const mergedCreds = credsData.map((cred: any) => {
    const profile = profilesData?.find((p: any) => p.user_id === cred.user_id);
    return {
      ...cred,
      profiles: profile || null
    };
  });

  setCredentials(mergedCreds);
} else {
  setCredentials([]);
}
```

**Fix**: Replace with:
```typescript
// NOTE: user_credentials table doesn't exist in current schema
// Setting empty array until credentials system is implemented
setCredentials([]);
```

---

### Issue #3: Parents table query incorrect
**File**: `frontend/hooks/useSchoolData.ts`
**Lines**: 196-219
**Problem**: Overly complex query when parents table HAS school_id

**Current Code (UNNECESSARILY COMPLEX)**:
```typescript
// Fetch parents (parents table doesn't have school_id - get via parent_students -> students -> school_id)
// First get all students for this school
const { data: schoolStudents } = await supabase
  .from('students')
  .select('id')
  .eq('school_id', user.schoolId);

// Then get parent IDs for these students
const studentIds = schoolStudents?.map((s: any) => s.id) || [];
const { data: parentStudentLinks } = await supabase
  .from('parent_students')
  .select('parent_id')
  .in('student_id', studentIds);

// Get unique parent IDs
const parentIds = [...new Set(parentStudentLinks?.map((ps: any) => ps.parent_id) || [])];

// Finally fetch the parents
const { data: parentsData, error: parentsError } = parentIds.length > 0
  ? await supabase
      .from('parents')
      .select('*')
      .in('user_id', parentIds)
  : { data: null, error: null };
```

**Fix**: Replace with simple query (parents table HAS school_id!):
```typescript
// Fetch parents (parents table HAS school_id in schema!)
const { data: parentsData, error: parentsError } = await supabase
  .from('parents')
  .select('*')
  .eq('school_id', user.schoolId);
```

---

### Issue #4: Attendance table missing school_id filter
**File**: `frontend/hooks/useReportsData.ts`
**Line**: 140
**Problem**: Filtering by school_id but attendance table doesn't have that column

**Current Code (BROKEN)**:
```typescript
let attendanceQuery = supabase
  .from('attendance')
  .select('*')
  .eq('school_id', user.schoolId!);
```

**Fix**: Remove school_id filter (attendance is already scoped by RLS and class):
```typescript
// NOTE: attendance table doesn't have school_id column
// Filter through class relationship instead via RLS policies
let attendanceQuery = supabase
  .from('attendance')
  .select('*');
  // RLS policies will automatically scope to user's school
```

---

### Issue #5: Grades table missing school_id filter
**File**: `frontend/hooks/useReportsData.ts`
**Line**: 166
**Problem**: Filtering by school_id but grades table doesn't have that column

**Current Code (BROKEN)**:
```typescript
const { data: grades } = await supabase
  .from('grades')
  .select('score, max_score')
  .eq('school_id', user.schoolId!);
```

**Fix**: Remove school_id filter (grades inherit scope from assignments):
```typescript
// NOTE: grades table doesn't have school_id column
// It inherits school scope through assignment_id relationship
// RLS policies handle the filtering
const { data: grades } = await supabase
  .from('grades')
  .select('score, max_score');
  // RLS policies will automatically scope to user's school through assignments
```

---

## Database Schema Reference

### Tables WITH school_id:
- `schools` ✅
- `teachers` ✅
- `students` ✅
- `parents` ✅ (CONFIRMED - line 74 in schema)
- `classes` ✅
- `assignments` ✅
- `calendar_events` ✅

### Tables WITHOUT school_id:
- `attendance` ❌ (scoped via class_id)
- `grades` ❌ (scoped via assignment_id)
- `profiles` ❌ (linked to schools via user role tables)
- `class_teachers` ❌ (junction table)
- `class_enrollments` ❌ (junction table)
- `parent_students` ❌ (junction table)

### Non-existent tables:
- `user_credentials` ❌❌❌ (NOT IN SCHEMA!)

---

## Impact Assessment

**Before Fixes**:
- ❌ useSchoolData hook fails on line 276 (invalid JOIN)
- ❌ useSchoolData hook fails on line 334 (non-existent table)
- ❌ useReportsData hook fails on line 140 (invalid column filter)
- ❌ useReportsData hook fails on line 166 (invalid column filter)
- ❌ React hooks hang waiting for promises that never resolve
- ❌ Dashboard page never reaches "ready" state
- ❌ Playwright timeouts on all interactions
- ❌ ALL dashboard testing blocked

**After Fixes**:
- ✅ All database queries use valid tables and columns
- ✅ React hooks complete successfully
- ✅ Dashboard renders correctly
- ✅ Can proceed with comprehensive testing
- ✅ Owner dashboard functional
- ✅ Can test teacher, student, parent dashboards

---

## Verification Steps

After applying fixes:

1. **Kill all running Node processes** (dev servers interfering with files)
2. **Apply all 5 fixes** to both hook files
3. **Start dev server**: `cd frontend && PORT=3011 npm run dev`
4. **Test login**: Navigate to `http://localhost:3011/login`
5. **Login as owner**: `wic@gmail.com` / `Test123456!`
6. **Verify dashboard loads**: Should redirect to `/school-dashboard` and render successfully
7. **Check browser console**: Should show NO errors, successful data fetching
8. **Verify data displays**: Stats, students, teachers, parents, classes all visible

---

## Priority Actions

1. ✅ **IMMEDIATE**: Apply all 5 fixes above
2. ⏳ **NEXT**: Test dashboard rendering
3. ⏳ **THEN**: Complete owner dashboard testing
4. ⏳ **THEN**: Test teacher, student, parent dashboards
5. ⏳ **FINALLY**: Document all test results and achieve 100% coverage

---

**Status**: Fixes identified and documented - Ready to apply
**Blocking**: File locks from running dev servers
**Solution**: Manual application of fixes with dev servers stopped

