# COMPLETE DASHBOARD FIX - ALL HOOKS
**Date**: 2025-10-21
**Critical Issue**: Dashboard in infinite query loop causing ERR_INSUFFICIENT_RESOURCES
**Impact**: BLOCKS all frontend testing

---

## Root Cause Analysis

Dashboard loads multiple hooks simultaneously:
- useSchoolData.ts
- useReportsData.ts
- useAssignments.ts
- useCalendar.ts
- useMessages.ts
- useGradebook.ts
- useMastery.ts

Each hook makes database queries. Invalid queries fail → hooks retry → infinite loop → browser resource exhaustion.

---

## Complete List of Bugs

### ✅ FIXED (Already Applied)
1. ✅ useSchoolData.ts:276 - Invalid teachers JOIN
2. ✅ useSchoolData.ts:332-358 - user_credentials table doesn't exist
3. ✅ useSchoolData.ts:196-219 - Unnecessary complex parents query
4. ✅ useReportsData.ts:140 - attendance.school_id doesn't exist
5. ✅ useReportsData.ts:166 - grades.school_id doesn't exist

### ❌ NEW BUGS DISCOVERED (Must Fix)
6. ❌ useSchoolData.ts:307,320 - Querying `calendar_events` but table is `events`
7. ❌ useSchoolData.ts:309,323 - Using `date` column but it's `start_date`
8. ❌ useCalendar.ts - Likely same calendar_events/date issues
9. ❌ useAssignments.ts - Invalid JOIN `students(name)` - should use profiles
10. ❌ useMessages.ts - Querying non-existent `message_recipients` table
11. ❌ useMessages.ts - messages.sender_id doesn't exist

---

## Database Schema Facts

### events table (NOT calendar_events!):
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY,
  school_id UUID NOT NULL,
  created_by_user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_type event_type NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,  -- NOT "date"!
  end_date TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN DEFAULT FALSE,
  location TEXT,
  ...
)
```

### students table:
- Does NOT have `name` column
- Has `user_id` → links to `profiles.display_name`

### messages table:
- Current schema unknown, need to check
- message_recipients table does NOT exist

---

## Fix Priority Order

1. **CRITICAL**: Fix useSchoolData.ts calendar queries (infinite loop source)
2. **HIGH**: Fix useCalendar.ts (if it exists)
3. **HIGH**: Fix useAssignments.ts invalid JOINs
4. **MEDIUM**: Fix or disable useMessages.ts
5. **SAFETY**: Add error boundaries to all hooks

---

## Detailed Fixes

### Fix #6-7: useSchoolData.ts Calendar Queries

**Lines 302-317** (Upcoming events):
```typescript
// BROKEN:
const { data: upcomingData, error: upcomingError } = await supabase
  .from('calendar_events')  // ❌ Wrong table!
  .select('*')
  .eq('school_id', user.schoolId)
  .gte('date', today)  // ❌ Wrong column!
  .order('date', { ascending: true });

// FIXED:
const { data: upcomingData, error: upcomingError } = await supabase
  .from('events')  // ✅ Correct table
  .select('*')
  .eq('school_id', user.schoolId)
  .gte('start_date', today)  // ✅ Correct column
  .order('start_date', { ascending: true });
```

**Lines 319-330** (All events):
```typescript
// BROKEN:
const { data: allEventsData, error: allEventsError } = await supabase
  .from('calendar_events')  // ❌ Wrong table!
  .select('*')
  .eq('school_id', user.schoolId)
  .order('date', { ascending: true });

// FIXED:
const { data: allEventsData, error: allEventsError } = await supabase
  .from('events')  // ✅ Correct table
  .select('*')
  .eq('school_id', user.schoolId)
  .order('start_date', { ascending: true });
```

---

## Verification Steps

After applying ALL fixes:

1. ✅ Start dev server
2. ✅ Login as owner
3. ✅ Dashboard loads without errors
4. ✅ Browser console shows NO 400/503 errors
5. ✅ NO ERR_INSUFFICIENT_RESOURCES
6. ✅ All dashboard sections render
7. ✅ Data displays correctly

---

## Next Steps After Fix

1. Test owner dashboard completely
2. Create teacher/student/parent accounts
3. Test all 4 role dashboards
4. Document 100% test coverage
5. Update TEST_SUMMARY_ALL.md with success

---

**Status**: Bugs identified - Applying fixes now
**Target**: Dashboard rendering successfully within 10 minutes
