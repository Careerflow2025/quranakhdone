# Production Testing Guide - Highlight → Assignment Workflow

**Date**: October 25, 2025
**Version**: Production v1.0
**Deployment**: https://quranakh.com

---

## ⚠️ CRITICAL: Pre-Testing Steps

### Step 1: Clear Fake Assignments from Database

**You MUST run this SQL in Supabase SQL Editor BEFORE testing:**

1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/editor
2. Open `clear_fake_assignments.sql` file (located in project root)
3. Copy and paste the SQL into Supabase SQL Editor
4. Execute the script
5. Verify output shows: "✅ All fake assignments cleared!"

**SQL Script Location**: `C:\quranakhfinalproduction\supabase\clear_fake_assignments.sql`

### Step 2: Wait for Deployment

**Netlify/Vercel Auto-Deployment Status**:
- Commit: `8d189bb` - "PRODUCTION READY: Complete Highlight → Assignment Workflow"
- Expected deployment time: 2-3 minutes
- Check deployment status at your hosting dashboard

**How to Verify Deployment**:
```bash
# Check latest commit on production
git log -1 --oneline
# Should show: 8d189bb PRODUCTION READY: Complete Highlight → Assignment Workflow
```

---

## 🎯 Complete Testing Checklist

### Test 1: Create Recap Highlight (Purple) → Should Create Assignment

**Steps**:
1. Login as Teacher
2. Navigate to **Student Management Dashboard**
3. Select any student
4. Click on a Quran word or ayah
5. Select **Purple (Recap)** from color picker
6. Verify highlight is created instantly (no Save button needed)

**Expected Results**:
- ✅ Highlight appears immediately in Student Management view
- ✅ Assignment created automatically with title: "Recap - Surah X, Ayah Y"
- ✅ Due date: 7 days from now
- ✅ Shows in **Teacher Dashboard → Assignments Tab**
- ✅ Shows in **School Dashboard → Assignments Tab**
- ✅ Shows in **Student Dashboard → Assignments Tab**
- ✅ Assignment status: "assigned"

**Database Verification**:
```sql
-- In Supabase SQL Editor
SELECT
  h.id as highlight_id,
  h.type,
  h.color,
  a.id as assignment_id,
  a.title,
  a.due_at,
  a.status
FROM highlights h
LEFT JOIN assignment_events ae ON ae.meta->>'highlight_id' = h.id::text
LEFT JOIN assignments a ON a.id = ae.assignment_id
WHERE h.type = 'recap'
ORDER BY h.created_at DESC
LIMIT 5;
```

**Expected Output**: Shows highlight linked to assignment via assignment_events.meta

---

### Test 2: Create Tajweed Highlight (Orange) → Should Create Assignment

**Steps**:
1. Login as Teacher
2. Navigate to **Student Management Dashboard**
3. Select any student
4. Click on a Quran word or ayah
5. Select **Orange (Tajweed)** from color picker
6. Verify highlight is created instantly

**Expected Results**:
- ✅ Highlight appears immediately
- ✅ Assignment created automatically with title: "Tajweed Practice - Surah X, Ayah Y"
- ✅ Due date: 3 days from now
- ✅ Shows in all dashboards (Teacher, School, Student)
- ✅ Assignment status: "assigned"

---

### Test 3: Create Haraka Highlight (Red) → Should Create Assignment

**Steps**:
1. Login as Teacher
2. Navigate to **Student Management Dashboard**
3. Select any student
4. Click on a Quran word or ayah
5. Select **Red (Haraka)** from color picker
6. Verify highlight is created instantly

**Expected Results**:
- ✅ Highlight appears immediately
- ✅ Assignment created automatically with title: "Haraka Correction - Surah X, Ayah Y"
- ✅ Due date: 3 days from now
- ✅ Shows in all dashboards
- ✅ Assignment status: "assigned"

---

### Test 4: Create Letter Highlight (Brown) → Should Create Assignment

**Steps**:
1. Login as Teacher
2. Navigate to **Student Management Dashboard**
3. Select any student
4. Click on a Quran word or ayah
5. Select **Brown (Letter)** from color picker
6. Verify highlight is created instantly

