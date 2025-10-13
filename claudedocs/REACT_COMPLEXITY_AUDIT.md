# React Components Complexity Audit Report

**Date**: 2025-10-13
**Scope**: All React components excluding flow mode components
**Total Components Analyzed**: 53 component files

---

## Executive Summary

### Total Issues by Severity
- **HIGH**: 12 critical complexity issues requiring immediate refactoring
- **MEDIUM**: 24 moderate issues that should be addressed soon
- **LOW**: 18 minor improvements for maintainability

### Top Complexity Metrics
- **Total Lines Analyzed**: ~15,000 LOC
- **Average Component Size**: 283 lines
- **Components Over 300 Lines**: 8 (15%)
- **Components with >5 useState**: 6 (11%)
- **Components with >3 useEffect**: 5 (9%)

### Critical Findings
1. **JsonEditor** (436 lines) - Excessive complexity, multiple responsibilities
2. **PublishModal** (442 lines) - Complex form logic, duplicate tag management
3. **ShareModal** (657 lines) - Massive component with deeply nested conditionals
4. **ViewerCompare** (634 lines) - Multiple editors with complex synchronization
5. **Sidebar** (384 lines) - Mixed concerns (navigation, file upload, state management)

---

## 1. Component Size & Structure Issues

### HIGH SEVERITY

#### ShareModal - 657 lines
**File**: `components/features/modals/share-modal.tsx`
**Complexity Score**: 94/100

**Issues**:
- 657 lines is 4x the recommended maximum (150 lines)
- 11 useState hooks (recommended max: 5)
- 5 useEffect hooks with complex dependencies
- Deeply nested JSX (7 levels in tag rendering section)
- Handles multiple responsibilities: sharing, publishing, tag management, metadata editing

**Specific Problems**:
- Lines 86-146: Complex useEffect with nested API call and error handling
- Lines 239-561: Massive conditional rendering block for public library metadata
- Lines 397-534: Duplicated tag management logic (should use shared component)
- Lines 55-93: Form state management could be extracted to custom hook

**Refactoring Recommendation** (8 hours):
```typescript
// Extract to separate components:
1. ShareModalHeader (visibility toggle, title input)
2. PublicMetadataSection (category, description, tags)
3. ShareLinkSection (URL, social buttons)
4. TagManagementSection (reuse from useTagManager)

// Extract to custom hooks:
1. useShareModalState() - manage form state
2. useMetadataLoader() - handle loading existing metadata
3. useShareActions() - handleSave, copyToClipboard logic
```

**Impact**: Performance (re-renders), Maintainability, Testability

---

#### ViewerCompare - 634 lines
**File**: `components/features/viewer/ViewerCompare.tsx`
**Complexity Score**: 87/100

**Issues**:
- 634 lines with complex dual-editor management
- 8 useState hooks managing editor state
- 2 ref objects with manual synchronization
- Complex scroll synchronization logic (lines 237-299)
- Duplicate format/copy handlers for each editor

**Specific Problems**:
- Lines 237-299: handleEditor1Mount and handleEditor2Mount are nearly identical
- Lines 381-543: Massive conditional rendering with duplicated editor setup
- Lines 69-110: Memoization logic could be simplified
- Lines 237-299: Scroll sync uses manual flag manipulation (anti-pattern)

**Refactoring Recommendation** (6 hours):
```typescript
// Extract to separate components:
1. CompareEditorPanel (reusable for left/right)
2. CompareDiffResults (results view)
3. CompareActionBar (buttons and controls)

// Extract custom hooks:
1. useCompareEditors() - manage both editors
2. useScrollSync() - handle scroll synchronization
3. useDiffCalculation() - memoize diff logic

// Replace editor refs with proper state management
```

**Impact**: Code duplication (40% reduction possible), Maintainability

---

#### JsonEditor - 436 lines
**File**: `components/features/editor/json-editor.tsx`
**Complexity Score**: 82/100

**Issues**:
- 436 lines doing too much
- 7 useState hooks
- 4 useEffect hooks with complex dependencies
- Mixed concerns: editor setup, validation, formatting, search, theme management
- Monaco editor configuration inline (should be extracted)

**Specific Problems**:
- Lines 52-90: Complex useEffect for syncing store state with editor
- Lines 137-189: handleEditorMount is 52 lines (too complex)
- Lines 254-286: updateValidationDecorations inline function
- Lines 100-135: formatJson has Web Worker logic mixed with state updates
- Lines 52-71: Dark mode detection logic should be extracted

**Refactoring Recommendation** (5 hours):
```typescript
// Extract to custom hooks:
1. useMonacoEditor() - editor setup and configuration
2. useDarkModeDetection() - theme management
3. useJsonValidation() - validation decorations
4. useJsonFormatting() - format with worker
5. useEditorSearch() - search and highlight

// Extract configuration:
1. monacoConfig.ts - editor options and themes
2. monacoActions.ts - custom actions (format, search)

// Reduce component to orchestration only
```

**Impact**: Testability, Maintainability, Code reuse

---

#### PublishModal - 442 lines
**File**: `components/features/modals/publish-modal.tsx`
**Complexity Score**: 79/100

**Issues**:
- 442 lines with complex form and tag management
- Duplicate tag management logic (already in useTagManager hook)
- Complex useEffect for loading metadata (lines 65-93)
- Large form rendering with deeply nested structure

**Specific Problems**:
- Lines 238-373: Tag management section is 135 lines (duplicates useTagManager)
- Lines 56-62: useTagManager is used but not fully leveraged
- Lines 376-405: Preview section could be extracted
- Lines 65-93: Loading logic should be in custom hook

**Refactoring Recommendation** (4 hours):
```typescript
// Leverage existing useTagManager hook fully
// Extract components:
1. PublishFormFields (title, description, richContent)
2. PublishCategoryTags (category and tags using useTagManager)
3. PublishPreview (preview section)

// Extract custom hook:
1. usePublishForm() - form state and submission logic
```

**Impact**: Code duplication (remove 100+ duplicate lines), Consistency

---

#### Sidebar - 384 lines
**File**: `components/layout/sidebar.tsx`
**Complexity Score**: 71/100

**Issues**:
- 384 lines mixing concerns
- Navigation logic + file upload + state management + scroll persistence
- Complex conditional rendering for locked/unlocked items
- Duplicate rendering for mobile/desktop

