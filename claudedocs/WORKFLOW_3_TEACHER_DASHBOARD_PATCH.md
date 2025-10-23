# WORKFLOW #3: TeacherDashboard.tsx Homework API Integration Patch

**Created**: 2025-10-22
**Status**: Ready to apply (file locks prevented automated application)
**File**: `frontend/components/dashboard/TeacherDashboard.tsx`

## Issue Encountered
Multiple dev servers running caused file locks preventing Edit tool from modifying the file. This patch documents the EXACT changes needed.

## Changes Required

### Change 1: Add Imports (Lines 14-20)

**BEFORE**:
```typescript
import MessagesPanel from '@/components/messages/MessagesPanel';
import GradebookPanel from '@/components/gradebook/GradebookPanel';
import CalendarPanel from '@/components/calendar/CalendarPanel';
import MasteryPanel from '@/components/mastery/MasteryPanel';
import AssignmentsPanel from '@/components/assignments/AssignmentsPanel';
import AttendancePanel from '@/components/attendance/AttendancePanel';
import ClassesPanel from '@/components/classes/ClassesPanel';
```

**AFTER**:
```typescript
import { useAuthStore } from '@/store/authStore';
import { useHomework } from '@/hooks/useHomework';
import { SURAH_NAMES } from '@/lib/types/homework';
import MessagesPanel from '@/components/messages/MessagesPanel';
import GradebookPanel from '@/components/gradebook/GradebookPanel';
import CalendarPanel from '@/components/calendar/CalendarPanel';
import MasteryPanel from '@/components/mastery/MasteryPanel';
import AssignmentsPanel from '@/components/assignments/AssignmentsPanel';
import AttendancePanel from '@/components/attendance/AttendancePanel';
import ClassesPanel from '@/components/classes/ClassesPanel';
```

### Change 2: Replace Homework State (Lines 28-31)

**BEFORE**:
```typescript
  // Homework State
  const [homeworkList, setHomeworkList] = useState<any[]>([]);
  const [homeworkFilter, setHomeworkFilter] = useState('all');
  const [showHomeworkDetail, setShowHomeworkDetail] = useState<any>(null);
```

**AFTER**:
```typescript
  // Auth
  const { user } = useAuthStore();

  // Homework API Integration
  const {
    homeworkList: apiHomeworkList,
    isLoading: homeworkLoading,
    fetchHomework,
    completeHomework,
    getPendingCount,
  } = useHomework();

  // Homework State
  const [homeworkFilter, setHomeworkFilter] = useState('all');
  const [showHomeworkDetail, setShowHomeworkDetail] = useState<any>(null);
```

### Change 3: Replace Hardcoded homeworkData (Lines 68-112)

**BEFORE**:
```typescript
  // Sample homework data (green highlights)
  const [homeworkData] = useState([
    {
      id: 'HW001',
      studentName: 'Ahmed Hassan',
      studentId: 'STU001',
      class: 'Class 6A',
      surah: 'Al-Mulk',
      ayahRange: '1-10',
      note: 'Memorize these verses by Thursday',
      assignedDate: '2025-01-18',
      dueDate: '2025-01-25',
      status: 'pending',
      replies: 2,
      color: 'green'
    },
    // ... more hardcoded items
  ]);
```

**AFTER**:
```typescript
  // Fetch homework from API on mount or when user changes
  useEffect(() => {
    if (user?.id) {
      // Fetch homework for this teacher
      fetchHomework({ include_completed: true });
    }
  }, [user?.id, fetchHomework]);

  // Transform API data to match UI expectations
  const homeworkData = apiHomeworkList.map(hw => ({
    id: hw.id,
    studentName: hw.student?.display_name || 'Unknown Student',
    studentId: hw.student?.id || '',
    class: '', // Could be populated from student data if available
    surah: SURAH_NAMES[hw.surah]?.transliteration || `Surah ${hw.surah}`,
    ayahRange: `${hw.ayah_start}-${hw.ayah_end}`,
    note: hw.notes?.[0]?.text || '',
    assignedDate: new Date(hw.created_at).toLocaleDateString(),
    dueDate: hw.due_at ? new Date(hw.due_at).toLocaleDateString() : 'No due date',
    status: hw.color === 'gold' ? 'completed' : hw.color === 'green' ? 'pending' : 'pending',
    replies: hw.notes?.length || 0,
    color: hw.color
  }));
```

### Change 4: Update markHomeworkComplete Function (Lines 156-163)

**BEFORE**:
```typescript
  // Function to mark homework as complete (turns green to gold)
  const markHomeworkComplete = (homeworkId: string) => {
    setHomeworkList((prev: any) => prev.map((hw: any) =>
      hw.id === homeworkId
        ? { ...hw, status: 'completed', color: 'gold' }
        : hw
    ));
  };
```

**AFTER**:
```typescript
  // Function to mark homework as complete (turns green to gold)
  const markHomeworkComplete = async (homeworkId: string) => {
    const result = await completeHomework(homeworkId);
    if (result.success) {
      // Refresh homework list to get updated data
      fetchHomework({ include_completed: true });
    }
  };
```

## Data Transformation Logic

### API Response → UI Data Mapping

| API Field | UI Field | Transformation |
|-----------|----------|----------------|
| `hw.id` | `id` | Direct mapping |
| `hw.student.display_name` | `studentName` | Fallback: 'Unknown Student' |
| `hw.student.id` | `studentId` | Direct mapping |
| `hw.surah` | `surah` | Lookup in SURAH_NAMES or format as "Surah N" |
| `hw.ayah_start`, `hw.ayah_end` | `ayahRange` | Format: "start-end" |
| `hw.notes[0].text` | `note` | First note's text or empty string |
| `hw.created_at` | `assignedDate` | Format: `toLocaleDateString()` |
| `hw.due_at` | `dueDate` | Format: `toLocaleDateString()` or "No due date" |
| `hw.color` | `status` | green → 'pending', gold → 'completed' |
| `hw.notes.length` | `replies` | Count of notes/replies |
| `hw.color` | `color` | Direct mapping ('green' or 'gold') |

## Testing After Application

1. Start dev server: `npm run dev`
2. Navigate to Teacher Dashboard → Homework tab
3. Verify homework loads from API (not hardcoded data)
4. Test "Mark Complete" button calls API
5. Verify green → gold color transition works
6. Check loading states display correctly

## Dependencies

- ✅ `useHomework` hook created (frontend/hooks/useHomework.ts)
- ✅ API endpoints exist (/api/homework)
- ✅ Types defined (frontend/lib/types/homework.ts)
- ✅ SURAH_NAMES exported from homework types

## Status

**Ready to Apply**: All dependencies satisfied. File locks from dev servers prevented automated application. Manual application required or apply when dev servers stopped.

## Related Files

- `frontend/hooks/useHomework.ts` - Hook implementation (✅ Complete)
- `frontend/lib/types/homework.ts` - Type definitions (✅ Exists)
- `frontend/app/api/homework/route.ts` - API endpoint (✅ Exists)
