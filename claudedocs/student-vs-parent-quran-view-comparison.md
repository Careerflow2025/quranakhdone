# Student vs Parent Dashboard - Quran View Comparison

## Side-by-Side Key Differences

### Data Context

| Aspect | Student Dashboard | Parent Dashboard |
|--------|------------------|------------------|
| **User Context** | Authenticated student user | Authenticated parent user |
| **Data Source** | `studentInfo.id` (own ID) | `currentChild.id` (selected child) |
| **Teacher ID** | Fetched during auth | Fetched from child's class |
| **School ID** | From own profile | From child's profile |
| **Data Scope** | Own data only | Any linked child's data |

---

### State Variables

#### Student Dashboard
```typescript
const [studentInfo, setStudentInfo] = useState({
  id: '',
  name: 'Student',
  email: '',
  teacherId: '',
  schoolId: '',
  currentSurah: 1,
  // ...
});
```

#### Parent Dashboard
```typescript
const [currentChild, setCurrentChild] = useState({
  id: '',
  name: '',
  email: '',
  teacherId: '',
  schoolId: '',
  currentSurah: 1,
  // ...
});

// Additional state for child selection
const [children, setChildren] = useState([]);
const [selectedChildId, setSelectedChildId] = useState('');
```

---

### Authentication & Data Fetching

#### Student Dashboard
```typescript
useEffect(() => {
  async function fetchStudentData() {
    // Get current authenticated user
    const { data: { user } } = await supabase.auth.getUser();

    // Get student record
    const { data: studentData } = await supabase
      .from('students')
      .select(`
        id,
        user_id,
        profiles:user_id (
          display_name,
          email,
          school_id
        )
      `)
      .eq('user_id', user.id)
      .single();

    setStudentId(studentData.id);
    setStudentInfo({ ...studentData });

    // Get teacher ID from class enrollment
    // ...
  }

  fetchStudentData();
}, []);
```

#### Parent Dashboard
```typescript
useEffect(() => {
  async function fetchChildren() {
    // Get current authenticated user
    const { data: { user } } = await supabase.auth.getUser();

    // Get parent record
    const { data: parentData } = await supabase
      .from('parents')
      .select('id')
      .eq('user_id', user.id)
      .single();

    // Get linked children
    const { data: childrenData } = await supabase
      .from('parent_students')
      .select(`
        student_id,
        students (
          id,
          user_id,
          profiles:user_id (
            display_name,
            email,
            school_id
          )
        )
      `)
      .eq('parent_id', parentData.id);

    setChildren(childrenData);
    if (childrenData.length > 0) {
      setSelectedChildId(childrenData[0].student_id);
    }
  }

  fetchChildren();
}, []);

// Update currentChild when selection changes
useEffect(() => {
  if (selectedChildId) {
    const child = children.find(c => c.student_id === selectedChildId);
    if (child) {
      // Fetch teacher ID for this child
      fetchChildTeacherId(selectedChildId).then(teacherId => {
        setCurrentChild({
          id: selectedChildId,
          name: child.students.profiles.display_name,
          email: child.students.profiles.email,
          teacherId: teacherId,
          schoolId: child.students.profiles.school_id,
        });
      });
    }
  }
}, [selectedChildId, children]);
```

---

### Highlights Hook Usage

#### Student Dashboard
```typescript
const {
  highlights: dbHighlights,
  isLoading: highlightsLoading,
  error: highlightsError,
  refreshHighlights
} = useHighlights(studentId); // Own student ID
```

#### Parent Dashboard
```typescript
const {
  highlights: dbHighlights,
  isLoading: highlightsLoading,
  error: highlightsError,
  refreshHighlights
} = useHighlights(currentChild?.id); // Selected child's ID (with null check)
```

---

### PenAnnotationCanvas Component