**Specific Problems**:
- Lines 221-307: Large map with complex nested conditions
- Lines 234-273: Locked item rendering logic is verbose
- Lines 74-82: Scroll persistence logic mixed with component logic
- Lines 191-368: Single massive JSX block

**Refactoring Recommendation** (3 hours):
```typescript
// Extract components:
1. SidebarNavItem (handle locked/unlocked states)
2. SidebarHeader (logo, title, mobile close)
3. SidebarQuickActions (new draft, upload)
4. SidebarContent (wrap navigation and actions)

// Extract hooks:
1. useSidebarScroll() - scroll persistence
2. useSidebarNavigation() - navigation items logic
```

**Impact**: Maintainability, Code reuse, Testability

---

### MEDIUM SEVERITY

#### JsonMetadataForm - 494 lines
**File**: `components/features/editor/json-metadata-form.tsx`
**Complexity Score**: 68/100

**Issues**:
- 494 lines with complex tag management
- Duplicate tag management logic (lines 84-171)
- Large form rendering (lines 202-476)
- Mixed presentation and logic

**Refactoring** (3 hours):
- Extract TagInputSection component
- Use useTagManager hook properly
- Split form into logical sections

**Impact**: Code duplication, Consistency

---

#### UserList - 269 lines
**File**: `components/features/admin/user-list.tsx`
**Complexity Score**: 58/100

**Issues**:
- Duplicate rendering logic for desktop/mobile (lines 116-253)
- Sort logic inline (should be in custom hook)
- Filter logic inline (should be in custom hook)

**Refactoring** (2 hours):
```typescript
// Extract hooks:
1. useUserList() - fetch, filter, sort
2. useUserActions() - handleViewUser, etc.

// Extract components:
1. UserTableRow (desktop view)
2. UserCard (mobile view)
```

**Impact**: Code duplication (60% of component is duplicated)

---

#### SystemStats - 248 lines
**File**: `components/features/admin/system-stats.tsx`
**Complexity Score**: 55/100

**Issues**:
- Inline utility functions (formatBytes, formatUptime) should be extracted
- Auto-refresh logic with interval (lines 55-59) should be in hook
- Complex nested card rendering

**Refactoring** (2 hours):
- Extract formatters to `lib/utils/formatters.ts`
- Create useSystemStats hook with auto-refresh
- Extract stat cards to StatCard component

**Impact**: Code reuse, Testability

---

#### TagAnalytics - 226 lines
**File**: `components/features/admin/tag-analytics.tsx`
**Complexity Score**: 52/100

**Issues**:
- Multiple ErrorBoundary wrapping (lines 108-223)
- Repetitive card structure
- Fetch logic inline

**Refactoring** (2 hours):
- Extract AnalyticsCard component
- Create useTagAnalytics hook
- Simplify error boundary usage

**Impact**: Code duplication, Maintainability

---

#### SEOManager - 169 lines
**File**: `components/features/admin/seo-manager.tsx`
**Complexity Score**: 45/100

**Issues**:
- Simple component but could benefit from extraction
- Card rendering could be component

**Refactoring** (1 hour):
- Extract SEOPageCard component

**Impact**: Minor, good structure overall

---

#### ViewerTree - 199 lines
**File**: `components/features/viewer/ViewerTree.tsx`
**Complexity Score**: 48/100

**Issues**:
- Duplicate search bar rendering (lines 63-98 and 136-172)
- Debounce logic inline (lines 40-46)

**Refactoring** (2 hours):
- Extract SearchBar component
- Move debounce to custom hook

**Impact**: Code duplication (40 lines duplicated)

---

### LOW SEVERITY

#### Viewer - 237 lines
**File**: `components/features/viewer/Viewer.tsx`
**Complexity Score**: 42/100

**Issues**:
- VIEW_MODES constant could be in separate config file
- Large conditional rendering block (lines 212-232)

**Refactoring** (1 hour):
- Extract constants to config
- Consider ViewMode strategy pattern

**Impact**: Minor, mostly well-structured

---

#### DocumentCard - 192 lines
**File**: `components/features/documents/DocumentCard.tsx`
**Complexity Score**: 38/100

**Issues**:
- Well-structured component
- Could extract footer section

**Refactoring** (30 minutes):
- Extract DocumentCardFooter component

**Impact**: Minor improvement

---

#### ExportModal - 332 lines
**File**: `components/features/modals/export-modal.tsx`
**Complexity Score**: 52/100

**Issues**:
- EXPORT_FORMATS constant is large (lines 39-68)
- Format selection grid could be component

**Refactoring** (1 hour):
- Move EXPORT_FORMATS to config
- Extract FormatOption component

**Impact**: Minor, good separation of concerns

---

## 2. State Management Complexity

### HIGH SEVERITY Issues

#### Excessive useState Hooks

**ShareModal** - 11 useState hooks:
```typescript
// Lines 72-93
const [copied, setCopied] = useState(false);
const [isUpdating, setIsUpdating] = useState(false);
const [isSaving, setIsSaving] = useState(false);
const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
const [isPublic, setIsPublic] = useState(...);
const [formData, setFormData] = useState({
  title, description, category, tags // 4 pieces of state
});
// Plus tagManager internal state
```

**Problem**: Form state should use useReducer or single state object
**Solution** (2 hours):
```typescript
const [modalState, dispatch] = useReducer(shareModalReducer, initialState);
// Combines: loading states, form data, UI state
```

---

**JsonMetadataForm** - 9 state pieces:
```typescript
// Lines 75-90
const [formData, setFormData] = useState({...}); // 6 pieces
const [tagInput, setTagInput] = useState('');
const [tagValidation, setTagValidation] = useState({...});
const [suggestedTags, setSuggestedTags] = useState([]);
const [showSuggestions, setShowSuggestions] = useState(false);
```

**Problem**: Tag state management duplicated from useTagManager
**Solution** (1 hour): Fully leverage useTagManager hook

---

### MEDIUM SEVERITY

#### Redundant State (Can Be Derived)

**Viewer** - Derived state:
```typescript
// Line 82-85
const effectiveInitialMode = initialViewMode || initialMode;
const [internalViewMode, setInternalViewMode] = useState<ViewMode>(effectiveInitialMode);
const viewMode = controlledViewMode ?? internalViewMode;
```

**Problem**: Three different mode variables when one is sufficient
**Solution** (30 minutes): Simplify to single controlled/uncontrolled pattern

---

