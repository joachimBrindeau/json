# React Components Refactoring Task List

**Core Principles**: DRY | KISS | SOLID | Prefer Libraries Over Custom Code

---

## 🎯 Guiding Principles

### DRY (Don't Repeat Yourself)
- Extract duplicated logic into reusable hooks
- Create shared components for common UI patterns
- Consolidate utility functions into centralized modules
- Use composition over duplication

### KISS (Keep It Simple, Stupid)
- Prefer simple solutions over clever ones
- Break complex components into smaller pieces
- Use standard patterns instead of custom abstractions
- Keep functions focused on one task

### SOLID Principles
- **Single Responsibility**: Each component/hook does ONE thing
- **Open/Closed**: Extend behavior through props, not modification
- **Liskov Substitution**: Components should be replaceable
- **Interface Segregation**: Don't force components to depend on unused props
- **Dependency Inversion**: Depend on abstractions (hooks) not concrete implementations

### Prefer Libraries Over Custom Code
- ✅ Use `react-hook-form` instead of manual form state management
- ✅ Use `zod` for validation instead of custom validators
- ✅ Use `zustand` or `jotai` for complex state instead of custom context
- ✅ Use `tanstack/react-query` for data fetching instead of custom useEffect
- ✅ Use `cmdk` for command palettes instead of building from scratch
- ✅ Use `react-use` for common hook patterns
- ✅ Use `date-fns` for date operations (already in use)
- ❌ Don't reinvent solutions that exist in well-maintained libraries

---

## 📋 Sprint 1: Quick Wins (Week 1 - 12 hours)

### Task 1.1: Extract Tag Management Section
**Priority**: 🔴 HIGH | **Effort**: 4 hours | **Impact**: Eliminates 180+ lines duplication

**Objective**: Create reusable TagManagementSection component to replace duplicated tag logic

**Current Duplication**:
- `components/features/modals/share-modal.tsx` (lines 85-250)
- `components/features/modals/publish-modal.tsx` (lines 92-260)
- `components/features/editor/json-metadata-form.tsx` (lines 45-180)

**Implementation Steps**:
1. Create `components/features/shared/TagManagementSection.tsx`
2. Extract tag input, validation, suggestions, and rendering logic
3. Use existing `useTagManager` hook (already exists)
4. Accept props: `selectedTags`, `onTagsChange`, `category`, `maxTags`
5. Replace inline tag management in all 3 components
6. Test tag functionality in all modals

**Library Consideration**:
- Consider `react-select` or `react-tag-input` if custom logic is too complex
- Current `useTagManager` hook is good, just needs proper component wrapper

**Acceptance Criteria**:
- [ ] Single TagManagementSection component created
- [ ] All 3 components use the shared component
- [ ] Tag validation works identically
- [ ] No functionality regression
- [ ] 180+ lines of duplication eliminated

**SOLID Check**:
- ✅ Single Responsibility: Only handles tag management UI
- ✅ Open/Closed: Configurable through props (maxTags, category)
- ✅ Dependency Inversion: Uses useTagManager hook abstraction

---

### Task 1.2: Extract Monaco Editor Hook
**Priority**: 🟡 MEDIUM | **Effort**: 3 hours | **Impact**: 100+ lines removed from JsonEditor

**Objective**: Move Monaco editor setup logic into reusable hook

**Current Issues**:
- Monaco setup scattered across JsonEditor (100+ lines)
- Editor configuration hardcoded
- Missing TypeScript types
- Difficult to test or reuse

**Implementation Steps**:
1. Create `hooks/use-monaco-editor.ts`
2. Extract editor initialization, configuration, and event handlers
3. Add proper Monaco TypeScript types (`@monaco-editor/react` types)
4. Return: `{ editorRef, monacoRef, value, onChange, handleFormat }`
5. Replace inline logic in JsonEditor
6. Add editor configuration as hook options

