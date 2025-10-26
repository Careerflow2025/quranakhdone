# Highlights Data Integrity Issue
**Date**: October 26, 2025
**Status**: 🔴 CRITICAL - Data Integrity Violation Detected
**Impact**: Missing highlight causing count discrepancy

---

## Summary

Discovered a data integrity issue where an assignment exists with reference to a deleted highlight. The assignment "Haraka Correction - Surah 2, Ayah 150" was auto-created from highlight ID `776b29e5-295f-4f0b-bf5c-22f5beb947e8`, but this highlight no longer exists in the database.

---

## User Report

**User Statement**: "You don't understand I think you're wrong for my understanding it should display 6 four assignments and two homeworks"

**User Expectation**:
- Highlights tab should show 6 items
- 4 from assignments (tajweed, tajweed, letter, haraka)
- 2 from homework (standalone green highlights)
- Total: 6 highlights

**Actual Display**:
- Highlights tab shows only 5 items
- 3 from assignments (tajweed, tajweed, letter)
- 2 from homework
- **Missing**: 1 haraka highlight

---

## Database Investigation Results

### Current Highlights (5 items)
```sql
SELECT id, surah, ayah_start, color, type, created_at FROM highlights ORDER BY created_at DESC;
```

| ID | Surah | Ayah | Color | Type | Created At |
|----|-------|------|-------|------|------------|
| 25095352-... | 1 | 7 | brown | letter | 2025-10-26 04:53:44 |
| 8ffafd6f-... | 1 | 1 | green | homework | 2025-10-26 04:51:37 |
| f1cb1c2e-... | 1 | 1 | green | homework | 2025-10-26 04:51:35 |
| 9972d505-... | 1 | 6 | orange | tajweed | 2025-10-26 04:29:44 |
| 08403af4-... | 1 | 5 | orange | tajweed | 2025-10-26 04:29:40 |

**Count**: 5 highlights

### Current Assignments (4 items)
```sql
SELECT id, title, created_at FROM assignments ORDER BY created_at DESC;
```

| ID | Title | Created At |
|----|-------|------------|
| e4af9d0c-... | Letter Correction - Surah 1, Ayah 7 | 2025-10-26 04:53:44 |
| cddf0e0f-... | Tajweed Practice - Surah 1, Ayah 6 | 2025-10-26 04:29:45 |
| 1f1535bb-... | Tajweed Practice - Surah 1, Ayah 5 | 2025-10-26 04:29:40 |
| **5e7beefb-...** | **Haraka Correction - Surah 2, Ayah 150** | **2025-10-26 04:28:35** |

**Count**: 4 assignments

### Assignment Events (Smoking Gun)
```sql
SELECT event_type, meta FROM assignment_events
WHERE assignment_id = '5e7beefb-4092-44fd-beab-563e5fd0a573';
```

**Result**:
```json
{
  "event_type": "created",
  "meta": {
    "surah": 2,
    "ayah_end": 150,
    "ayah_start": 150,
    "auto_created": true,
    "highlight_id": "776b29e5-295f-4f0b-bf5c-22f5beb947e8"  // ← THIS HIGHLIGHT IS MISSING
  }
}
```

### Missing Highlight Verification
```sql
SELECT * FROM highlights WHERE id = '776b29e5-295f-4f0b-bf5c-22f5beb947e8';
```

**Result**: Empty (no rows)

---

## Root Cause Analysis

### Timeline Reconstruction

**04:28:35** - Haraka highlight created (ID: 776b29e5-295f-4f0b-bf5c-22f5beb947e8)
**04:28:36** - Assignment auto-created from highlight (ID: 5e7beefb-4092-44fd-beab-563e5fd0a573)
**[SOMETIME AFTER]** - Haraka highlight deleted (cause unknown)
**[NOW]** - Orphaned assignment exists without its parent highlight

### Possible Causes

