# WORKFLOW #3: StudentDashboard.tsx Homework API Integration Patch

**Created**: 2025-10-22
**Status**: Ready to apply (file locks prevented automated application)
**File**: `frontend/components/dashboard/StudentDashboard.tsx`

## Overview

StudentDashboard uses a `highlights` array (line 211) for both:
1. **Quran text word highlighting** - visual highlighting of words in Quran
2. **Homework/assignment lists** - displaying homework and assignments to students

The integration will fetch real homework data from API while maintaining the highlights structure for Quran text rendering.

## Changes Required

### Change 1: Add Imports (After line 16)

**AFTER line 16** (`import AttendancePanel from '@/components/attendance/AttendancePanel';`):
```typescript
import { useAuthStore } from '@/store/authStore';
import { useHomework } from '@/hooks/useHomework';
import { SURAH_NAMES } from '@/lib/types/homework';
```

### Change 2: Add Auth and Homework Hook (After line 87)

**AFTER line 87** (after `studentInfo` state):
```typescript
  // Auth
  const { user } = useAuthStore();

  // Homework API Integration
  const {
    homeworkList: apiHomeworkList,
    isLoading: homeworkLoading,
    fetchStudentHomework,
    error: homeworkError,
  } = useHomework();
```

### Change 3: Fetch Student Homework (After line 102)

**AFTER line 102** (after assignment filters):
```typescript
  // Fetch homework for student on mount
  useEffect(() => {
    if (user?.id && studentInfo.id) {
      fetchStudentHomework(studentInfo.id);
    }
  }, [user?.id, studentInfo.id, fetchStudentHomework]);
```

### Change 4: Replace Hardcoded Homework in Highlights Array (Lines 211-245)

**BEFORE** (lines 211-245 - partial):
```typescript
  const [highlights, setHighlights] = useState([
    // Homework (Green highlights)
    {
      id: 'hw1',
      type: 'homework',
      surah: 1,
      ayahIndex: 0,
      wordIndices: [0, 1, 2],
      mistakeType: 'homework',
      color: 'bg-green-200',
      teacherNote: 'Practice this verse for tomorrow\'s class',
      timestamp: '2 hours ago',
      teacherName: 'Ustadh Ahmed',
      dueDate: 'Tomorrow',
      status: 'pending',
      replies: []
    },
    // ... more hardcoded items
  ]);
```

**AFTER**:
```typescript
  // Transform API homework into highlights format
  const homeworkHighlights = apiHomeworkList
    .filter(hw => hw.color === 'green') // Only pending homework
    .map(hw => ({
      id: hw.id,
      type: 'homework',
      surah: hw.surah,
      ayahIndex: hw.ayah_start - 1, // Convert to 0-indexed
      wordIndices: [], // Would need word-level data from API
      mistakeType: 'homework',
      color: 'bg-green-200',
      teacherNote: hw.notes?.[0]?.text || '',
      timestamp: new Date(hw.created_at).toLocaleDateString(),
      teacherName: hw.teacher?.display_name || 'Teacher',
      dueDate: hw.due_at ? new Date(hw.due_at).toLocaleDateString() : 'No due date',
      status: hw.color === 'green' ? 'pending' : hw.color === 'gold' ? 'completed' : 'pending',
      replies: hw.notes?.map((note: any) => ({
        id: note.id,
        text: note.text,
        timestamp: new Date(note.created_at).toLocaleDateString(),
        type: note.type,
        isStudent: false
      })) || []
    }));

  // Combine API homework with any existing non-homework highlights
  // (assignments, other highlights if they exist in DB)
  const [highlights, setHighlights] = useState([
    // Assignment highlights would go here if fetched from API
    // For now, keeping structure for future integration
  ]);

  // Merge API homework into highlights
  const allHighlights = [...homeworkHighlights, ...highlights];
```

### Change 5: Update Homework Tab Rendering (Lines 1000-1100+)

**UPDATE** the homework tab to use `allHighlights` instead of `highlights`:

Find all instances of:
```typescript
highlights.filter((h: any) => h.type === 'homework')
```

Replace with:
```typescript
allHighlights.filter((h: any) => h.type === 'homework')
```