**Library Consideration**:
- **USE** `@monaco-editor/react` (already in dependencies) - proper types
- **USE** `prettier` for formatting (already in dependencies)
- Don't create custom editor wrappers - use the library's API

**Hook Interface**:
```typescript
function useMonacoEditor(options: {
  defaultValue?: string;
  language?: string;
  onChange?: (value: string) => void;
  onValidate?: (markers: any[]) => void;
}): {
  editorRef: React.MutableRefObject<any>;
  monacoRef: React.MutableRefObject<any>;
  value: string;
  handleMount: (editor: any, monaco: any) => void;
  handleChange: (value: string | undefined) => void;
  handleFormat: () => void;
}
```

**Acceptance Criteria**:
- [ ] `use-monaco-editor.ts` hook created with proper types
- [ ] JsonEditor uses the hook
- [ ] Editor functionality unchanged
- [ ] Hook can be reused in other components if needed
- [ ] Proper TypeScript types for Monaco

**KISS Check**:
- ✅ Simple, focused API
- ✅ Uses existing Monaco library patterns
- ✅ No custom abstractions over Monaco

---

### Task 1.3: Fix Type Safety Issues
**Priority**: 🔴 HIGH | **Effort**: 3 hours | **Impact**: Eliminate 15 `any` types

**Objective**: Add proper TypeScript types throughout components

**Files to Fix**:
1. `components/features/editor/json-editor.tsx` - Monaco types
2. `components/features/modals/share-modal.tsx` - API response types
3. `components/features/modals/publish-modal.tsx` - Form data types
4. `components/features/viewer/ViewerCompare.tsx` - JSON comparison types
5. `components/features/admin/user-list.tsx` - User interface (already fixed)

**Implementation Steps**:
1. Add `@monaco-editor/react` types for editor
2. Create `lib/types/api-responses.ts` for API response types
3. Create `lib/types/forms.ts` for form data types
4. Create `lib/types/viewer.ts` for JSON viewer types
5. Replace all `any` with proper types
6. Remove unnecessary type assertions (`as` casts)

**Library Consideration**:
- **USE** `zod` to infer types from validation schemas
- **USE** `type-fest` for advanced utility types if needed
- Generate types from API schemas when possible

**Example**:
```typescript
// ❌ Before
const [data, setData] = useState<any>(null);

// ✅ After
import { z } from 'zod';

const DocumentSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.any(), // JSON content
  tags: z.array(z.string()),
});

type Document = z.infer<typeof DocumentSchema>;
const [data, setData] = useState<Document | null>(null);
```

**Acceptance Criteria**:
- [ ] Zero `any` types in component files
- [ ] All API responses properly typed
- [ ] All form data properly typed
- [ ] No TypeScript errors
- [ ] Type safety validated with `tsc --noEmit`

**SOLID Check**:
- ✅ Interface Segregation: Specific types for specific purposes
- ✅ Better compile-time safety

---

### Task 1.4: Extract Common Utility Functions
**Priority**: 🟢 LOW | **Effort**: 2 hours | **Impact**: 50+ lines removed

**Objective**: Consolidate duplicated utility functions into centralized modules

**Duplicated Functions**:
- `formatFileSize` - duplicated in 3 components
- `validateJsonInput` - duplicated in 2 components
- `filterBySearch` - duplicated in ViewerTree and ViewerCompare
- Date formatting helpers - duplicated across components

**Implementation Steps**:
1. Enhance `lib/utils/formatters.ts` with all formatting functions
2. Create `lib/utils/validators.ts` for validation logic
3. Create `lib/utils/filters.ts` for search/filter logic
4. Replace inline functions in all components
5. Add proper TypeScript types and JSDoc comments

**Library Consideration**:
- **USE** `date-fns` for date formatting (already in use)
- **USE** `bytes` for file size formatting (simple, 1KB package)
- **USE** `validator` for input validation if complex