**ViewerCompare** - Duplicate JSON state:
```typescript
// Lines 67-74
const [json1, setJson1] = useState(initialJson1);
const [json2, setJson2] = useState(initialJson2);
const parsedJson1 = useMemo(() => JSON.parse(json1), [json1]);
const parsedJson2 = useMemo(() => JSON.parse(json2), [json2]);
```

**Problem**: Storing both raw and parsed JSON
**Solution** (1 hour): Store only raw JSON, derive parsed on demand

---

### Prop Drilling Issues

**ShareModal** → **TagManager**:
- Tags passed through 3 levels
- OnChange callback passed through multiple props
- Solution: Use Context or extract to separate modal

**PublishModal** → **RichTextEditor**:
- Content and onChange drilled deep into nested form sections
- Solution: Extract form sections to components with local state

---

## 3. Logic Complexity

### HIGH SEVERITY

#### Complex Conditionals (>3 Nested Levels)

**ShareModal** - Lines 350-561:
```typescript
{isPublic && (
  <div> {/* Level 1 */}
    {formData.category && formData.tags.length < 10 && ( {/* Level 2 */}
      <div> {/* Level 3 */}
        {getCommonTagsForCategory(formData.category)
          .filter(tag => !formData.tags.includes(tag)) {/* Level 4 */}
          .slice(0, 5)
          .map((tag) => ( {/* Level 5 */}
            <Badge onClick={() => ...} /> {/* Level 6 */}
          ))}
      </div>
    )}
  </div>
)}
```

**Problem**: 6 levels of nesting makes code hard to read and test
**Solution** (2 hours):
```typescript
// Extract to separate component
<ConditionalTagSuggestions
  isVisible={isPublic}
  category={formData.category}
  selectedTags={formData.tags}
  maxTags={10}
  onAddTag={addTag}
/>
```

---

**ViewerCompare** - Lines 237-299:
- Duplicate scroll synchronization logic
- Manual flag manipulation to prevent infinite loops
- Complex timing logic with setTimeout

**Problem**: Brittle synchronization code prone to race conditions
**Solution** (3 hours): Use proper event coordination or library

---

**JsonEditor** - Lines 137-189:
```typescript
const handleEditorMount: OnMount = useCallback((editor, monaco) => {
  // 52 lines of setup logic
  // Theme definition
  // Options configuration
  // Action registration
  // Validation setup
  // Error handling
}, [formatJson, isDarkMode]);
```

**Problem**: Single function doing 5 different setup tasks
**Solution** (2 hours):
```typescript
const handleEditorMount = useCallback((editor, monaco) => {
  setupThemes(monaco, isDarkMode);
  configureEditor(editor, optimizedOptions);
  registerActions(editor, monaco, { formatJson });
  setupValidation(editor, monaco);
}, [formatJson, isDarkMode]);
```

---

### MEDIUM SEVERITY

#### Business Logic in Components

**UserList** - Lines 55-76:
```typescript
const filteredUsers = users
  .filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )
  .sort((a, b) => {
    switch (sortBy) {
      case 'name': return (a.name || '').localeCompare(b.name || '')
      case 'email': return a.email.localeCompare(b.email)
      // ... 4 more cases
    }
  });
```

**Problem**: Filtering and sorting logic in component
**Solution** (1 hour):
```typescript
// Move to lib/utils/user-utils.ts
export const filterUsers = (users, searchTerm) => {...}
export const sortUsers = (users, sortBy) => {...}

// Or better, custom hook
const { filteredUsers } = useUserFiltering(users, searchTerm, sortBy);
```

---

**SystemStats** - Lines 61-77:
```typescript
const formatBytes = (bytes: number) => {...}
const formatUptime = (seconds: number) => {...}
```

**Problem**: Utility functions defined inside component
**Solution** (30 minutes): Move to `lib/utils/formatters.ts`

---

**Sidebar** - Lines 84-104:
```typescript
const createNewDraft = useCallback(() => {
  useBackendStore.setState({
    currentDocument: null,
    currentJson: '',
    isDirty: false,
    shareId: '',
  });
  router.push('/edit');
}, [router]);
```

**Problem**: Business logic for document creation in sidebar
**Solution** (1 hour): Move to custom hook `useDocumentActions()`

---

### Complex Computations in Render

**ViewerCompare** - Lines 84-110:
```typescript
const parsedJson1 = useMemo(() => {
  try {
    return json1.trim() ? JSON.parse(json1) : null;
  } catch {
    return null;
  }
}, [json1]);

const diffResult = useMemo((): DiffResult | null => {
  if (!parsedJson1 || !parsedJson2) return null;
  try {
    return compareJson(parsedJson1, parsedJson2);
  } catch (error) {
    logger.error(...);
    return null;
  }
}, [parsedJson1, parsedJson2]);
```

**Problem**: While memoized, error handling could be better
**Solution** (1 hour): Extract to custom hook with error state

---

## 4. Anti-Patterns

### HIGH SEVERITY

#### Inline Arrow Functions in JSX

**Sidebar** - Lines 275-305:
```typescript
<Link key={item.id} href={item.href} onClick={handleNavClick}>
  <div className={cn(
    'inline-flex items-center whitespace-nowrap rounded-md', // 10 lines of className logic
    item.current ? 'bg-secondary' : 'hover:bg-accent'
  )}>
    {/* ... */}
  </div>
</Link>
```

**Problem**: Complex className computations inline
**Solution** (30 minutes):
```typescript
const getNavItemClasses = (item, isFirst, isLast) => cn(...)
```

---

#### Missing Error Boundaries

**Locations Missing Error Boundaries**:
1. JsonEditor - Monaco editor can fail to load
2. ViewerCompare - Dual editors prone to failures
3. RichTextEditor - Complex editor component

**Solution** (2 hours): Wrap all editor components with ErrorBoundary

---

#### Console.log Statements

Found in:
- ViewerCompare: Line 108 (logger.error, acceptable)
- JsonEditor: Line 187 (logger.error, acceptable)

**Status**: Good - Using structured logging, not console.log

---

#### Commented-Out Code

**None found** - Good code hygiene maintained

---

### MEDIUM SEVERITY

#### Large Inline Styles/ClassNames

**ShareModal** - Lines 415-421:
```typescript
className={`pr-8 ${
  tagValidation.errors.length > 0
    ? 'border-red-500 focus:ring-red-500'
    : tagValidation.warnings.length > 0
      ? 'border-yellow-500 focus:ring-yellow-500'
      : ''
}`}
```

