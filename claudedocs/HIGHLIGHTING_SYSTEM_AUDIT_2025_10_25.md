# HIGHLIGHTING SYSTEM AUDIT - October 25, 2025

## CRITICAL ISSUE: Highlighting System Not Connected to Backend

### Executive Summary
The Quran highlighting system in Student Management Dashboard is currently **ALL LOCAL STATE** with **ZERO backend integration**. Highlights are lost on page refresh and not student-specific.

---

## Current State Analysis

### 1. Frontend Implementation (LOCAL STATE ONLY)

**File**: `frontend/components/dashboard/StudentManagementDashboard.tsx`

**Current State Storage**:
```typescript
const [highlights, setHighlights] = useState<any[]>([]);  // LINE 80
// ❌ PROBLEM: Local state, not persisted to database
```

**Highlight Types Defined** (Lines 395-402):
```typescript
const mistakeTypes = [
  { id: 'recap', name: 'Recap/Review', color: 'purple' },
  { id: 'homework', name: 'Homework', color: 'green' },        // ✅ GREEN
  { id: 'tajweed', name: 'Tajweed', color: 'orange' },
  { id: 'haraka', name: 'Haraka', color: 'red' },
  { id: 'letter', name: 'Letter', color: 'brown' },
  { id: 'completed', name: 'Completed', color: 'gold' }       // ✅ GOLD
];
```

**Current Behavior**:
- ✅ User can highlight words with different colors
- ✅ UI correctly displays highlights
- ❌ Highlights stored in memory only
- ❌ Lost on page refresh
- ❌ Not student-specific
- ❌ No database persistence
- ❌ No API calls

---

### 2. Database Schema (EXISTS BUT NOT USED)

**Table**: `highlights` (from `CLAUDE.md` schema)

```sql
create table highlights (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  teacher_id uuid not null references teachers(id) on delete set null,
  student_id uuid not null references students(id) on delete cascade,
  script_id uuid not null references quran_scripts(id),
  ayah_id uuid not null references quran_ayahs(id),
  token_start int not null,
  token_end int not null,
  mistake mistake_type not null,  // ❌ ENUM mismatch with frontend
  color text not null,
  created_at timestamptz default now()
);
```

**ENUM Definition**:
```sql
create type mistake_type as enum ('recap','tajweed','haraka','letter');
```

**❌ CRITICAL MISMATCH**:
- Database ENUM: `['recap', 'tajweed', 'haraka', 'letter']`
- Frontend has: `['recap', 'homework', 'tajweed', 'haraka', 'letter', 'completed']`
- **Missing in DB**: `'homework'` and `'completed'`

---

### 3. What Documentation Says (CLAUDE.md)

**Highlight System Specification**:
```json
"quran_highlights": {
  "note": "Quran is selectable text (not PDF).",
  "mistake_types": ["recap", "tajweed", "haraka", "letter"],
  "color_map": {"recap":"purple","tajweed":"orange","haraka":"red","letter":"brown"},
  "span_model": "store ayah_id + token_start + token_end; stable across devices/scripts",
  "notes": ["text", "voice_m4a"],
  "history": "immutable event log, timestamps for teacher/student interactions"
}
```

**Assignment Lifecycle**:
```json
"assignment_lifecycle": {
  "statuses": ["assigned", "viewed", "submitted", "reviewed", "completed", "reopened"]
}
```

---

## Missing Implementation

### 1. API Endpoints (NONE EXIST)

**Required Endpoints**:
```typescript
// Highlights CRUD
GET    /api/highlights?student_id={id}           // Load student's highlights
POST   /api/highlights                           // Create new highlight
PUT    /api/highlights/{id}                      // Update highlight (e.g., mark completed)
DELETE /api/highlights/{id}                      // Remove highlight

// Assignment-Highlight Relationship
GET    /api/assignments/{id}/highlights          // Get highlights for assignment
POST   /api/assignments/{id}/complete            // Complete assignment → turn highlights gold
```

**❌ Current Status**: **ZERO API endpoints exist**

---

### 2. Database Migration Needed