**Example**:
```typescript
// lib/utils/formatters.ts
import bytes from 'bytes'; // if we add this library

export function formatFileSize(sizeInBytes: number): string {
  return bytes(sizeInBytes, { decimalPlaces: 2 });
}

// Or keep current implementation - it's simple enough
export function formatFileSize(sizeInBytes: number): string {
  if (sizeInBytes < 1024) return `${sizeInBytes} B`;
  if (sizeInBytes < 1024 * 1024) return `${(sizeInBytes / 1024).toFixed(2)} KB`;
  return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
}
```

**Acceptance Criteria**:
- [ ] All formatters in `lib/utils/formatters.ts`
- [ ] All validators in `lib/utils/validators.ts`
- [ ] All filters in `lib/utils/filters.ts`
- [ ] Components use centralized functions
- [ ] 50+ lines of duplication eliminated

**DRY Check**:
- ✅ Single source of truth for each utility
- ✅ Easy to update in one place

---

## 📋 Sprint 2: Major Refactors (Week 2-3 - 18 hours)

### Task 2.1: Refactor ShareModal with Form Library
**Priority**: 🔴 HIGH | **Effort**: 8 hours | **Impact**: Major complexity reduction

**Objective**: Convert ShareModal from manual state management to react-hook-form

**Current Issues**:
- 11 useState hooks
- 6 useEffect hooks with complex dependencies
- Manual form validation
- Manual error handling
- 657 lines total

**Implementation Steps**:
1. **Install react-hook-form** (if not already): `npm install react-hook-form`
2. **Install @hookform/resolvers** for Zod integration
3. Define Zod schema for form validation
4. Convert all useState to react-hook-form
5. Split into smaller components:
   - `ShareModalHeader` (title, visibility toggle)
   - `ShareModalLinkSection` (share URL, copy button)
   - `ShareModalForm` (metadata form)
6. Extract metadata loading logic to `useLoadPublishedMetadata` hook
7. Reduce to ~300 lines total

**Library Usage** (CRITICAL):
```typescript
// ✅ Use react-hook-form - industry standard
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const shareFormSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).max(10),
  visibility: z.enum(['public', 'private']),
});

type ShareFormData = z.infer<typeof shareFormSchema>;

function ShareModal() {
  const form = useForm<ShareFormData>({
    resolver: zodResolver(shareFormSchema),
    defaultValues: {
      title: currentTitle,
      description: '',
      category: '',
      tags: [],
      visibility: 'private',
    },
  });

  // All validation, error handling, state management handled by the library
  return (
    <form onSubmit={form.handleSubmit(handleSubmit)}>
      <Input {...form.register('title')} />
      {form.formState.errors.title && <Error>{form.formState.errors.title.message}</Error>}
    </form>
  );
}
```

**Component Split**:
```
ShareModal (main orchestration)
├── ShareModalHeader (100 lines)
├── ShareModalLinkSection (80 lines)
└── ShareModalForm (120 lines)
    ├── TagManagementSection (from Task 1.1)
    └── CategorySelect
```

**Acceptance Criteria**:
- [ ] react-hook-form integrated
- [ ] Zod validation schema defined
- [ ] Component split into 4 sub-components
- [ ] State management simplified (11 useState → 1 useForm)
- [ ] All functionality preserved
- [ ] 657 lines → ~350 lines (46% reduction)

**SOLID Check**:
- ✅ Single Responsibility: Each sub-component has one job
- ✅ Open/Closed: Extensible through form schema
- ✅ Dependency Inversion: Depends on form library abstraction

**Library Benefits**:
- Built-in validation
- Automatic error handling
- Performance optimized re-renders
- TypeScript support
- Battle-tested by thousands of projects
- Reduces custom code by ~200 lines

---

### Task 2.2: Refactor PublishModal with Form Library
**Priority**: 🔴 HIGH | **Effort**: 4 hours | **Impact**: Similar to ShareModal

**Objective**: Apply same react-hook-form pattern to PublishModal

**Current Issues**:
- 8 useState hooks
- Manual form validation
- Duplicated logic with ShareModal
- 442 lines total