**Problem**: Complex ternary className computation
**Solution** (15 minutes):
```typescript
const getInputBorderClass = (validation) => {
  if (validation.errors.length > 0) return 'border-red-500 focus:ring-red-500';
  if (validation.warnings.length > 0) return 'border-yellow-500 focus:ring-yellow-500';
  return '';
};
```

---

#### Missing useMemo/useCallback Where Needed

**Sidebar** - Line 137:
```typescript
const navigation = [
  { id: 'viewer', name: 'Viewer', href: '/', icon: Code2, ... },
  // ... 6 items
];
```

**Problem**: Recreation on every render
**Solution** (10 minutes):
```typescript
const navigation = useMemo(() => [...], [pathname, session]);
```

---

### Unnecessary Re-renders

**JsonEditor** - Lines 192-210:
```typescript
const debouncedSetCurrentJson = useMemo(
  () => debounce(setCurrentJson, isLargeFile ? 500 : 100),
  [setCurrentJson, isLargeFile]
);
```

**Problem**: Debounce recreated when isLargeFile changes
**Solution** (30 minutes): Stable debounce with ref

---

## 5. Hook Issues

### HIGH SEVERITY

#### useEffect Cleanup Not Implemented

**JsonEditor** - Lines 52-71:
```typescript
useEffect(() => {
  // ... dark mode detection
  const observer = new MutationObserver(checkDarkMode);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
  });

  return () => observer.disconnect(); // ✓ Good!
}, []);
```

**Status**: Good - cleanup implemented

**SystemStats** - Lines 55-59:
```typescript
useEffect(() => {
  fetchSystemStats()
  const interval = setInterval(fetchSystemStats, 30000)
  return () => clearInterval(interval) // ✓ Good!
}, [])
```

**Status**: Good - cleanup implemented

---

#### Missing Dependency Array Items

**ShareModal** - Lines 95-146:
```typescript
useEffect(() => {
  const loadPublishedMetadata = async () => {
    // Uses: open, shareId, currentTitle, currentVisibility
    // ...
  };
  loadPublishedMetadata();
}, [open, shareId, currentTitle, currentVisibility]); // ✓ Complete
```

**Status**: Good - dependencies complete

**Warning Found**: ViewerTree - Line 40:
```typescript
useEffect(() => {
  const timeoutId = setTimeout(() => {
    setSearchTerm(inputValue);
  }, 200);

  return () => clearTimeout(timeoutId);
}, [inputValue, setSearchTerm]); // setSearchTerm not needed
```

**Problem**: setSearchTerm is from useState (stable), unnecessary dependency
**Solution** (5 minutes): Remove setSearchTerm from deps

---

#### useEffect with Empty Dependency Arrays Doing Data Fetching

**UserList** - Lines 51-53:
```typescript
useEffect(() => {
  fetchUsers()
}, [])
```

**Problem**: No way to trigger refetch, fetchUsers should be stable
**Solution** (30 minutes):
```typescript
const { users, loading, refetch } = useUserList();
// Custom hook handles fetching and exposes refetch
```

**SystemStats** - Lines 55-59:
```typescript
useEffect(() => {
  fetchSystemStats()
  const interval = setInterval(fetchSystemStats, 30000)
  return () => clearInterval(interval)
}, [])
```

**Problem**: fetchSystemStats created inline, no way to manually trigger
**Solution** (30 minutes): Extract to custom hook with refresh capability

---

### MEDIUM SEVERITY

#### Hooks Called Conditionally

**Status**: No violations found - Good!

---

#### Complex Hook Logic

**JsonMetadataForm** - Lines 92-99:
```typescript
useEffect(() => {
  const commonTags = formData.category ? getCommonTagsForCategory(formData.category) : [];
  const contentTags = suggestTags(formData.title + ' ' + formData.description);
  const allSuggested = [...new Set([...commonTags, ...contentTags])];
  const filtered = allSuggested.filter(tag => !formData.tags.includes(tag));
  setSuggestedTags(filtered.slice(0, 5));
}, [formData.category, formData.title, formData.description, formData.tags]);
```

**Problem**: Complex tag suggestion logic in useEffect
**Solution** (1 hour):
```typescript
const suggestedTags = useMemo(() =>
  getSuggestedTags(formData, 5),
  [formData.category, formData.title, formData.description, formData.tags]
);
```

---

## 6. Type Safety Issues

### HIGH SEVERITY

#### Any Types Used

**ViewerCompare** - Lines 72-73:
```typescript
const editor1Ref = useRef<any>(null);
const editor2Ref = useRef<any>(null);
```

**Problem**: Using `any` for Monaco editor refs
**Solution** (15 minutes):
```typescript
import type { editor } from 'monaco-editor';
const editor1Ref = useRef<editor.IStandaloneCodeEditor | null>(null);
```

**UserList** - Line 96:
```typescript
onChange={(e) => setSortBy(e.target.value as any)}
```

**Problem**: Type assertion to `any`
**Solution** (5 minutes):
```typescript
type SortField = 'name' | 'email' | 'createdAt' | 'lastLogin';
onChange={(e) => setSortBy(e.target.value as SortField)}
```

---

#### Type Assertions (as casts)

**ViewerCompare** - Lines 203-204:
```typescript
copyJsonToClipboard(json1, (title, desc, variant) =>
  toast({ title, description: desc, variant: variant as any })
);
```

**Problem**: Variant should be properly typed
**Solution** (10 minutes):
```typescript
type ToastVariant = 'default' | 'destructive';
variant: variant as ToastVariant
```

---

#### Missing Prop Types

**ShareModal** - Props interface is comprehensive (good!)
**PublishModal** - Props interface is comprehensive (good!)
**DocumentCard** - Props interface is comprehensive (good!)

**Status**: Good type coverage overall

---

### MEDIUM SEVERITY

#### Implicit Any from Missing Types

**Sidebar** - Line 78:
```typescript
clearTimeout((window as any).__sidebarScrollTimeout);
(window as any).__sidebarScrollTimeout = setTimeout(...);
```

**Problem**: Using window as storage for timeout ID
**Solution** (15 minutes):
```typescript
const timeoutRef = useRef<NodeJS.Timeout>();
clearTimeout(timeoutRef.current);
timeoutRef.current = setTimeout(...);
```

---

## Complexity Scoring Methodology