**Expected Results**:
- ✅ Highlight appears immediately
- ✅ Assignment created automatically with title: "Letter Correction - Surah X, Ayah Y"
- ✅ Due date: 3 days from now
- ✅ Shows in all dashboards
- ✅ Assignment status: "assigned"

---

### Test 5: Create Homework Highlight (Green) → NO Assignment Created

**Steps**:
1. Login as Teacher
2. Navigate to **Student Management Dashboard**
3. Select any student
4. Click on a Quran word or ayah
5. Select **Green (Homework)** from color picker
6. Verify highlight is created instantly

**Expected Results**:
- ✅ Highlight appears immediately
- ✅ **NO assignment created** (this is correct behavior)
- ✅ Shows in **Homework Tab ONLY** (not assignments tab)
- ✅ School Dashboard shows green highlight in homework section
- ✅ Console log: "ℹ️ Homework highlight - no assignment created (shows in homework tab)"

**Why No Assignment?**: Homework highlights are tracked separately and display in the homework tab across all dashboards.

---

### Test 6: Mark Highlight as Completed (Gold) → NO Assignment Created

**Steps**:
1. Login as Teacher
2. Navigate to **Student Management Dashboard**
3. Find existing highlight (any color)
4. Mark it as **Completed (Gold)**
5. Verify it turns gold

**Expected Results**:
- ✅ Highlight turns gold
- ✅ **NO new assignment created**
- ✅ If original highlight had assignment, assignment status changes to "completed"
- ✅ Shows as completed in all dashboards

---

### Test 7: Real-Time Cross-Dashboard Sync

**Steps**:
1. Open **3 browser windows** side by side:
   - Window 1: Teacher Dashboard (logged in as teacher)
   - Window 2: School Dashboard (logged in as owner/admin)
   - Window 3: Student Dashboard (logged in as student)
2. In **Window 1 (Teacher)**: Create a Purple (Recap) highlight
3. **Immediately check** Window 2 and Window 3

**Expected Results**:
- ✅ Window 1 (Teacher Dashboard → Assignments Tab): Shows new assignment
- ✅ Window 2 (School Dashboard → Assignments Tab): Shows new assignment
- ✅ Window 3 (Student Dashboard → Assignments Tab): Shows new assignment
- ✅ **All windows update within 1-2 seconds** (real-time sync)

---

### Test 8: School Dashboard Homework Display

**Steps**:
1. Login as Owner/Admin
2. Navigate to **School Dashboard**
3. Find **Homework Tab**
4. Verify it shows **green highlights only**

**Expected Results**:
- ✅ Shows **only green (homework) highlights**
- ✅ Does NOT show purple, orange, red, or brown highlights
- ✅ Query uses `.eq('type', 'homework')` correctly

**What Was Fixed**: Previously showed purple highlights (recap) due to wrong query `.eq('mistake_type', 'recap')`

---

### Test 9: Assignment Event Tracking

**Steps**:
1. Create any assignment-creating highlight (purple, orange, red, brown)
2. Check Supabase database for assignment_events

**Database Verification**:
```sql
-- In Supabase SQL Editor
SELECT
  ae.id,
  ae.event_type,
  ae.from_status,
  ae.to_status,
  ae.meta->>'highlight_id' as highlight_id,
  ae.meta->>'auto_created' as auto_created,
  ae.meta->>'surah' as surah,
  ae.created_at
FROM assignment_events ae
WHERE ae.meta->>'auto_created' = 'true'
ORDER BY ae.created_at DESC
LIMIT 5;
```

**Expected Results**:
- ✅ Shows event with `event_type = 'created'`
- ✅ Shows `meta.auto_created = true`
- ✅ Shows `meta.highlight_id` (UUID link to highlight)
- ✅ Shows surah, ayah_start, ayah_end in meta

---

### Test 10: Word-Level vs Ayah-Level Highlights

**Test 10a: Word-Level Highlight**
1. Click on **single word** in Quran
2. Create highlight (any type)
3. Check database:
```sql
SELECT word_start, word_end, surah, ayah_start
FROM highlights
WHERE id = 'YOUR_HIGHLIGHT_ID';
```
**Expected**: word_start and word_end are integers