**Implementation Steps**:
1. Define Zod schema for publish form (similar to share)
2. Use react-hook-form with zodResolver
3. Reuse TagManagementSection (from Task 1.1)
4. Split into sub-components if needed
5. Share validation schema with ShareModal if identical

**Shared Schema** (DRY):
```typescript
// lib/schemas/document-metadata.ts
export const documentMetadataSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).max(10, 'Maximum 10 tags'),
});

// Use in both modals
const shareFormSchema = documentMetadataSchema.extend({
  visibility: z.enum(['public', 'private']),
});
```

**Acceptance Criteria**:
- [ ] react-hook-form integrated
- [ ] Shared validation schema with ShareModal
- [ ] TagManagementSection reused
- [ ] 442 lines → ~250 lines (43% reduction)
- [ ] All functionality preserved

**DRY Check**:
- ✅ Shared validation schema between modals
- ✅ Shared TagManagementSection
- ✅ Same form patterns across app

---

### Task 2.3: Refactor ViewerCompare with Custom Hooks
**Priority**: 🟡 MEDIUM | **Effort**: 6 hours | **Impact**: Better maintainability

**Objective**: Extract scroll sync and comparison logic into custom hooks

**Current Issues**:
- Complex scroll synchronization (50+ lines)
- Search logic duplicated from ViewerTree
- Mixed concerns (UI + sync logic + comparison)
- 634 lines total

**Implementation Steps**:
1. Create `hooks/use-scroll-sync.ts` for scroll synchronization
2. Create `hooks/use-json-compare.ts` for comparison logic
3. Extract ComparePanel sub-component
4. Use shared SearchBar component (create if needed)
5. Simplify main component to orchestration only

**Custom Hooks**:
```typescript
// hooks/use-scroll-sync.ts
export function useScrollSync(refs: Array<React.RefObject<HTMLElement>>) {
  useEffect(() => {
    // Scroll sync logic
    const handleScroll = (sourceIndex: number) => {
      refs.forEach((ref, index) => {
        if (index !== sourceIndex && ref.current) {
          ref.current.scrollTop = refs[sourceIndex].current!.scrollTop;
        }
      });
    };
    // Attach listeners
    return () => {
      // Cleanup
    };
  }, [refs]);
}

// hooks/use-json-compare.ts
export function useJsonCompare(json1: any, json2: any) {
  const differences = useMemo(() => {
    return calculateDifferences(json1, json2);
  }, [json1, json2]);

  const stats = useMemo(() => ({
    added: differences.filter(d => d.type === 'added').length,
    removed: differences.filter(d => d.type === 'removed').length,
    modified: differences.filter(d => d.type === 'modified').length,
  }), [differences]);

  return { differences, stats };
}
```

**Library Consideration**:
- **USE** `fast-json-patch` for JSON diffing if custom logic is complex
- **USE** `react-diff-viewer` if we want pre-built diff visualization

**Acceptance Criteria**:
- [ ] useScrollSync hook created and tested
- [ ] useJsonCompare hook created and tested
- [ ] ComparePanel component extracted
- [ ] 634 lines → ~400 lines (37% reduction)
- [ ] Scroll sync works identically
- [ ] All comparison features preserved

**KISS Check**:
- ✅ Simple, focused hooks
- ✅ Consider library for complex diff logic
- ✅ Separate concerns clearly

---

### Task 2.4: Refactor JsonEditor with Composition
**Priority**: 🟡 MEDIUM | **Effort**: 5 hours | **Impact**: Better testability

**Objective**: Split JsonEditor into smaller, composable pieces

**Current Issues**:
- 436 lines handling editor, validation, formatting, errors
- Monaco setup mixed with UI logic
- Difficult to test individual features
- Error boundary logic inline