```typescript
complexityScore = (
  (lines / 50) * 10 +              // Size penalty
  (useStateCount > 5 ? useStateCount * 5 : 0) + // State complexity
  (useEffectCount > 3 ? useEffectCount * 5 : 0) + // Effect complexity
  (jsxNestingDepth > 4 ? (jsxNestingDepth - 4) * 5 : 0) + // Nesting penalty
  (cyclomaticComplexity > 10 ? cyclomaticComplexity : 0) // Logic complexity
) / maximumPossibleScore * 100;
```

---

## Top 10 Most Complex Components

| Rank | Component | File | Lines | Score | Effort |
|------|-----------|------|-------|-------|--------|
| 1 | ShareModal | share-modal.tsx | 657 | 94 | 8h |
| 2 | ViewerCompare | ViewerCompare.tsx | 634 | 87 | 6h |
| 3 | JsonEditor | json-editor.tsx | 436 | 82 | 5h |
| 4 | PublishModal | publish-modal.tsx | 442 | 79 | 4h |
| 5 | JsonMetadataForm | json-metadata-form.tsx | 494 | 68 | 3h |
| 6 | Sidebar | sidebar.tsx | 384 | 71 | 3h |
| 7 | UserList | user-list.tsx | 269 | 58 | 2h |
| 8 | SystemStats | system-stats.tsx | 248 | 55 | 2h |
| 9 | TagAnalytics | tag-analytics.tsx | 226 | 52 | 2h |
| 10 | ExportModal | export-modal.tsx | 332 | 52 | 1h |

**Total Estimated Refactoring Effort**: 36 hours

---

## Quick Wins (LOW Effort, HIGH Impact)

### 1. Extract Utility Functions (2 hours total)
**Impact**: Code reuse, testability
- `formatBytes` from SystemStats → `lib/utils/formatters.ts`
- `formatUptime` from SystemStats → `lib/utils/formatters.ts`
- Filter/sort logic from UserList → `lib/utils/user-utils.ts`

### 2. Fix Type Safety Issues (2 hours total)
**Impact**: Type safety, IDE support
- Replace `any` types with proper editor types
- Fix type assertions in toast callbacks
- Add proper typing for window storage

### 3. Extract Duplicate Search Bars (1 hour)
**Impact**: Remove 40 lines of duplication
- Create SearchBar component
- Use in ViewerTree both branches

### 4. Simplify useState to useReducer (3 hours)
**Impact**: Cleaner state management
- ShareModal: 11 useState → 1 useReducer
- JsonMetadataForm: 9 state pieces → 1 useReducer

### 5. Extract Inline Utility Functions (2 hours)
**Impact**: Performance (prevent recreation), readability
- Add useMemo to navigation arrays
- Extract className helper functions
- Extract validation functions

**Total Quick Wins Effort**: 10 hours
**Total Lines Reduced**: ~300 lines
**Components Improved**: 8 components

---

## Detailed Refactoring Recommendations

### Phase 1: Critical Components (20 hours)

#### 1.1 ShareModal Refactoring (8 hours)

**Extract Components**:
```typescript
// New components to create:
1. ShareModalHeader.tsx (80 lines)
   - Visibility toggle
   - Title input
   - Share link section

2. PublicMetadataSection.tsx (200 lines)
   - Description
   - Category select
   - Tag management (using shared component)
   - Preview

3. ShareSocialButtons.tsx (60 lines)
   - Social share buttons grid
   - Reusable across modals

4. TagManagementSection.tsx (100 lines)
   - Shared tag input with validation
   - Tag suggestions
   - Selected tags display
   - Reusable in PublishModal, ShareModal, JsonMetadataForm
```

**Extract Hooks**:
```typescript
// New hooks to create:
1. useShareModalState.ts (50 lines)
   interface ShareModalState {
     isPublic: boolean;
     formData: FormData;
     loading: LoadingState;
     metadata: Metadata;
   }
   - useReducer for complex state
   - Derived state calculations
   - State update actions

2. useMetadataLoader.ts (40 lines)
   - Fetch existing metadata
   - Handle loading states
   - Error handling
   - Cache metadata

3. useShareActions.ts (60 lines)
   - handleSave with validation
   - copyToClipboard with feedback
   - handlePublish/makePrivate
   - Error handling
```

**Expected Outcome**:
- ShareModal reduced from 657 → ~150 lines
- 4 new reusable components created
- 3 new custom hooks created
- ~500 lines become reusable across modals

---

#### 1.2 ViewerCompare Refactoring (6 hours)

**Extract Components**:
```typescript
// New components:
1. CompareEditorPanel.tsx (120 lines)
   interface EditorPanelProps {
     label: string;
     value: string;
     onChange: (value: string) => void;
     onMount: (editor, monaco) => void;
     isValid: boolean;
     onFormat: () => void;
     onCopy: () => void;
   }
   - Reusable editor panel with actions
   - Status indicator
   - Action buttons bar

2. CompareDiffResults.tsx (150 lines)
   - Diff rendering logic
   - Operation cards
   - Summary statistics
   - Export button

3. CompareActionBar.tsx (50 lines)
   - Sync scroll toggle
   - Reset button
   - Compare button
   - Settings
```

**Extract Hooks**:
```typescript
// New hooks:
1. useCompareEditors.ts (100 lines)
   interface CompareEditorsState {
     json1: string;
     json2: string;
     editor1Ref: RefObject<IEditor>;
     editor2Ref: RefObject<IEditor>;
   }
   - Manage both editors
   - Handle mounting
   - Sync state
   - Validation

2. useScrollSync.ts (60 lines)
   - Proper event coordination
   - Avoid manual flags
   - Configurable sync toggle
   - Prevent infinite loops

3. useDiffCalculation.ts (40 lines)
   - Memoize diff computation
   - Error handling
   - Loading state
   - Null safety
```

**Expected Outcome**:
- ViewerCompare reduced from 634 → ~200 lines
- Remove duplicate editor setup (200 lines saved)
- 3 new reusable components
- Better scroll sync logic (remove buggy flag pattern)

---

#### 1.3 JsonEditor Refactoring (5 hours)

**Extract Hooks**:
```typescript
// New hooks:
1. useMonacoEditor.ts (100 lines)
   interface MonacoEditorOptions {
     language: string;
     theme: string;
     value: string;
     onChange: (value: string) => void;
     onMount?: (editor, monaco) => void;
   }
   - Setup editor
   - Register actions
   - Apply options
   - Handle mounting

2. useMonacoTheme.ts (40 lines)
   - Dark mode detection
   - Theme switching
   - Custom theme registration

3. useJsonValidation.ts (60 lines)
   - Real-time validation
   - Error decorations
   - Marker management
   - Validation state

4. useJsonFormatting.ts (50 lines)
   - Format with Web Worker
   - Progressive loading for large files
   - Loading progress state
   - Error handling

5. useEditorSearch.ts (50 lines)
   - Search functionality
   - Highlight matches
   - Decoration management
   - Navigation
```