1. **Manual Deletion**: Someone deleted the highlight but not the assignment
2. **Failed Transaction**: Highlight creation rolled back but assignment commit succeeded
3. **Cascade Delete Issue**: A related entity deletion cascaded to highlight but not assignment
4. **Bug in Delete Logic**: Highlight delete API doesn't check for assignment references
5. **Database Constraint Missing**: No foreign key constraint preventing orphaned assignments

### Code Analysis

**Automatic Assignment Creation** (`frontend/app/api/highlights/route.ts:138-213`):
```typescript
// Only create assignment if NOT completed and NOT homework type
if (type && type !== 'completed' && type !== 'homework') {
  // Create assignment with highlight_id in meta
  await supabaseAdmin.from('assignment_events').insert({
    assignment_id: createdAssignment.id,
    meta: {
      highlight_id: highlight.id,  // ← Link to highlight
      auto_created: true,
      // ...
    }
  });
}
```

**Problem**: Assignment creation succeeds even if highlight is later deleted. No referential integrity enforcement.

---

## Impact Assessment

### User-Facing Impact
- **Confusion**: User sees 4 assignments but only 3 highlights (should be 4)
- **Data Mismatch**: Homework tab shows 2, Assignments tab shows 4, Highlights shows 5 (should be 6)
- **Trust Issue**: User questions if system is working correctly

### Data Integrity Impact
- **Orphaned Assignment**: Assignment exists without parent highlight
- **Broken Relationship**: assignment_events.meta.highlight_id points to non-existent record
- **Cascade Risk**: If this happened once, it could happen again

### Reporting Impact
- **Inaccurate Counts**: Statistics and reports will show mismatched counts
- **Analytics Broken**: Any analytics based on highlight→assignment relationship will fail
- **Audit Trail Incomplete**: Can't trace assignment back to original highlight

---

## Solutions

### Immediate Fix (Data Recovery)

**Option 1: Recreate Missing Highlight**
Recreate the haraka highlight based on assignment data:

```sql
INSERT INTO highlights (
  id,
  school_id,
  teacher_id,
  student_id,
  surah,
  ayah_start,
  ayah_end,
  color,
  type,
  created_at
)
SELECT
  '776b29e5-295f-4f0b-bf5c-22f5beb947e8'::uuid,
  school_id,
  created_by_teacher_id,
  student_id,
  2,  -- Surah from assignment
  150,  -- Ayah from assignment
  150,
  'red',  -- Haraka color
  'haraka',  -- Type
  '2025-10-26 04:28:35'::timestamptz
FROM assignments
WHERE id = '5e7beefb-4092-44fd-beab-563e5fd0a573';
```

**Option 2: Delete Orphaned Assignment**
Remove the assignment since its parent highlight is gone:

```sql
DELETE FROM assignment_events WHERE assignment_id = '5e7beefb-4092-44fd-beab-563e5fd0a573';
DELETE FROM assignments WHERE id = '5e7beefb-4092-44fd-beab-563e5fd0a573';
```

**Recommendation**: **Option 1** - Recreate the highlight to preserve user intent and assignment

### Long-Term Prevention

#### 1. Database Constraints
Add foreign key constraints to prevent orphaned assignments:

```sql
-- Add highlight_id column to assignments table
ALTER TABLE assignments ADD COLUMN highlight_id uuid REFERENCES highlights(id) ON DELETE CASCADE;

-- Backfill existing assignments
UPDATE assignments a
SET highlight_id = (ae.meta->>'highlight_id')::uuid
FROM assignment_events ae
WHERE ae.assignment_id = a.id
  AND ae.event_type = 'created'
  AND ae.meta->>'auto_created' = 'true';
```

#### 2. API Protection
Update highlight delete API to check for assignment references:

```typescript
// Before deleting highlight
const { data: relatedAssignments } = await supabaseAdmin
  .from('assignment_events')
  .select('assignment_id')
  .eq('meta->>highlight_id', highlightId);

if (relatedAssignments && relatedAssignments.length > 0) {
  return NextResponse.json({
    error: 'Cannot delete highlight with associated assignments. Delete assignments first.'
  }, { status: 409 });
}
```