**Implementation Steps**:
1. Use `use-monaco-editor` hook from Task 1.2
2. Extract EditorToolbar sub-component (format, validate buttons)
3. Extract EditorStatusBar sub-component (line count, size, errors)
4. Extract ValidationPanel sub-component (error display)
5. Main JsonEditor becomes orchestration component

**Component Structure**:
```
JsonEditor (orchestration - 150 lines)
├── EditorToolbar (50 lines)
│   ├── FormatButton
│   ├── ValidateButton
│   └── DownloadButton
├── MonacoEditor (from @monaco-editor/react)
├── EditorStatusBar (60 lines)
└── ValidationPanel (80 lines)
```

**Library Usage**:
```typescript
// ✅ Use the library component directly
import Editor from '@monaco-editor/react';

function JsonEditor() {
  const { handleMount, handleChange, handleFormat } = useMonacoEditor({
    defaultValue: initialContent,
    language: 'json',
  });

  return (
    <div>
      <EditorToolbar onFormat={handleFormat} />
      <Editor
        height="600px"
        defaultLanguage="json"
        onMount={handleMount}
        onChange={handleChange}
        options={EDITOR_OPTIONS}
      />
      <EditorStatusBar />
      <ValidationPanel />
    </div>
  );
}
```

**Acceptance Criteria**:
- [ ] JsonEditor split into 5 components
- [ ] useMonacoEditor hook integrated
- [ ] Each sub-component independently testable
- [ ] 436 lines → ~340 lines (22% reduction)
- [ ] All editor features preserved

**SOLID Check**:
- ✅ Single Responsibility: Each sub-component has one job
- ✅ Open/Closed: Easy to add new toolbar buttons
- ✅ Liskov Substitution: Sub-components are replaceable

---

### Task 2.5: Refactor Sidebar with Configuration
**Priority**: 🟢 LOW | **Effort**: 3 hours | **Impact**: Maintainability

**Objective**: Extract navigation configuration and reduce duplication

**Current Issues**:
- Navigation items hardcoded in JSX
- Desktop/mobile rendering duplicated (150+ lines)
- Profile logic mixed with navigation
- 384 lines total

**Implementation Steps**:
1. Create `lib/config/navigation.ts` for nav items configuration
2. Extract ProfileSection sub-component
3. Extract NavigationItem sub-component (renders for both desktop/mobile)
4. Use map over configuration instead of manual JSX
5. Reduce duplication between desktop/mobile views

**Configuration Pattern**:
```typescript
// lib/config/navigation.ts
export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  requiresAuth?: boolean;
}

export const navigationItems: NavItem[] = [
  { label: 'Editor', href: '/edit', icon: FileJson },
  { label: 'Library', href: '/library', icon: Database, requiresAuth: true },
  { label: 'Convert', href: '/convert', icon: Zap },
  // ... more items
];

// components/layout/sidebar.tsx
function Sidebar() {
  return (
    <nav>
      {navigationItems
        .filter(item => !item.requiresAuth || session)
        .map(item => (
          <NavigationItem key={item.href} {...item} />
        ))}
    </nav>
  );
}
```

**Acceptance Criteria**:
- [ ] Navigation configuration in separate file
- [ ] NavigationItem component handles both desktop/mobile
- [ ] ProfileSection extracted
- [ ] 384 lines → ~200 lines (48% reduction)
- [ ] Easy to add/remove nav items

**DRY Check**:
- ✅ Single source of truth for navigation
- ✅ No duplication between desktop/mobile
- ✅ Configuration-driven approach

---

## 📋 Sprint 3: Polish & Optimization (Week 4 - 6 hours)

### Task 3.1: Refactor Admin Components with Data Fetching Library
**Priority**: 🔴 HIGH | **Effort**: 4 hours | **Impact**: Better data management

**Objective**: Replace manual useEffect data fetching with TanStack Query

**Current Issues**:
- Manual data fetching in useEffect across UserList, SystemStats, TagAnalytics
- Manual loading/error states
- No caching or refetch logic
- Duplicated patterns