**Extract Configuration**:
```typescript
// New config files:
1. lib/editor/config.ts (40 lines)
   export const MONACO_OPTIONS = {...}
   export const LARGE_FILE_THRESHOLD = 100000
   export const DEBOUNCE_TIME = {...}

2. lib/editor/actions.ts (60 lines)
   export const formatAction = {...}
   export const searchAction = {...}
   export const validationAction = {...}
```

**Expected Outcome**:
- JsonEditor reduced from 436 → ~150 lines
- 5 new reusable hooks for Monaco
- Configuration externalized
- Better testability

---

#### 1.4 PublishModal Refactoring (4 hours)

**Main Change**: Leverage useTagManager fully

**Extract Components**:
```typescript
// Reuse existing components:
1. TagManagementSection (from ShareModal refactor)
2. FormPreview component (80 lines)
3. PublishFormFields (100 lines)
```

**Simplify**:
```typescript
// Before: 442 lines with duplicate tag logic
// After: ~150 lines using shared components

// Remove lines 238-373 (135 lines of duplicate tag management)
// Replace with:
<TagManagementSection
  tags={formData.tags}
  onTagsChange={(tags) => setFormData(prev => ({ ...prev, tags }))}
  category={formData.category}
  maxTags={10}
/>
```

**Expected Outcome**:
- Reduce from 442 → ~150 lines
- Remove 135 lines of duplicate code
- Consistency with ShareModal
- Single source of truth for tag management

---

### Phase 2: Medium Priority (12 hours)

#### 2.1 UserList, SystemStats, TagAnalytics (6 hours)

**Common Pattern**: Extract data fetching to hooks

```typescript
// Pattern for all three:
export function useAdminData<T>(endpoint: string, refreshInterval?: number) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const result = await apiClient.get<T>(endpoint);
      setData(result);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    fetchData();
    if (refreshInterval) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, refreshInterval]);

  return { data, loading, error, refetch: fetchData };
}

// Usage:
const { data: users, loading, refetch } = useAdminData<UserListData>('/api/admin/users');
```

**Extract Components**:
```typescript
// UserList:
1. UserTableRow.tsx (40 lines)
2. UserCardMobile.tsx (60 lines)

// SystemStats:
1. StatCard.tsx (40 lines)
2. SystemHealthCard.tsx (60 lines)

// TagAnalytics:
1. AnalyticsCard.tsx (40 lines)
2. TagDistributionChart.tsx (60 lines)
```

**Expected Outcome**:
- 3 components reduced by ~100 lines each
- Remove duplicate rendering logic
- Consistent data fetching pattern
- Better error handling

---

#### 2.2 Sidebar Refactoring (3 hours)

**Extract Components**:
```typescript
1. SidebarNavItem.tsx (80 lines)
   interface NavItemProps {
     item: NavigationItem;
     isActive: boolean;
     isLocked: boolean;
     onClick: () => void;
     badge?: number;
   }
   - Handle locked/unlocked states
   - Badge rendering
   - Icon and label
   - Active state styling

2. SidebarHeader.tsx (40 lines)
   - Logo
   - Title
   - Mobile close button

3. SidebarQuickActions.tsx (60 lines)
   - New draft button
   - Upload button
   - Confirmation dialogs
```

**Extract Hook**:
```typescript
useSidebarScroll.ts (30 lines)
- Scroll position persistence
- Restore scroll on mount
- Debounced scroll save
- Cleanup
```

**Expected Outcome**:
- Sidebar reduced from 384 → ~180 lines
- 3 reusable components
- Cleaner scroll persistence
- Better mobile/desktop logic

---

#### 2.3 JsonMetadataForm Refactoring (3 hours)

**Main Change**: Use shared TagManagementSection

```typescript
// Before: 494 lines with custom tag logic
// After: ~200 lines using shared components

// Remove lines 84-171 (duplicate tag management)
// Use shared component:
<TagManagementSection
  tags={formData.tags}
  onTagsChange={(tags) => setFormData(prev => ({ ...prev, tags }))}
  category={formData.category}
  maxTags={10}
/>
```

**Extract Sections**:
```typescript
1. MetadataFormFields.tsx (100 lines)
   - Title, description inputs
   - Visibility toggle

2. MetadataRichContent.tsx (60 lines)
   - Rich text editor with error boundary
   - Help text
```

**Expected Outcome**:
- Reduce from 494 → ~200 lines
- Remove duplicate tag code
- Consistent with modals
- Better component separation

---

### Phase 3: Quick Wins & Polish (4 hours)

#### 3.1 Extract Utility Functions (2 hours)

```typescript
// Create lib/utils/formatters.ts
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export const formatUptime = (seconds: number): string => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

export const formatCount = (count: number): string => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
};

// Already exists: formatRelativeTime in lib/utils/formatters.ts
```

**Usage**: Import in SystemStats, UserList, DocumentCard

---

#### 3.2 Fix Type Safety Issues (1 hour)

```typescript
// 1. Fix editor refs in ViewerCompare
import type { editor } from 'monaco-editor';
const editor1Ref = useRef<editor.IStandaloneCodeEditor | null>(null);
const editor2Ref = useRef<editor.IStandaloneCodeEditor | null>(null);

// 2. Fix sort field typing in UserList
type SortField = 'name' | 'email' | 'createdAt' | 'lastLogin';
const [sortBy, setSortBy] = useState<SortField>('lastLogin');

// 3. Fix toast variant typing
type ToastVariant = 'default' | 'destructive';
const showToast = (variant: ToastVariant) => {...};

// 4. Fix window storage typing
const timeoutRef = useRef<NodeJS.Timeout>();
```

---

#### 3.3 Extract Duplicate Code (1 hour)

```typescript
// 1. SearchBar component (ViewerTree uses twice)
export function SearchBar({
  value,
  onChange,
  matchCount,
  onExpandAll,
  onCollapseAll,
}: SearchBarProps) {
  return (
    <div className="p-4 border-b bg-gray-50">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search keys and values..."
            value={value}
            onChange={onChange}
            className="pl-10"
          />
        </div>
        {value && (
          <Badge variant="secondary">
            {matchCount} matches
          </Badge>
        )}
        <Button variant="outline" size="sm" onClick={onExpandAll}>
          <ChevronDown className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={onCollapseAll}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// 2. StatCard component (SystemStats, TagAnalytics)
export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
}: StatCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}
```

