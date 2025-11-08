# Parent Dashboard - Quran View Implementation Guide

## Quick Start Implementation Checklist

### Phase 1: Setup (15 minutes)

#### 1.1 Add Required Imports
```typescript
// At top of ParentDashboard.tsx
import { useState, useEffect, useRef, useMemo } from 'react';
import { useHighlights } from '@/hooks/useHighlights';
import PenAnnotationCanvas from '@/components/dashboard/PenAnnotationCanvas';
import {
  getQuranByScriptId,
  getSurahByNumber,
  getScriptStyling,
  getDynamicScriptStyling
} from '@/data/quran/cleanQuranLoader';
import { surahList } from '@/data/quran/surahData';
import {
  getPageContent,
  getPageBySurahAyah,
  getSurahPageRange,
  TOTAL_MUSHAF_PAGES
} from '@/data/completeMushafPages';
import {
  Clock,
  Award,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Eye,
  UserCircle,
  AlertCircle
} from 'lucide-react';
```

#### 1.2 Add State Variables
```typescript
// Quran View States
const [selectedScript, setSelectedScript] = useState('uthmani-hafs');
const [currentSurah, setCurrentSurah] = useState(1);
const [currentPage, setCurrentPage] = useState(1);
const [quranText, setQuranText] = useState({ surah: '', ayahs: [] });
const [currentMushafPage, setCurrentMushafPage] = useState(1);
const [zoomLevel, setZoomLevel] = useState(100);
const quranContainerRef = useRef<HTMLDivElement>(null);

// Pen Annotation States (read-only)
const [penColor, setPenColor] = useState('#FF0000');
const [penWidth, setPenWidth] = useState(2);
const [eraserMode, setEraserMode] = useState(false);

// Highlights
const [highlights, setHighlights] = useState<any[]>([]);

// Mistake Types Constant
const mistakeTypes = [
  { id: 'recap', name: 'Recap/Review', color: 'purple', bgColor: 'bg-purple-100', textColor: 'text-purple-700' },
  { id: 'homework', name: 'Homework', color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-700' },
  { id: 'tajweed', name: 'Tajweed', color: 'orange', bgColor: 'bg-orange-100', textColor: 'text-orange-700' },
  { id: 'haraka', name: 'Haraka', color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-700' },
  { id: 'letter', name: 'Letter', color: 'brown', bgColor: 'bg-amber-100', textColor: 'text-amber-900' }
];
```

---

### Phase 2: Child Selection Logic (30 minutes)

#### 2.1 Add Current Child State
```typescript
// If not already present
const [currentChild, setCurrentChild] = useState<any>(null);
```

#### 2.2 Ensure Teacher ID is Fetched
```typescript
// This should already exist in your child selection logic
// Verify that currentChild has these fields:
// - id (student ID)
// - name
// - teacherId (fetched from class enrollment)
// - schoolId
```

#### 2.3 Add useHighlights Hook
```typescript
// Fetch highlights for current child
const {
  highlights: dbHighlights,
  isLoading: highlightsLoading,
  error: highlightsError,
  refreshHighlights
} = useHighlights(currentChild?.id);
```

---

### Phase 3: Load Quran Text (15 minutes)

#### 3.1 Add Load Quran Effect
```typescript
// Load Quran text when surah changes
useEffect(() => {
  async function loadQuranText() {
    try {
      const scriptData = await getQuranByScriptId(selectedScript);
      const surahData = scriptData.surahs.find((s: any) => s.number === currentSurah);

      if (surahData) {
        setQuranText({
          surah: surahData.englishName || surahList[currentSurah - 1]?.english || '',
          ayahs: surahData.ayahs || []
        });
      }
    } catch (error) {
      console.error('Error loading Quran text:', error);
    }
  }

  if (currentSurah) {
    loadQuranText();
  }
}, [currentSurah, selectedScript]);
```

---

### Phase 4: Transform Highlights (20 minutes)