**Implementation Steps**:
1. **Install @tanstack/react-query**: `npm install @tanstack/react-query`
2. Set up QueryClient in app layout
3. Convert UserList to use useQuery
4. Convert SystemStats to use useQuery
5. Convert TagAnalytics to use useQuery
6. Remove manual loading/error state management

**Library Usage** (CRITICAL):
```typescript
// ❌ Before (manual pattern repeated 3x)
function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await apiClient.get('/api/admin/users');
        setUsers(data.users);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  if (loading) return <Spinner />;
  if (error) return <Error />;
  return <UserTable users={users} />;
}

// ✅ After (using TanStack Query)
function UserList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => apiClient.get<{ users: User[] }>('/api/admin/users'),
  });

  if (isLoading) return <Spinner />;
  if (error) return <Error error={error} />;
  return <UserTable users={data.users} />;
}

// Bonus: Automatic refetch, caching, background updates
```

**Benefits of TanStack Query**:
- Automatic caching (no duplicate requests)
- Background refetching
- Built-in loading/error states
- Request deduplication
- Optimistic updates support
- DevTools for debugging
- Reduces custom code by 60+ lines per component

**Setup**:
```typescript
// app/layout.tsx or providers
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 1,
    },
  },
});

export default function RootLayout({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

**Acceptance Criteria**:
- [ ] TanStack Query installed and configured
- [ ] UserList uses useQuery
- [ ] SystemStats uses useQuery
- [ ] TagAnalytics uses useQuery
- [ ] Manual loading/error state removed
- [ ] 60+ lines of boilerplate eliminated
- [ ] Automatic caching working

**Library Benefits**:
- Industry standard for data fetching
- Better performance (automatic caching)
- Better UX (background refetch)
- Less code to maintain
- Built-in DevTools

**KISS Check**:
- ✅ Using proven library instead of custom patterns
- ✅ Simpler code, better features

---

### Task 3.2: Add Performance Optimizations
**Priority**: 🟡 MEDIUM | **Effort**: 2 hours | **Impact**: Better performance

**Objective**: Add memoization where beneficial

**Target Components**:
- ViewerCompare - memoize comparison results
- JsonEditor - memoize editor options
- Sidebar - memoize navigation items
- Table components - memoize column definitions

**Implementation**:
```typescript
// Use React.memo for components that receive same props
export const NavigationItem = React.memo(function NavigationItem({ item }) {
  return <a href={item.href}>{item.label}</a>;
});

// Use useMemo for expensive computations
const differences = useMemo(() => {
  return calculateJsonDiff(json1, json2);
}, [json1, json2]);

// Use useCallback for functions passed as props
const handleSort = useCallback((column: string) => {
  setSortBy(column);
}, []);
```

**Library Consideration**:
- **USE** `react-window` or `react-virtual` for large lists if needed
- **USE** `use-debounce` for search inputs (simple, 1KB)

**Acceptance Criteria**:
- [ ] Expensive computations memoized
- [ ] Component re-renders minimized
- [ ] No performance regressions
- [ ] React DevTools Profiler shows improvements

---

## 📋 Additional Improvements (Optional - As Needed)

### Task 4.1: Consider Form State Management Library
**Priority**: 🟢 LOW | **Effort**: Varies | **When**: If forms get more complex

**Options to Evaluate**:

1. **React Hook Form** (RECOMMENDED - already suggested)
   - Best for most forms
   - Excellent performance
   - TypeScript support
   - Zod integration

2. **Formik** (Alternative)
   - More opinionated
   - Built-in validation
   - Larger bundle size

3. **TanStack Form** (New option)
   - From TanStack Query authors
   - Framework agnostic
   - First-class TypeScript

**When to Use**:
- ✅ Forms with >5 fields
- ✅ Complex validation rules
- ✅ Multi-step forms
- ❌ Simple forms (1-2 fields) - just use useState

---

### Task 4.2: Consider State Management Library
**Priority**: 🟢 LOW | **Effort**: Varies | **When**: If prop drilling becomes severe

**Options to Evaluate**:

1. **Zustand** (RECOMMENDED for simplicity)
   - Tiny (1KB)
   - Simple API
   - No Provider needed
   - Perfect for client-side state

```typescript
// store/ui-store.ts
import create from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  theme: 'light',
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setTheme: (theme) => set({ theme }),
}));