#### Student Dashboard
```typescript
<PenAnnotationCanvas
  studentId={studentInfo.id}
  teacherId={studentInfo.teacherId}
  pageNumber={currentMushafPage}
  scriptId={selectedScript}
  enabled={false} // Read-only for students
  containerRef={quranContainerRef}
  // ...
/>
```

#### Parent Dashboard
```typescript
<PenAnnotationCanvas
  studentId={currentChild.id}      // CHANGED
  teacherId={currentChild.teacherId} // CHANGED
  pageNumber={currentMushafPage}
  scriptId={selectedScript}
  enabled={false} // Read-only for parents
  containerRef={quranContainerRef}
  // ...
/>
```

---

### UI Structure

#### Student Dashboard Header
```typescript
{activeTab === 'quran' && (
  <div className="grid grid-cols-12 gap-4">
    {/* Left Panel */}
    {/* Main Viewer */}
    {/* Right Panel */}
  </div>
)}
```

#### Parent Dashboard Header
```typescript
{activeTab === 'quran' && (
  <>
    {/* Context Banner - Shows child name */}
    {currentChild && (
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

    {/* Warning - No Teacher */}
    {currentChild && !currentChild.teacherId && (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
          <p className="text-sm text-yellow-800">
            No teacher assigned yet. Highlights will appear once a teacher is assigned.
          </p>
        </div>
      </div>
    )}

    {/* Main Content */}
    {!currentChild ? (
      <div className="text-center py-12">
        <p className="text-gray-500">Please select a child to view their Quran progress</p>
      </div>
    ) : (
      <div className="grid grid-cols-12 gap-4">
        {/* Left Panel */}
        {/* Main Viewer */}
        {/* Right Panel */}
      </div>
    )}
  </>
)}
```

---

### Child Selector (Parent Only)

#### Not Present in Student Dashboard

#### Required in Parent Dashboard
```typescript
{/* Child Selector */}
<div className="mb-4">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Select Child
  </label>
  <select
    value={selectedChildId}
    onChange={(e) => setSelectedChildId(e.target.value)}
    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
  >
    {children.map((child) => (
      <option key={child.student_id} value={child.student_id}>
        {child.students.profiles.display_name}
      </option>
    ))}
  </select>
</div>
```

---

### Conditional Rendering

#### Student Dashboard
```typescript
{activeTab === 'quran' && (
  <div className="grid grid-cols-12 gap-4">
    {/* Always renders when tab is active */}
  </div>
)}
```

#### Parent Dashboard
```typescript
{activeTab === 'quran' && (
  <>
    {!currentChild ? (
      <div className="text-center py-12">
        <p className="text-gray-500">Please select a child to view their Quran progress</p>
      </div>
    ) : (
      <div className="grid grid-cols-12 gap-4">
        {/* Only renders when child is selected */}
      </div>
    )}
  </>
)}
```

---

### Highlights Summary Panel

#### Student Dashboard
```typescript
<div className="col-span-2 space-y-3 max-h-screen overflow-hidden">
  <div className="bg-white rounded-lg shadow-sm p-3">
    <h3 className="font-semibold mb-2 text-sm flex items-center">
      <Clock className="w-3 h-3 mr-1" />
      Teacher Highlights
    </h3>
    {/* ... highlights content ... */}
  </div>
</div>
```

#### Parent Dashboard
```typescript
<div className="col-span-2 space-y-3 max-h-screen overflow-hidden">
  <div className="bg-white rounded-lg shadow-sm p-3">
    <h3 className="font-semibold mb-2 text-sm flex items-center">
      <Clock className="w-3 h-3 mr-1" />
      Teacher Highlights ({currentChild.name})  {/* Added child name */}
    </h3>
    {/* ... highlights content ... */}
  </div>
</div>
```

---

### Security (RLS Policies)

#### Student Dashboard Security
```sql
-- Students can only view their own highlights
CREATE POLICY "students_view_own_highlights"
ON highlights FOR SELECT
USING (student_id IN (
  SELECT id FROM students WHERE user_id = auth.uid()
));
```