**Test 10b: Ayah-Level Highlight**
1. Click on entire ayah number (not individual word)
2. Create highlight (any type)
3. Check database:
```sql
SELECT word_start, word_end, surah, ayah_start
FROM highlights
WHERE id = 'YOUR_HIGHLIGHT_ID';
```
**Expected**: word_start and word_end are NULL

---

## 🐛 Troubleshooting

### Issue: Assignments Not Appearing

**Check**:
1. Did you clear fake assignments first? (Run SQL script)
2. Is deployment complete? (Check hosting dashboard)
3. Browser cache? (Hard refresh: Ctrl+Shift+R)
4. Check browser console for errors (F12 → Console tab)

**Logs to Check**:
```
✅ Highlight created successfully: [UUID]
✅ Assignment created automatically: [UUID]
✅ Assignment event created
✅ Highlights refreshed
```

### Issue: School Dashboard Shows Wrong Highlights

**Check**:
- Line 859 in SchoolDashboard.tsx should be: `.eq('type', 'homework')`
- NOT: `.eq('mistake_type', 'recap')`

**Verify Fix**:
```bash
grep -n "eq('type', 'homework')" frontend/components/dashboard/SchoolDashboard.tsx
# Should show line 859
```

### Issue: Real-Time Sync Not Working

**Check**:
- StudentManagementDashboard.tsx lines 643-645 and 733-735 have `await refreshHighlights();`
- Browser console should show: "✅ Highlights refreshed"

**Verify Fix**:
```bash
grep -n "refreshHighlights()" frontend/components/dashboard/StudentManagementDashboard.tsx
# Should show lines 645 and 735
```

### Issue: Homework Highlights Creating Assignments

**Check**:
- `/api/highlights/route.ts` line 140 should have: `if (type && type !== 'completed' && type !== 'homework')`
- Console should show: "ℹ️ Homework highlight - no assignment created"

---

## 📊 Success Criteria

**All tests must pass for production approval:**

- ✅ Test 1: Purple highlights → Assignments created (7 days)
- ✅ Test 2: Orange highlights → Assignments created (3 days)
- ✅ Test 3: Red highlights → Assignments created (3 days)
- ✅ Test 4: Brown highlights → Assignments created (3 days)
- ✅ Test 5: Green highlights → NO assignments (homework tab only)
- ✅ Test 6: Gold highlights → NO new assignments (completion status)
- ✅ Test 7: Real-time sync across all dashboards (<2 seconds)
- ✅ Test 8: School Dashboard homework shows green only
- ✅ Test 9: Assignment events tracked with meta.highlight_id
- ✅ Test 10: Word-level and ayah-level highlights work correctly

---

## 🚀 Production Validation Complete

**When all tests pass**:
1. ✅ Mark system as production-ready
2. ✅ Monitor for 24 hours
3. ✅ Train teachers on new workflow
4. ✅ Celebrate successful deployment! 🎉

**If any test fails**:
1. Take screenshot of error
2. Check browser console (F12)
3. Check Supabase logs
4. Report to development team with:
   - Test number that failed
   - Expected vs actual behavior
   - Screenshots
   - Browser console errors

---

## 📝 Post-Deployment Notes

**What Changed in Production**:
1. Automatic assignment creation from highlights (recap, tajweed, haraka, letter)
2. Real-time dashboard synchronization
3. School Dashboard homework query fixed
4. Assignment-highlight linking via events
5. Type-based due date calculation

**What Did NOT Change**:
1. Homework highlights still show in homework tab (no assignments created)
2. Completed highlights still mark things as done (no new assignments)
3. User authentication and permissions
4. Database schema (no migrations needed)

**Rollback Plan** (if critical issues found):
```bash
# Revert to previous commit
git revert 8d189bb
git push origin main
```

---

**Testing Started**: [YOUR_DATE]
**Testing Completed**: [YOUR_DATE]
**Production Status**: [PENDING TESTING]
**Tester Name**: [YOUR_NAME]