// Use anywhere without Provider
function Sidebar() {
  const sidebarOpen = useUIStore(state => state.sidebarOpen);
  // ...
}
```

2. **Jotai** (Alternative - atomic approach)
   - Atom-based
   - Similar to Recoil
   - Great TypeScript support

3. **Redux Toolkit** (When you need time-travel debugging)
   - Most powerful
   - Most complex
   - Best DevTools
   - Use only if needed

**When to Use**:
- ✅ Prop drilling >3 levels
- ✅ Shared state across many components
- ✅ Complex state logic
- ❌ Simple local state - use useState

**Current Assessment**:
- React Context seems sufficient for now
- Consider Zustand only if prop drilling becomes painful

---

### Task 4.3: Consider UI Component Library
**Priority**: 🟢 LOW | **Effort**: Varies | **When**: Current shadcn/ui is insufficient

**Current Setup**:
- Using shadcn/ui (Radix UI + Tailwind)
- ✅ Good choice - keeps bundle small
- ✅ Customizable
- ✅ Accessible

**Alternatives** (only if needed):
1. **Mantine** - Feature-rich, batteries included
2. **Chakra UI** - Good a11y, composable
3. **Headless UI** - Unstyled, maximum control

**Recommendation**: Stick with shadcn/ui
- Already integrated
- Minimal bundle impact
- Highly customizable
- Good accessibility

---

## 📊 Overall Impact Summary

### Code Reduction
- **Before**: ~3,200 lines across complex components
- **After**: ~2,100 lines (34% reduction)
- **Eliminated**: 1,100 lines of duplication and boilerplate

### Component Simplification
- **Before**: 8 components >300 lines
- **After**: 0 components >300 lines
- **Average**: 283 → 180 lines per component

### Library Usage Benefits
| Custom Code | Library Replacement | Lines Saved | Benefits |
|------------|---------------------|-------------|----------|
| Manual form state | react-hook-form | ~200 | Validation, errors, performance |
| Manual data fetching | @tanstack/react-query | ~180 | Caching, refetch, deduplication |
| Custom Monaco setup | @monaco-editor/react | ~100 | Proper types, maintained API |
| Manual tag management | Shared component | ~180 | DRY, consistency |
| Custom scroll sync | Reusable hook | ~50 | Testable, reusable |
| **Total** | **Libraries + Hooks** | **~710** | **Less maintenance, better features** |

### New Reusable Assets
- **15+ new shared components**
- **13+ new custom hooks**
- **5+ utility modules**
- **3+ configuration files**

### Maintenance Improvements
- ✅ Single source of truth for common patterns
- ✅ Easier to onboard new developers
- ✅ Fewer bugs from duplicated logic
- ✅ Easier to test individual pieces
- ✅ Better TypeScript coverage
- ✅ Using battle-tested libraries

---

## 🎯 Implementation Strategy

### Phase 1: Quick Wins (Week 1)
Focus on high-impact, low-effort tasks:
- Task 1.1 → Task 1.4
- Install necessary libraries
- Immediate code reduction

### Phase 2: Major Refactors (Week 2-3)
Tackle complex components:
- Install react-hook-form, @tanstack/react-query
- Task 2.1 → Task 2.5
- Significant architecture improvements

### Phase 3: Polish (Week 4)
Final touches:
- Task 3.1 → Task 3.2
- Performance optimizations
- Documentation updates

### Phase 4: Optional (As Needed)
Evaluate and implement only if problems arise:
- Task 4.1 → Task 4.3
- Consider additional libraries
- Monitor and optimize

---

## 📈 Success Metrics

### Code Quality Metrics
- [ ] Average component size <200 lines
- [ ] Zero components >300 lines
- [ ] Zero `any` types in component files
- [ ] <100 lines of duplicated code
- [ ] Test coverage >70%

### Performance Metrics
- [ ] Lighthouse Performance Score >90
- [ ] First Contentful Paint <1.5s
- [ ] Time to Interactive <3s
- [ ] No unnecessary re-renders in production

### Developer Experience Metrics
- [ ] New feature development 30% faster
- [ ] Bug fix time reduced by 40%
- [ ] Onboarding time reduced by 50%
- [ ] Code review time reduced by 35%

### Library Adoption Metrics
- [ ] react-hook-form usage: 100% of forms >3 fields
- [ ] @tanstack/react-query usage: 100% of data fetching
- [ ] Custom code reduction: >700 lines
- [ ] Zero reinvented wheel patterns

---

## 🔍 Testing Strategy

### For Each Task
1. **Before Refactor**: Document current behavior
2. **During Refactor**: Write tests for new patterns
3. **After Refactor**: Regression test all functionality
4. **Performance**: Profile before/after with React DevTools

### Test Coverage Targets
- **Unit Tests**: All hooks and utilities (>80%)
- **Integration Tests**: All forms and data fetching (>70%)
- **E2E Tests**: Critical user flows (>60%)

### Library Testing
- react-hook-form: Test validation, submission, errors
- @tanstack/react-query: Test loading, error, success states
- Custom hooks: Test with @testing-library/react-hooks

---

## 🚀 Getting Started

### 1. Install Required Libraries
```bash
# Core refactoring libraries
npm install react-hook-form @hookform/resolvers zod
npm install @tanstack/react-query
npm install zustand # Optional, if needed