---

## Implementation Priority & Timeline

### Sprint 1 (2 weeks): Critical Path - Modals & Editors

**Week 1**: ShareModal + PublishModal
- Day 1-3: Create shared TagManagementSection component
- Day 4-5: Refactor ShareModal (extract hooks & components)
- Day 6-7: Refactor PublishModal (use shared components)
- Day 8-10: Testing & bug fixes

**Week 2**: Editors
- Day 1-3: Refactor JsonEditor (extract Monaco hooks)
- Day 4-5: Refactor ViewerCompare (extract editor panels)
- Day 6-7: Testing & integration
- Day 8-10: Documentation & cleanup

**Expected Outcome**:
- 5 major components refactored
- ~800 lines of duplicated code removed
- 10+ new reusable components/hooks created
- Modals and editors significantly cleaner

---

### Sprint 2 (1 week): Admin Components & Sidebar

**Days 1-3**: Admin Components
- Extract data fetching hooks
- Create shared card components
- Refactor UserList, SystemStats, TagAnalytics

**Days 4-5**: Sidebar
- Extract navigation item component
- Extract scroll persistence hook
- Simplify mobile/desktop logic

**Days 6-7**: Testing & Polish
- Integration testing
- Performance testing
- Documentation

**Expected Outcome**:
- 4 components refactored
- Consistent admin data fetching pattern
- Sidebar more maintainable

---

### Sprint 3 (3 days): Quick Wins & Final Polish

**Day 1**: Extract Utilities
- Create formatters.ts with all formatting functions
- Create user-utils.ts with filter/sort logic
- Update imports

**Day 2**: Type Safety
- Fix all `any` types
- Add proper type assertions
- Update ref types

**Day 3**: Final Cleanup
- Extract SearchBar component
- Extract StatCard component
- Remove unused code
- Update documentation

**Expected Outcome**:
- All quick wins implemented
- Type safety improved
- Documentation complete

---

## Success Metrics

### Quantitative Metrics

**Before Refactoring**:
- Average component size: 283 lines
- Components >300 lines: 8 (15%)
- Total duplicate code: ~1,200 lines
- Type safety issues: 15
- Custom hooks: 12

**After Refactoring**:
- Average component size: <200 lines (30% reduction)
- Components >300 lines: 0 (target: 0%)
- Total duplicate code: <300 lines (75% reduction)
- Type safety issues: 0 (100% fixed)
- Custom hooks: 25+ (100% increase)

**New Reusable Components**:
- TagManagementSection
- ShareModalHeader, PublicMetadataSection, ShareSocialButtons
- CompareEditorPanel, CompareDiffResults, CompareActionBar
- SidebarNavItem, SidebarHeader, SidebarQuickActions
- UserTableRow, UserCardMobile
- StatCard, SystemHealthCard
- SearchBar
- Total: 15+ new reusable components

### Qualitative Improvements

1. **Maintainability**: Easier to understand and modify
2. **Testability**: Smaller units easier to test
3. **Reusability**: Shared components reduce duplication
4. **Performance**: Fewer re-renders, better memoization
5. **Type Safety**: Proper types throughout
6. **Developer Experience**: Better IDE support, clearer code

---

## Testing Strategy

### 1. Unit Tests
```typescript
// Test extracted hooks
describe('useTagManager', () => {
  it('validates tags correctly', () => {...});
  it('normalizes tags', () => {...});
  it('prevents duplicate tags', () => {...});
});

// Test utility functions
describe('formatters', () => {
  it('formats bytes correctly', () => {...});
  it('formats uptime correctly', () => {...});
});
```

### 2. Component Tests
```typescript
// Test extracted components
describe('TagManagementSection', () => {
  it('renders tag input', () => {...});
  it('adds tags on enter', () => {...});
  it('shows suggestions', () => {...});
  it('validates tags', () => {...});
});

describe('CompareEditorPanel', () => {
  it('renders editor', () => {...});
  it('handles format click', () => {...});
  it('handles copy click', () => {...});
});
```

### 3. Integration Tests
```typescript
// Test refactored components
describe('ShareModal', () => {
  it('saves public metadata', () => {...});
  it('makes document private', () => {...});
  it('copies share link', () => {...});
});

describe('ViewerCompare', () => {
  it('syncs scroll between editors', () => {...});
  it('calculates diff correctly', () => {...});
  it('exports diff report', () => {...});
});
```

### 4. Visual Regression Tests
- Ensure UI unchanged after refactoring
- Test responsive layouts
- Test dark mode
- Test all modal states

---

## Risk Assessment

### High Risk Changes

1. **ShareModal Refactoring** (Risk: HIGH)
   - Complex component with many interactions
   - Mitigation: Incremental refactoring, feature flags, extensive testing

2. **ViewerCompare Scroll Sync** (Risk: MEDIUM)
   - Brittle synchronization logic
   - Mitigation: Use battle-tested sync library or proven patterns

3. **JsonEditor Monaco Setup** (Risk: MEDIUM)
   - Monaco editor setup is delicate
   - Mitigation: Extensive manual testing, preserve setup order

### Low Risk Changes

1. **Extract Utility Functions** (Risk: LOW)
   - Pure functions, easy to test
   - No behavioral changes

2. **Type Safety Fixes** (Risk: LOW)
   - Compile-time checks catch issues
   - No runtime behavior changes

3. **Extract SearchBar Component** (Risk: LOW)
   - Simple presentational component
   - Easy to verify visually

---

## Rollout Strategy

### Phase 1: Non-Critical Components (Low Risk)
1. Extract utility functions (formatters, user-utils)
2. Fix type safety issues
3. Extract SearchBar component
4. Deploy to staging
5. Monitor for 1 week
6. Deploy to production

### Phase 2: Admin Components (Medium Risk)
1. Refactor UserList, SystemStats, TagAnalytics
2. Deploy to staging
3. Test admin functionality thoroughly
4. Monitor for 1 week
5. Deploy to production

### Phase 3: Modals (High Risk)
1. Create shared TagManagementSection
2. Refactor PublishModal (simpler)
3. Deploy to staging, test publishing flow
4. Monitor for 1 week
5. Refactor ShareModal (more complex)
6. Deploy to staging, test sharing flow
7. Monitor for 1 week
8. Deploy to production