**Specific locations to update**:
- Line 705: Badge counter in tab
- Line 707: Badge counter value
- Line 1014: Total count display
- Line 1058-1068: Homework filtering and mapping

### Change 6: Add Loading State to Homework Tab

**ADD** loading indicator at the beginning of homework tab (after line 1006):
```typescript
        {activeTab === 'homework' && (
          <div className="space-y-6">
            {/* Loading State */}
            {homeworkLoading && (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading homework...</p>
              </div>
            )}

            {/* Error State */}
            {homeworkError && !homeworkLoading && (
              <div className="bg-red-50 rounded-xl shadow-sm p-6">
                <p className="text-red-600">Error loading homework: {homeworkError}</p>
              </div>
            )}

            {/* Homework Content */}
            {!homeworkLoading && !homeworkError && (
              <>
                {/* Search and Filters section */}
                ...existing content...
              </>
            )}
          </div>
        )}
```

## Data Transformation Logic

### API Homework → Student Highlights Mapping

| API Field | Highlight Field | Transformation |
|-----------|-----------------|----------------|
| `hw.id` | `id` | Direct mapping |
| `'homework'` | `type` | Constant value |
| `hw.surah` | `surah` | Direct mapping (1-114) |
| `hw.ayah_start` | `ayahIndex` | Convert to 0-indexed: `ayah_start - 1` |
| `[]` | `wordIndices` | Empty array (word-level highlighting not in current API) |
| `'homework'` | `mistakeType` | Constant value |
| `'bg-green-200'` | `color` | Constant for pending homework |
| `hw.notes[0].text` | `teacherNote` | First note or empty string |
| `hw.created_at` | `timestamp` | Format: `toLocaleDateString()` |
| `hw.teacher.display_name` | `teacherName` | Teacher name or fallback |
| `hw.due_at` | `dueDate` | Format: `toLocaleDateString()` or "No due date" |
| `hw.color` | `status` | green → 'pending', gold → 'completed' |
| `hw.notes` | `replies` | Transform to reply format |

## Important Notes

### Word-Level Highlighting
Currently, the API returns homework at the **ayah level** (surah + ayah_start + ayah_end), but the StudentDashboard UI supports **word-level highlighting** (`wordIndices` array).

**Current Approach**: Set `wordIndices: []` (empty array) until API supports word-level data.

**Future Enhancement**: When API is updated to include word positions, update the transformation to populate `wordIndices` properly.

### Highlight Types
The `highlights` array serves dual purpose:
1. **Visual highlighting**: Words in Quran text (requires wordIndices)
2. **List display**: Homework/assignment cards (doesn't need wordIndices)

The current integration focuses on **list display** functionality. Word-level highlighting will show full ayah highlighting instead of specific words until API is enhanced.

## Testing After Application

1. Start dev server: `npm run dev`
2. Log in as a student
3. Navigate to Student Dashboard → Homework tab
4. Verify:
   - Homework loads from API (not hardcoded)
   - Loading state displays while fetching
   - Error state displays if fetch fails
   - Homework cards show correct data
   - Badge counters update correctly
   - Filtering and search work with API data

## Dependencies

- ✅ `useHomework` hook created (frontend/hooks/useHomework.ts)
- ✅ API endpoint exists: GET /api/homework/student/:id
- ✅ Types defined (frontend/lib/types/homework.ts)
- ✅ SURAH_NAMES exported from homework types

## Status

**Ready to Apply**: All dependencies satisfied. File locks from dev servers prevented automated application. Manual application required or apply when dev servers stopped.

## Related Files

- `frontend/hooks/useHomework.ts` - Hook implementation (✅ Complete)
- `frontend/lib/types/homework.ts` - Type definitions (✅ Exists)
- `frontend/app/api/homework/student/[id]/route.ts` - Student homework endpoint (✅ Exists)
- `WORKFLOW_3_TEACHER_DASHBOARD_PATCH.md` - Related TeacherDashboard patch

## Future Enhancements

1. **Word-Level Highlighting**: Update API to return word positions for granular highlighting
2. **Real-Time Updates**: Add WebSocket or polling for live homework updates
3. **Offline Support**: Cache homework data for offline viewing
4. **Assignment Integration**: Similar API integration for assignments (not just homework)