#### Parent Dashboard Security
```sql
-- Parents can only view their children's highlights
CREATE POLICY "parents_view_children_highlights"
ON highlights FOR SELECT
USING (
  student_id IN (
    SELECT ps.student_id
    FROM parent_students ps
    JOIN parents p ON p.id = ps.parent_id
    WHERE p.user_id = auth.uid()
  )
);

-- Same for pen annotations
CREATE POLICY "parents_view_children_pen_annotations"
ON pen_annotations FOR SELECT
USING (
  student_id IN (
    SELECT ps.student_id
    FROM parent_students ps
    JOIN parents p ON p.id = ps.parent_id
    WHERE p.user_id = auth.uid()
  )
);
```

---

### Error Handling

#### Student Dashboard
```typescript
// Simple error state
if (studentError) {
  return <div>Error loading student data: {studentError}</div>;
}

if (isLoadingStudent) {
  return <div>Loading...</div>;
}
```

#### Parent Dashboard
```typescript
// More complex error states
if (parentError) {
  return <div>Error loading parent data: {parentError}</div>;
}

if (isLoadingParent) {
  return <div>Loading...</div>;
}

if (children.length === 0) {
  return (
    <div className="text-center py-12">
      <p className="text-gray-500">No children linked to your account</p>
      <p className="text-sm text-gray-400 mt-2">
        Contact your school administrator to link your children
      </p>
    </div>
  );
}

if (!currentChild) {
  return (
    <div className="text-center py-12">
      <p className="text-gray-500">Please select a child</p>
    </div>
  );
}

if (!currentChild.teacherId) {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div className="flex items-center">
        <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
        <p className="text-sm text-yellow-800">
          {currentChild.name} has no teacher assigned yet
        </p>
      </div>
    </div>
  );
}
```

---

### Loading States

#### Student Dashboard
```typescript
{highlightsLoading ? (
  <div className="text-xs text-gray-400 text-center py-2">
    Loading highlights...
  </div>
) : safeHighlights.length === 0 ? (
  <p className="text-xs text-gray-400 text-center py-2">No highlights</p>
) : (
  // Render highlights
)}
```

#### Parent Dashboard
```typescript
{!currentChild ? (
  <div className="text-center py-12">
    <p className="text-gray-500">Please select a child</p>
  </div>
) : highlightsLoading ? (
  <div className="text-xs text-gray-400 text-center py-2">
    Loading {currentChild.name}'s highlights...
  </div>
) : safeHighlights.length === 0 ? (
  <p className="text-xs text-gray-400 text-center py-2">
    No highlights for {currentChild.name}
  </p>
) : (
  // Render highlights
)}
```

---

### Navigation & Page Controls