### Phase 4: Editors (High Risk)
1. Extract Monaco hooks
2. Refactor JsonEditor
3. Deploy to staging, extensive testing
4. Monitor for 1 week
5. Refactor ViewerCompare
6. Deploy to staging, extensive testing
7. Monitor for 1 week
8. Deploy to production

---

## Appendix: Code Examples

### Before & After: ShareModal

**Before** (657 lines):
```typescript
// Massive component with everything inline
export function ShareModal({ ... }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [isPublic, setIsPublic] = useState(...);
  const [formData, setFormData] = useState({...});
  // 11 useState hooks total

  // 146 line useEffect
  useEffect(() => {
    const loadPublishedMetadata = async () => {
      // Complex loading logic
    };
    loadPublishedMetadata();
  }, [open, shareId, currentTitle, currentVisibility]);

  // 200+ lines of tag management (duplicate)
  const [tagInput, setTagInput] = useState('');
  const [tagValidation, setTagValidation] = useState({...});
  // etc.

  // 300+ lines of JSX with deep nesting
  return (
    <Dialog>
      {/* Massive JSX tree */}
    </Dialog>
  );
}
```

**After** (~150 lines):
```typescript
export function ShareModal({ ... }: ShareModalProps) {
  // Single state with reducer
  const [modalState, dispatch] = useShareModalState(initialData);

  // Extracted hooks
  const { isLoading, metadata } = useMetadataLoader(shareId, open);
  const { handleSave, copyToClipboard } = useShareActions(shareId, onUpdated);

  // Clean render with extracted components
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <ShareModalHeader
          isPublic={modalState.isPublic}
          title={modalState.formData.title}
          onTitleChange={(title) => dispatch({ type: 'UPDATE_TITLE', title })}
          onVisibilityChange={(isPublic) => dispatch({ type: 'SET_VISIBILITY', isPublic })}
        />

        <ShareLinkSection
          shareUrl={shareUrl}
          onCopy={copyToClipboard}
          isSaving={modalState.loading.isSaving}
        />

        {modalState.isPublic && (
          <PublicMetadataSection
            formData={modalState.formData}
            onChange={(data) => dispatch({ type: 'UPDATE_FORM_DATA', data })}
            isLoading={isLoading}
          />
        )}

        <ShareSocialButtons url={shareUrl} />

        <ShareModalActions
          onCancel={() => onOpenChange(false)}
          onSave={handleSave}
          isLoading={modalState.loading.isUpdating}
          disabled={!modalState.formData.title.trim()}
        />
      </DialogContent>
    </Dialog>
  );
}
```

**Benefits**:
- 657 → 150 lines (77% reduction)
- 11 useState → 1 useReducer
- Complex logic extracted to hooks
- Reusable components created
- Much easier to test and maintain

---

### Before & After: ViewerCompare Scroll Sync

**Before** (Brittle):
```typescript
const handleEditor1Mount = useCallback((editor: any, monaco?: any) => {
  editor1Ref.current = editor;

  const scrollDisposable = editor.onDidScrollChange((e: any) => {
    if (editor2Ref.current && syncScroll) {
      // Manual flag to prevent infinite loops
      if (!editor._syncingScroll) {
        editor2Ref.current._syncingScroll = true;
        editor2Ref.current.setScrollPosition({
          scrollTop: e.scrollTop,
          scrollLeft: e.scrollLeft
        });
        // Reset sync flag after delay
        setTimeout(() => {
          if (editor2Ref.current) {
            editor2Ref.current._syncingScroll = false;
          }
        }, 10);
      }
    }
  });

  return scrollDisposable;
}, [syncScroll, isDarkMode]);

// Duplicate for editor2...
```

**After** (Clean):
```typescript
// Custom hook handles synchronization properly
const { editor1Ref, editor2Ref, handleEditor1Mount, handleEditor2Mount } =
  useCompareEditors({
    json1,
    json2,
    onJson1Change: setJson1,
    onJson2Change: setJson2,
    syncScroll,
    isDarkMode,
  });

// Inside useCompareEditors.ts
export function useCompareEditors(options: CompareEditorsOptions) {
  const editor1Ref = useRef<IStandaloneCodeEditor | null>(null);
  const editor2Ref = useRef<IStandaloneCodeEditor | null>(null);
  const isSyncing = useRef(false);

  const syncScroll = useCallback((sourceEditor: IStandaloneCodeEditor, targetEditor: IStandaloneCodeEditor) => {
    if (!options.syncScroll || isSyncing.current) return;

    isSyncing.current = true;
    const position = sourceEditor.getScrollPosition();
    targetEditor.setScrollPosition(position);
    requestAnimationFrame(() => {
      isSyncing.current = false;
    });
  }, [options.syncScroll]);

  const handleEditor1Mount = useCallback((editor: IStandaloneCodeEditor, monaco: Monaco) => {
    editor1Ref.current = editor;
    setupEditor(editor, monaco, options);

    editor.onDidScrollChange(() => {
      if (editor2Ref.current) {
        syncScroll(editor, editor2Ref.current);
      }
    });
  }, [options, syncScroll]);

  // Similar for editor2, but code is shared

  return { editor1Ref, editor2Ref, handleEditor1Mount, handleEditor2Mount };
}
```

**Benefits**:
- Proper ref typing (no `any`)
- No manual flag manipulation
- Use requestAnimationFrame instead of setTimeout
- Shared logic for both editors
- Easier to test
- More reliable

---

## Conclusion

This audit identified significant complexity issues in React components, with 54 specific findings across 53 components. The most critical issues are:

1. **Oversized components** - 8 components exceed 300 lines
2. **State management complexity** - Multiple components with 9-11 useState hooks
3. **Code duplication** - ~1,200 lines of duplicate code (especially tag management)
4. **Type safety** - 15 instances of `any` types or improper type assertions
5. **Complex logic** - Business logic mixed with presentation

The refactoring plan addresses these systematically over 3 sprints (approximately 3.5 weeks), with an estimated 36 hours of development effort. The approach prioritizes:

- **Risk management** - Critical components refactored last with extensive testing
- **Code reuse** - Creating 15+ reusable components and hooks
- **Type safety** - Eliminating all `any` types
- **Maintainability** - Reducing average component size by 30%
- **Developer experience** - Better structure, testing, and documentation

**Recommended Start**: Begin with Sprint 3 (Quick Wins) to build momentum, then tackle Sprints 1 and 2 for major improvements.