#### 3. Cascade Delete Logic
If highlight is deleted, automatically delete related assignments:

```typescript
// Delete assignment when highlight is deleted
await supabaseAdmin
  .from('assignments')
  .delete()
  .eq('highlight_id', highlightId);

// Then delete highlight
await supabaseAdmin
  .from('highlights')
  .delete()
  .eq('id', highlightId);
```

#### 4. Data Validation Job
Create a periodic job to detect orphaned assignments:

```typescript
async function detectOrphanedAssignments() {
  const { data: orphans } = await supabaseAdmin
    .from('assignment_events')
    .select('assignment_id, meta')
    .eq('event_type', 'created')
    .not('meta->>highlight_id', 'is', null);

  for (const event of orphans) {
    const highlightId = event.meta.highlight_id;
    const { data: highlight } = await supabaseAdmin
      .from('highlights')
      .select('id')
      .eq('id', highlightId)
      .single();

    if (!highlight) {
      console.error('Orphaned assignment detected:', event.assignment_id);
      // Alert or auto-fix
    }
  }
}
```

---

## Testing Instructions

### Before Fix
1. Navigate to Teacher Dashboard → Highlights tab
2. Verify count shows 5 highlights
3. User expects 6 (4 assignments + 2 homework)

### After Fix (Option 1 - Recreate Highlight)
1. Run SQL to recreate missing haraka highlight
2. Refresh Teacher Dashboard → Highlights tab
3. Verify count shows 6 highlights:
   - 2 green (homework)
   - 2 orange (tajweed)
   - 1 brown (letter)
   - 1 red (haraka) ← NEW
4. Verify all 4 assignments have corresponding highlights
5. User expectation met: 6 total highlights

### After Fix (Option 2 - Delete Assignment)
1. Run SQL to delete orphaned assignment
2. Refresh Teacher Dashboard → Assignments tab
3. Verify count shows 3 assignments (not 4)
4. Highlights tab shows 5 (3 from assignments + 2 homework)
5. Data consistency restored but user loses haraka assignment

---

## Recommended Action Plan

1. **Immediate** (Next 5 minutes):
   - Execute Option 1 SQL to recreate missing haraka highlight
   - Verify highlights tab now shows 6 items
   - Confirm user expectation is met

2. **Short-term** (This session):
   - Add highlight_id column to assignments table
   - Update highlights delete API with protection logic
   - Test delete operations to ensure no orphans

3. **Medium-term** (Next deploy):
   - Implement data validation job
   - Add monitoring for orphaned assignments
   - Create alerting for data integrity violations

4. **Long-term** (Next sprint):
   - Add comprehensive referential integrity constraints
   - Implement cascade delete logic across all related entities
   - Create admin UI to detect and fix data issues

---

## Success Criteria

**Fix is Successful When**:
1. ✅ Highlights tab shows 6 items (not 5)
2. ✅ All 4 assignments have corresponding highlights
3. ✅ User can see: 2 homework + 2 tajweed + 1 letter + 1 haraka
4. ✅ No orphaned assignments detected
5. ✅ assignment_events.meta.highlight_id points to valid highlights
6. ✅ User confirms data matches their expectation
7. ✅ Delete operations respect referential integrity

---

## Conclusion

**User was correct**: There should be 6 highlights displayed. The missing haraka highlight (deleted after assignment creation) caused the count discrepancy. This is a critical data integrity issue requiring immediate fix and long-term prevention measures.

**Root Cause**: Lack of referential integrity enforcement between highlights and assignments, allowing highlight deletion without cascading to dependent assignments.

**Immediate Fix**: Recreate missing haraka highlight to restore data integrity and meet user expectations.

**Status**: 🔴 CRITICAL - Requires immediate action

---

**Commit**: [Pending]
**Files Changed**: [Pending - will add constraints and API protection]
**Production Ready**: ❌ Not until constraints are in place