#### Student Dashboard
```typescript
{/* Navigation - Full access to all 604 pages */}
const firstPage = 1;
const lastPage = 604;

<button
  onClick={() => setCurrentMushafPage((prev: any) => Math.max(firstPage, prev - 1))}
  disabled={isFirstPage}
  className={`p-2 ${isFirstPage ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-green-600 to-emerald-600'} text-white rounded-full`}
>
  <ChevronLeft className="w-5 h-5" />
</button>
```

#### Parent Dashboard
```typescript
{/* Navigation - Same as student, full access to all 604 pages */}
const firstPage = 1;
const lastPage = 604;

<button
  onClick={() => setCurrentMushafPage((prev: any) => Math.max(firstPage, prev - 1))}
  disabled={isFirstPage}
  className={`p-2 ${isFirstPage ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-green-600 to-emerald-600'} text-white rounded-full`}
>
  <ChevronLeft className="w-5 h-5" />
</button>
```

**Note**: Navigation is identical, no changes needed.

---

### Zoom Control

#### Both Dashboards - Identical
```typescript
<div className="col-span-2 space-y-3">
  <div className="bg-white rounded-lg shadow-sm p-3">
    <h3 className="font-semibold mb-2 text-sm">Zoom</h3>
    <div className="space-y-2">
      <input
        type="range"
        min="50"
        max="150"
        value={zoomLevel}
        onChange={(e) => setZoomLevel(parseInt(e.target.value))}
        className="w-full"
      />
      <div className="text-xs text-center text-gray-600">{zoomLevel}%</div>
    </div>
  </div>
</div>
```

**Note**: Zoom control is identical, no changes needed.

---

### Word Highlighting Display

#### Both Dashboards - Identical Logic
```typescript
{ayah.words.map((word: any, wordIndex: any) => {
  const wordText = typeof word === 'string' ? word : (word.text || word);

  // Get ALL highlights for this word
  const wordHighlights = safeHighlights.filter(
    (h: any) => h.ayahIndex === ayahIndex && h.wordIndex === wordIndex
  );

  // Check if completed
  const mistakes = wordHighlights.map((h: any) => {
    if (h.isCompleted) {
      return { id: 'completed', name: 'Completed', color: 'gold', bgColor: 'bg-yellow-400', textColor: 'text-yellow-900' };
    }
    return mistakeTypes.find((m: any) => m.id === h.mistakeType);
  }).filter(Boolean);

  return (
    <span
      key={`${ayahIndex}-${wordIndex}`}
      onClick={() => {
        if (wordHighlights.length > 0) {
          handleHighlightClick(wordHighlights[0].id);
        }
      }}
      className="inline cursor-pointer rounded transition-colors select-none"
      style={{
        color: '#000000',
        pointerEvents: 'auto',
        // ... highlight styling ...
      }}
    >
      {wordText}{' '}
    </span>
  );
})}
```

**Note**: Word highlighting logic is identical, no changes needed.

---

## Summary of Changes Required

### 1. State Variables
- Add `children` and `selectedChildId` states
- Rename `studentInfo` to `currentChild` (or create new state)

### 2. Data Fetching
- Add parent authentication logic
- Fetch children list
- Fetch teacher ID for selected child

### 3. Hooks
- Update `useHighlights(currentChild?.id)` with null check

### 4. UI Components
- Add child selector dropdown
- Add context banner showing child name
- Add warning for no teacher assigned
- Add empty state for no child selected

### 5. Props Updates
- Update `PenAnnotationCanvas` props to use `currentChild`

### 6. Conditional Rendering
- Wrap Quran view in conditional for child selection

### 7. Security
- Verify RLS policies allow parent access to children's data

---

## What Stays the Same

✅ Quran text loading logic
✅ Highlight transformation logic
✅ Word highlighting styling
✅ Page navigation (1-604)
✅ Zoom control
✅ Ayah number display
✅ Notes indicator icons
✅ Basmala display
✅ Mushaf page styling
✅ Grid layout (3-column)
✅ Mistake types constant
✅ Read-only mode (enabled=false)

---

## Critical Success Factors

1. **Null Safety**: Always check `currentChild` before accessing properties
2. **Teacher ID**: Ensure it's fetched from child's class enrollment
3. **RLS Policies**: Verify parent can only access linked children's data
4. **Child Selection**: Must be present and functional before Quran view
5. **Context Clarity**: UI must clearly show which child is being viewed
6. **Performance**: Switching children should be fast (< 1 second)

---

## Testing Scenarios

### Student Dashboard
- ✅ Login as student
- ✅ View own highlights
- ✅ Navigate pages
- ✅ Zoom in/out
- ✅ Click highlighted words

### Parent Dashboard
- ✅ Login as parent with multiple children
- ✅ Select Child A → see Child A's highlights
- ✅ Switch to Child B → see Child B's highlights
- ✅ Navigate pages for each child
- ✅ Zoom in/out
- ✅ Click highlighted words
- ✅ Handle child with no teacher
- ✅ Handle child with no highlights

---

## END OF COMPARISON