# Utility libraries
npm install use-debounce
npm install bytes # Optional, for file size formatting

# Dev dependencies
npm install -D @testing-library/react-hooks
```

### 2. Set Up Configuration
- Create QueryClient provider
- Set up query devtools (development only)
- Configure default options

### 3. Start with Task 1.1
- Extract TagManagementSection
- Immediate wins
- Build momentum

### 4. Follow the Plan
- Complete Sprint 1 → Sprint 2 → Sprint 3
- Test thoroughly at each step
- Validate metrics after each sprint

---

## 📚 Additional Resources

### Documentation to Create
- [ ] Component composition guide
- [ ] Custom hooks usage guide
- [ ] Form patterns with react-hook-form
- [ ] Data fetching with TanStack Query
- [ ] Testing patterns for hooks

### Team Knowledge Sharing
- [ ] Demo react-hook-form to team
- [ ] Demo TanStack Query to team
- [ ] Share refactoring patterns
- [ ] Review new component structure

---

## ⚠️ Important Reminders

### Before Every Task
1. **Check for Libraries First**: Don't build what exists
2. **Apply DRY**: Extract duplicated code immediately
3. **Keep It Simple**: Choose simple over clever
4. **Think SOLID**: One responsibility per component
5. **Test First**: Write tests before complex refactoring

### During Implementation
- ✅ Use existing libraries when they reduce code
- ✅ Extract duplicated logic into shared modules
- ✅ Keep components small and focused
- ✅ Add proper TypeScript types
- ✅ Write tests for new patterns
- ❌ Don't reinvent the wheel
- ❌ Don't create custom abstractions over libraries
- ❌ Don't optimize prematurely

### After Completion
- Measure improvements
- Update documentation
- Share learnings with team
- Plan next improvements

---

**Remember**: The goal is not perfection, but continuous improvement. Each task makes the codebase more maintainable, testable, and enjoyable to work with. Use libraries to reduce custom code, follow SOLID principles, and always prefer simple solutions.

**Total Estimated Effort**: 36 hours over 4 weeks
**Expected Impact**: 34% code reduction, 60% maintenance reduction, 40% faster development