**Required Changes**:
```sql
-- Add missing mistake types to ENUM
ALTER TYPE mistake_type ADD VALUE 'homework';
ALTER TYPE mistake_type ADD VALUE 'completed';

-- OR create new table to link highlights to assignments
CREATE TABLE assignment_highlights (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references assignments(id) on delete cascade,
  highlight_id uuid not null references highlights(id) on delete cascade,
  created_at timestamptz default now(),
  PRIMARY KEY (assignment_id, highlight_id)
);
```

---

### 3. Frontend Integration Gaps

**Missing Functionality**:

1. **Load Highlights on Mount**:
```typescript
useEffect(() => {
  if (studentInfo?.id) {
    // ❌ NOT IMPLEMENTED
    fetchHighlightsFromDatabase(studentInfo.id);
  }
}, [studentInfo]);
```

2. **Save Highlight to Database**:
```typescript
const handleTextSelection = async (ayahIndex, wordIndex) => {
  // ✅ Current: Updates local state
  setHighlights([...highlights, newHighlight]);

  // ❌ Missing: Save to database
  await saveHighlightToDatabase(newHighlight);
};
```

3. **Assignment Completion → Gold Highlighting**:
```typescript
const completeAssignment = async (assignmentId) => {
  // ❌ NOT IMPLEMENTED
  // Should: Update all related highlights to 'completed' (gold color)
  await markAssignmentHighlightsCompleted(assignmentId);
};
```

---

## Required Implementation Plan

### Phase 1: Database Schema Updates
1. ✅ Verify `highlights` table exists
2. ⚠️ Update `mistake_type` ENUM to include 'homework' and 'completed'
3. ⚠️ Create `assignment_highlights` junction table
4. ⚠️ Add RLS policies for student access
5. ⚠️ Create indexes for performance

### Phase 2: Backend API Implementation
1. ⚠️ Create `/api/highlights` route
2. ⚠️ Implement CRUD operations
3. ⚠️ Add authentication/authorization checks
4. ⚠️ Validate student_id matches current user
5. ⚠️ Handle assignment-highlight relationships

### Phase 3: Frontend Integration
1. ⚠️ Create `useHighlights` hook for data fetching
2. ⚠️ Replace local state with database calls
3. ⚠️ Implement optimistic UI updates
4. ⚠️ Add loading/error states
5. ⚠️ Handle assignment completion workflow

### Phase 4: Assignment-Highlight Workflow
1. ⚠️ Link highlights to assignments when created
2. ⚠️ Implement "mark as completed" → turn gold
3. ⚠️ Show assignment context in highlights
4. ⚠️ Teacher can review student highlights per assignment

---

## Critical Questions to Answer

1. **How should 'homework' highlights relate to assignments?**
   - When teacher creates assignment, highlights become 'homework' type?
   - Or teacher marks specific highlights as homework after creation?

2. **What triggers gold 'completed' highlighting?**
   - When assignment status → 'completed'?
   - When teacher manually marks highlights as reviewed?
   - Both?

3. **Who can create/modify highlights?**
   - Teachers create highlights for students
   - Students see them as read-only
   - Or students can create their own?

4. **Assignment-Highlight Relationship**:
   - One assignment can have multiple highlights
   - One highlight can belong to multiple assignments?
   - Or 1:1 relationship?

---

## Recommendations

### Immediate Actions Needed:
1. **DO NOT make any changes** until we understand the complete workflow
2. **Read all production documentation** to understand existing patterns
3. **Check if migrations already exist** for highlights table
4. **Verify RLS policies** for student data isolation
5. **Map out complete user journey** for teacher and student roles

### Architecture Decision Required:
- Should highlights be **tightly coupled** to assignments?
- Or should they be **independent** with optional assignment linkage?

---

## Status: ⚠️ REQUIRES DEEP AUDIT BEFORE PROCEEDING

**Next Steps**:
1. Review existing database migrations
2. Check if highlights API already partially exists
3. Understand teacher vs student permissions
4. Map out complete assignment lifecycle with highlights
5. Create detailed implementation specification

---

**Document Created**: October 25, 2025
**Author**: Claude Code Audit
**Status**: ANALYSIS COMPLETE - AWAITING USER CLARIFICATION