#### 4.1 Add Highlights Transformation Effect
```typescript
// Transform database highlights to UI format
useEffect(() => {
  if (!dbHighlights || dbHighlights.length === 0) {
    setHighlights([]);
    return;
  }

  // Get current page data
  const pageData = getPageContent(currentMushafPage);
  if (!pageData) return;

  // Transform highlights to UI format with ayahIndex and wordIndex
  const pageHighlights: any[] = [];

  dbHighlights.forEach((dbHighlight: any) => {
    // Only show highlights for current surah
    if (dbHighlight.surah === currentSurah) {
      // Full ayah highlight (word_start and word_end are null)
      if (dbHighlight.word_start === null || dbHighlight.word_start === undefined) {
        const ayahIndex = dbHighlight.ayah - 1;
        const ayah = quranText.ayahs[ayahIndex];

        if (ayah && ayah.words) {
          ayah.words.forEach((word: any, wordIndex: number) => {
            pageHighlights.push({
              id: `${dbHighlight.id}-${ayahIndex}-${wordIndex}`,
              dbId: dbHighlight.id,
              ayahIndex: ayahIndex,
              wordIndex: wordIndex,
              mistakeType: dbHighlight.mistake_type,
              color: dbHighlight.color,
              isCompleted: dbHighlight.color === 'gold',
              surah: dbHighlight.surah,
              ayah: dbHighlight.ayah
            });
          });
        }
      } else {
        // Word-level highlight
        const ayahIndex = dbHighlight.ayah - 1;
        const startWord = dbHighlight.word_start;
        const endWord = dbHighlight.word_end;

        for (let wordIndex = startWord; wordIndex <= endWord; wordIndex++) {
          pageHighlights.push({
            id: `${dbHighlight.id}-${ayahIndex}-${wordIndex}`,
            dbId: dbHighlight.id,
            ayahIndex: ayahIndex,
            wordIndex: wordIndex,
            mistakeType: dbHighlight.mistake_type,
            color: dbHighlight.color,
            isCompleted: dbHighlight.color === 'gold',
            surah: dbHighlight.surah,
            ayah: dbHighlight.ayah
          });
        }
      }
    }
  });

  setHighlights(pageHighlights);
}, [dbHighlights, currentMushafPage, currentSurah, quranText]);
```

#### 4.2 Create Safe Highlights Memo
```typescript
const safeHighlights = useMemo(() => highlights || [], [highlights]);
```

---

### Phase 5: Add Highlight Click Handler (10 minutes)

```typescript
// Handle highlight click to open notes modal
const handleHighlightClick = (highlightId: any) => {
  console.log('🔍 handleHighlightClick called with ID:', highlightId);
  const clickedHighlight = highlights.find((h: any) => h.id === highlightId);

  if (clickedHighlight && clickedHighlight.dbId) {
    console.log('📝 Opening modal with dbId:', clickedHighlight.dbId);
    // TODO: Implement notes modal
    // setSelectedHighlightForNotes(clickedHighlight.dbId);
    // setShowNotesModal(true);
  } else {
    console.error('❌ No highlight found:', { clickedHighlight, highlightId });
  }
};
```

---

### Phase 6: Add Quran Tab UI (30 minutes)

#### 6.1 Add Child Context Banner
```typescript
{activeTab === 'quran' && currentChild && (
  <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-4 mb-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <UserCircle className="w-8 h-8" />
        <div>
          <h3 className="font-semibold">{currentChild.name}'s Quran Progress</h3>
          <p className="text-sm text-blue-100">
            Teacher: {currentChild.teacherId ? 'Assigned' : 'Not assigned'}
          </p>
        </div>
      </div>
      <Eye className="w-6 h-6" />
    </div>
  </div>
)}
```

#### 6.2 Add Warning for No Teacher
```typescript
{activeTab === 'quran' && currentChild && !currentChild.teacherId && (
  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
    <div className="flex items-center">
      <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
      <p className="text-sm text-yellow-800">
        No teacher assigned yet. Highlights will appear once a teacher is assigned.
      </p>
    </div>
  </div>
)}
```

#### 6.3 Paste Complete Quran View Code
```typescript
{activeTab === 'quran' && (
  <>
    {/* Context Banner */}
    {/* Warning Banner */}

    {!currentChild ? (
      <div className="text-center py-12">
        <p className="text-gray-500">Please select a child to view their Quran progress</p>
      </div>
    ) : (
      // PASTE THE ENTIRE QURAN VIEW CODE FROM EXTRACTION REPORT (lines 1092-1484)
      // Making sure to:
      // 1. Replace studentInfo.id → currentChild.id
      // 2. Replace studentInfo.teacherId → currentChild.teacherId
      <div className="grid grid-cols-12 gap-4">
        {/* Left Panel - Highlights Summary */}
        {/* Main Quran Viewer */}
        {/* Right Panel - Controls */}
      </div>
    )}
  </>
)}
```

---

### Phase 7: Testing (30 minutes)

#### 7.1 Test Checklist
```
□ Select different children - Quran view updates
□ Highlights display correctly for each child
□ Pen annotations load (if teacherId exists)
□ Page navigation works (1-604)
□ Zoom control functions
□ Click highlighted word (verify handleHighlightClick logs)
□ Verify read-only mode (no editing possible)
□ Test with child who has no teacher
□ Test with child who has no highlights
□ Verify performance (no lag when switching children)
```

#### 7.2 Console Verification
```typescript
// Add debug logs to verify data flow
useEffect(() => {
  console.log('🧒 Current Child:', currentChild);
  console.log('📖 Current Surah:', currentSurah);
  console.log('📄 Current Page:', currentMushafPage);
  console.log('✨ Highlights Count:', highlights.length);
}, [currentChild, currentSurah, currentMushafPage, highlights]);
```

---

## Critical Replacements Summary

### Find and Replace
Search for these patterns in the pasted code and replace:

| Find | Replace |
|------|---------|
| `studentInfo.id` | `currentChild.id` |
| `studentInfo.teacherId` | `currentChild.teacherId` |
| `studentInfo &&` | `currentChild &&` |

### Verify PenAnnotationCanvas Props
```typescript
<PenAnnotationCanvas
  studentId={currentChild.id}          // ✅ CHANGED
  teacherId={currentChild.teacherId}   // ✅ CHANGED
  pageNumber={currentMushafPage}
  scriptId={selectedScript}
  enabled={false}  // ✅ Keep disabled
  // ... other props unchanged
/>
```

---

## Common Issues & Solutions

### Issue 1: "Cannot read property 'id' of null"
**Solution**: Add null check
```typescript
{currentChild && currentChild.teacherId && (
  <PenAnnotationCanvas ... />
)}
```

### Issue 2: Highlights not displaying
**Solution**: Check data flow
```typescript
// Verify in console:
console.log('DB Highlights:', dbHighlights);
console.log('Transformed Highlights:', highlights);
console.log('Safe Highlights:', safeHighlights);
```

### Issue 3: Page navigation not working
**Solution**: Verify currentMushafPage state is updating
```typescript
// Add logging in button onClick
onClick={() => {
  console.log('Page change:', currentMushafPage);
  setCurrentMushafPage((prev: any) => Math.max(1, prev - 1));
}}
```

### Issue 4: Pen annotations not loading
**Solution**: Verify teacherId is present
```typescript
useEffect(() => {
  console.log('Teacher ID for pen annotations:', currentChild?.teacherId);
}, [currentChild]);
```

---

## Performance Optimization

### Memoize Expensive Calculations
```typescript
const safeHighlights = useMemo(() => {
  return highlights || [];
}, [highlights]);

const pageContent = useMemo(() => {
  const pageData = getPageContent(currentMushafPage);
  return pageData;
}, [currentMushafPage]);
```

### Debounce Child Selection
```typescript
// If child switching is slow, add debounce
const debouncedChildId = useDebounce(selectedChildId, 300);

useEffect(() => {
  // Fetch data with debounced ID
}, [debouncedChildId]);
```

---

## Security Verification

### RLS Policies Check
```sql
-- Run this query to verify parent can only see their children's data
SELECT *
FROM highlights
WHERE student_id = '[test_child_id]';
-- Should only work if parent is linked to this child
```

### Test Unauthorized Access
```typescript
// Try to manually set a child ID that parent doesn't own
// Should fail with RLS error
setCurrentChild({ id: 'unauthorized_child_id', ... });
// Expected: No highlights returned
```

---

## Next Steps After Implementation

1. **Add Notes Modal** - Implement viewing conversation notes when clicking highlights
2. **Add Script Selector** - If students can change scripts, add selector
3. **Add Progress Indicators** - Show completion percentage for surahs
4. **Add Bookmarks** - Let parents bookmark pages for quick access
5. **Add Export** - Export child's highlights as PDF report

---

## Support & Resources

- **Full Extraction Report**: `claudedocs/quran-view-extraction-report.md`
- **Source Code**: `frontend/components/dashboard/StudentDashboard.tsx` (lines 1092-1484)
- **Quran Data Utils**: `frontend/data/quran/cleanQuranLoader.ts`
- **Mushaf Pages**: `frontend/data/completeMushafPages.ts`
- **Highlights Hook**: `frontend/hooks/useHighlights.ts`

---

## Implementation Time Estimate

| Phase | Time | Status |
|-------|------|--------|
| Phase 1: Setup | 15 min | ⏳ |
| Phase 2: Child Selection | 30 min | ⏳ |
| Phase 3: Load Quran Text | 15 min | ⏳ |
| Phase 4: Transform Highlights | 20 min | ⏳ |
| Phase 5: Click Handler | 10 min | ⏳ |
| Phase 6: Add UI | 30 min | ⏳ |
| Phase 7: Testing | 30 min | ⏳ |
| **Total** | **~2.5 hours** | |

---

## Success Criteria

✅ Parent can select any child from dropdown
✅ Quran view displays for selected child
✅ Teacher highlights appear correctly
✅ Pen annotations load (if teacher assigned)
✅ Page navigation works smoothly
✅ Zoom control functions
✅ Highlighting click shows logs (modal pending)
✅ Read-only mode prevents editing
✅ Performance is acceptable (< 1s load time)
✅ No console errors
✅ RLS security verified

---

## END OF IMPLEMENTATION GUIDE
