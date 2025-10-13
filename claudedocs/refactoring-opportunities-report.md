# Refactoring Opportunities Report

**Generated:** 2025-10-12
**Scope:** Complete codebase analysis for DRY violations, duplicated patterns, and consolidation opportunities

---

## Executive Summary

Analysis identified **10 high-impact refactoring opportunities** across the codebase, focusing on:
- Duplicated business logic in hooks and components
- Repeated patterns in modals and forms
- API client usage inconsistencies
- Shared utilities that can be extracted
- Type definitions that should be centralized

**Priority Focus:** High-impact, low-effort opportunities that reduce technical debt and improve maintainability.

---

## Refactoring Opportunities

### 1. **Data Fetching Hook Pattern** 🔴 HIGH PRIORITY

**Pattern Identified:** Duplicated data fetching logic across multiple hooks

**Files Affected:**
- `/hooks/use-admin-stats.ts`
- `/hooks/use-library-stats.ts`

**Current Duplication:**
Both hooks implement nearly identical patterns:
```typescript
// Pattern repeated in both files:
const [data, setData] = useState<T | null>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      // API call
      setData(result);
    } catch (err) {
      setError(errorMessage);
      logger.error({ err }, 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, [dependencies]);
```

**Proposed Solution:**
Create generic `useApiData<T>` hook:
```typescript
// hooks/use-api-data.ts
export function useApiData<T>(
  fetchFn: () => Promise<T>,
  options?: {
    dependencies?: any[];
    initialData?: T;
    onError?: (error: Error) => void;
  }
) {
  const [data, setData] = useState<T | null>(options?.initialData ?? null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await fetchFn();
        setData(result);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch';
        logger.error({ err }, 'API data fetch failed');
        setError(errorMessage);
        options?.onError?.(err as Error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, options?.dependencies ?? []);

  return { data, loading, error, refetch: fetchData };
}
```

**Estimated Impact:** HIGH - Eliminates 50+ lines of duplicated code, establishes standard pattern for data fetching
**Estimated Effort:** LOW - 1-2 hours to create hook and refactor existing usages
**Files to Update:** 2 hooks initially, applicable to ~10+ components

---

### 2. **Modal Tag Management Logic** 🔴 HIGH PRIORITY

**Pattern Identified:** Identical tag management logic duplicated in multiple modals

**Files Affected:**
- `/components/features/modals/share-modal.tsx` (lines 89-267)
- `/components/features/modals/publish-modal.tsx` (lines 64-248)

**Current Duplication:**
Both modals implement ~180 lines of identical code:
- Tag input state management
- Tag validation logic
- Tag suggestions fetching
- Add/remove tag handlers
- Suggested tags UI rendering

**Proposed Solution:**
Extract into reusable `useTagManager` hook:
```typescript
// hooks/use-tag-manager.ts
export function useTagManager(
  category?: string,
  maxTags: number = 10
) {
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [tagValidation, setTagValidation] = useState<ValidationResult>({ errors: [], warnings: [] });
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // All validation, fetching, and handler logic here

  return {
    tags,
    tagInput,
    setTagInput,
    tagValidation,
    suggestedTags,
    showSuggestions,
    setShowSuggestions,
    addTag,
    removeTag,
    addSuggestedTag,
    handleKeyPress,
    commonTagsForCategory,
  };
}
```

**Estimated Impact:** HIGH - Eliminates ~180 lines of duplicated code, single source of truth for tag management
**Estimated Effort:** MEDIUM - 3-4 hours to extract hook and create shared TagInput component
**Files to Update:** 2 modals, potentially reusable in future tag features

---

### 3. **Modal Form State Pattern** 🟡 MEDIUM PRIORITY

**Pattern Identified:** Repeated form state management pattern across modals

**Files Affected:**
- `/components/features/modals/share-modal.tsx`
- `/components/features/modals/publish-modal.tsx`
- `/components/features/modals/login-modal.tsx`

**Current Duplication:**
All modals use similar patterns:
```typescript
const [formData, setFormData] = useState({
  field1: '',
  field2: '',
  // ...
});

// Update individual fields
onChange={(e) => setFormData((prev) => ({ ...prev, field: e.target.value }))}
```

**Proposed Solution:**
Create `useFormData<T>` hook with field change handler:
```typescript
// hooks/use-form-data.ts
export function useFormData<T extends Record<string, any>>(
  initialData: T
) {
  const [formData, setFormData] = useState<T>(initialData);

  const updateField = useCallback((field: keyof T, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const updateFields = useCallback((updates: Partial<T>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData(initialData);
  }, [initialData]);

  return { formData, updateField, updateFields, resetForm };
}
```

**Estimated Impact:** MEDIUM - Reduces boilerplate in ~7 modal components
**Estimated Effort:** LOW - 1-2 hours to create hook and refactor modals
**Files to Update:** 7 modal files

---

### 4. **API Error Handling Consolidation** 🟡 MEDIUM PRIORITY

**Pattern Identified:** Inconsistent error handling patterns across API calls

**Files Affected:**
- Multiple components calling `apiClient` directly
- Different toast error patterns
- Inconsistent logger usage

**Current Duplication:**
```typescript
// Pattern 1:
try {
  const data = await apiClient.get<any>('/api/endpoint');
} catch (error) {
  logger.error({ err: error }, 'Failed to fetch');
  toast({
    title: 'Failed to load',
    description: error instanceof Error ? error.message : 'Please try again',
    variant: 'destructive'
  });
}

// Pattern 2:
try {
  const data = await apiClient.get<any>('/api/endpoint');
} catch (err) {
  const errorMessage = err instanceof Error ? err.message : 'Failed';
  logger.error({ err }, 'API Error');
  toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
}
```

**Proposed Solution:**
Enhance `apiClient` with built-in error handling option:
```typescript
// lib/api/client.ts
export const apiClient = {
  async get<T>(url: string, options?: RequestOptions & {
    showErrorToast?: boolean;
    errorMessage?: string;
  }): Promise<T> {
    try {
      return await api.get(url, options).json<T>();
    } catch (error) {
      const err = handleError(error);
      if (options?.showErrorToast !== false) {
        showErrorToast(err, options?.errorMessage);
      }
      throw err;
    }
  },
  // Similar for post, put, delete, patch
};
```

**Estimated Impact:** MEDIUM - Standardizes error handling across ~50+ API calls
**Estimated Effort:** MEDIUM - 2-3 hours to enhance client and refactor existing calls
**Files to Update:** ~20+ files with API calls

---

### 5. **Toast Message Patterns** 🟢 LOW PRIORITY

**Pattern Identified:** Repeated toast message patterns throughout components

**Files Affected:**
- 19 files using `useToast` hook (124 occurrences)

**Current Duplication:**
```typescript
// Copy success - appears in 10+ files
toast({ title: 'Copied!', description: 'Copied to clipboard' });

// Save success - appears in 8+ files
toast({ title: 'Saved', description: 'Changes saved successfully' });

// Generic errors - appears in 15+ files
toast({
  title: 'Error',
  description: 'Something went wrong',
  variant: 'destructive'
});
```

**Proposed Solution:**
Extend existing `createToastHandlers` from `lib/utils/error-utils.ts`:
```typescript
// Already exists but underutilized
export const createToastHandlers = (toast: any) => ({
  copySuccess: () => toast({ title: 'Copied', description: 'Content copied to clipboard' }),
  saveSuccess: () => toast({ title: 'Saved', description: 'Changes saved successfully' }),
  deleteSuccess: () => toast({ title: 'Deleted', description: 'Item deleted successfully' }),
  // ... more patterns
});

// Usage:
const toastHandlers = createToastHandlers(toast);
toastHandlers.copySuccess();
```

**Estimated Impact:** LOW - Reduces repetitive toast code, improves consistency
**Estimated Effort:** LOW - 1 hour to expand utility and update key usage areas
**Files to Update:** Update 5-10 high-frequency files initially

---

### 6. **Document Formatting Utilities** 🟡 MEDIUM PRIORITY

**Pattern Identified:** Document response formatting duplicated in API routes

**Files Affected:**
- `/lib/api/utils.ts` (lines 567-628)
- Multiple API route files

**Current Duplication:**
Two nearly identical functions in same file:
```typescript
// lib/api/utils.ts
export function formatDocumentResponse(document: any) { /* 22 lines */ }
export function formatDocumentListResponse(documents: any[], isPublic: boolean = false) { /* 32 lines */ }
```

**Proposed Solution:**
Consolidate into single flexible formatter:
```typescript
// lib/api/formatters/document-formatter.ts
interface DocumentFormatterOptions {
  isPublic?: boolean;
  includePreview?: boolean;
  includeAuthor?: boolean;
}

export function formatDocument(
  document: any,
  options: DocumentFormatterOptions = {}
) {
  const { isPublic = false, includePreview = false, includeAuthor = false } = options;

  const formatted = {
    id: isPublic ? document.shareId : document.id,
    shareId: document.shareId,
    title: document.title || 'Untitled',
    // ... common fields
  };

  if (includeAuthor && document.user) {
    formatted.author = document.user;
  }

  if (includePreview && document.content) {
    formatted.preview = JSON.stringify(document.content, null, 2).slice(0, 200) + '...';
  }

  return formatted;
}

export function formatDocuments(
  documents: any[],
  options: DocumentFormatterOptions = {}
) {
  return documents.map(doc => formatDocument(doc, options));
}
```

**Estimated Impact:** MEDIUM - Cleaner API response formatting, easier to maintain
**Estimated Effort:** LOW - 1-2 hours to refactor and update API routes
**Files to Update:** 1 utility file, ~5 API route files

---

### 7. **Component Loading States** 🟢 LOW PRIORITY

**Pattern Identified:** Duplicated loading state patterns across components

**Files Affected:**
- 32 files with `useState` for loading states
- Repeated try/catch/finally patterns

**Current Duplication:**
```typescript
const [loading, setLoading] = useState(false);

const handleAction = async () => {
  try {
    setLoading(true);
    // action
  } catch (error) {
    // error handling
  } finally {
    setLoading(false);
  }
};
```

**Proposed Solution:**
Already exists but underutilized: `useFormSubmit` hook in `/hooks/use-form-submit.ts`

**Action Items:**
1. Rename to `useAsyncAction` for broader applicability
2. Document and promote usage
3. Refactor key components to use it

**Estimated Impact:** LOW - Reduces boilerplate in async operations
**Estimated Effort:** LOW - 1 hour to rename/document, 2-3 hours to refactor high-usage areas
**Files to Update:** 10-15 components with async operations

---

### 8. **Pagination Parameter Parsing** 🟢 LOW PRIORITY

**Pattern Identified:** Pagination parsing already centralized but has legacy wrapper

**Files Affected:**
- `/lib/api/utils.ts` (lines 379-513)

**Current Duplication:**
```typescript
// Modern function
export function parsePaginationParams(
  searchParams: URLSearchParams,
  defaults: { page?: number; limit?: number; maxLimit?: number } = {}
): PaginationParams | { error: string; status: number } { /* ... */ }

// Legacy wrapper (deprecated but still exists)
export function validatePaginationParams(searchParams: URLSearchParams) {
  const result = parsePaginationParams(searchParams);
  if ('error' in result) {
    throw new Error(result.error);
  }
  return { page: result.page, limit: result.limit };
}
```

**Proposed Solution:**
Remove deprecated `validatePaginationParams` wrapper after ensuring no usages exist.

**Estimated Impact:** LOW - Code cleanup, removes deprecated code
**Estimated Effort:** LOW - 30 minutes to verify no usages and remove
**Files to Update:** 1 file (cleanup)

---

### 9. **Type Definitions Consolidation** 🟡 MEDIUM PRIORITY

**Pattern Identified:** Similar type definitions across multiple files

**Files Affected:**
- `/lib/api/types.ts` - 17 interfaces
- `/lib/api/utils.ts` - 5 interfaces
- Various component files with local types

**Current Duplication:**
```typescript
// lib/api/types.ts
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string;
  timestamp?: string;
}

// lib/utils/error-utils.ts
export interface SuccessResult<T = any> {
  success: true;
  data: T;
}

export interface ErrorResult {
  success: false;
  error: string;
}
```

**Proposed Solution:**
Consolidate related types into domain-specific type files:
```
/lib/types/
  api.ts        - API request/response types
  forms.ts      - Form-related types
  documents.ts  - Document-related types
  errors.ts     - Error handling types
```

**Estimated Impact:** MEDIUM - Improves type consistency and discoverability
**Estimated Effort:** MEDIUM - 2-3 hours to reorganize and update imports
**Files to Update:** ~20+ files importing types

---

### 10. **Constants Centralization** 🟡 MEDIUM PRIORITY

**Pattern Identified:** Magic strings and repeated constants

**Files Affected:**
- `/components/features/modals/share-modal.tsx` - CATEGORIES array
- `/components/features/modals/publish-modal.tsx` - CATEGORIES array (duplicate)
- Various files with repeated strings

**Current Duplication:**
```typescript
// Appears in both share-modal.tsx and publish-modal.tsx
const CATEGORIES = [
  'API Response',
  'Configuration',
  'Database Schema',
  'Test Data',
  'Template',
  'Example',
] as const;
```

**Proposed Solution:**
Create centralized constants file:
```typescript
// lib/constants/categories.ts
export const DOCUMENT_CATEGORIES = [
  'API Response',
  'Configuration',
  'Database Schema',
  'Test Data',
  'Template',
  'Example',
] as const;

export type DocumentCategory = typeof DOCUMENT_CATEGORIES[number];

// lib/constants/index.ts
export * from './categories';
export * from './validation'; // max lengths, etc.
export * from './formats'; // file formats, mime types
```

**Estimated Impact:** MEDIUM - Single source of truth for app constants
**Estimated Effort:** LOW - 1-2 hours to create constants and refactor usages
**Files to Update:** 10+ files with duplicated constants

---

## Implementation Roadmap

### Phase 1: High-Impact Quick Wins (Week 1)
1. **Data Fetching Hook Pattern** - Create `useApiData` hook
2. **Modal Tag Management** - Extract `useTagManager` hook
3. **Constants Centralization** - Create constants directory

**Expected ROI:** ~400 lines of code eliminated, 3 reusable utilities created

### Phase 2: Code Quality Improvements (Week 2)
4. **Modal Form State Pattern** - Create `useFormData` hook
5. **Document Formatting** - Consolidate formatters
6. **Component Loading States** - Promote `useAsyncAction` usage

**Expected ROI:** ~200 lines eliminated, improved consistency

### Phase 3: Infrastructure Cleanup (Week 3)
7. **API Error Handling** - Enhance apiClient with standard error handling
8. **Type Definitions** - Reorganize into domain-specific files
9. **Toast Patterns** - Expand and promote `createToastHandlers`
10. **Pagination Cleanup** - Remove deprecated functions

**Expected ROI:** Better maintainability, reduced cognitive load

---

## Metrics

### Before Refactoring
- **Duplicated Code:** ~800 lines identified
- **Pattern Violations:** 10 major patterns
- **Complexity Hotspots:** 15 files with high duplication

### After Refactoring (Projected)
- **Code Reduction:** ~600 lines eliminated
- **New Reusable Utilities:** 6 hooks, 3 utility modules
- **Improved Maintainability:** Single source of truth for common patterns

### Risk Assessment
- **Breaking Changes:** LOW - Most refactoring is additive
- **Testing Impact:** MEDIUM - Need to test refactored components
- **Migration Effort:** LOW-MEDIUM - Can be done incrementally

---

## Additional Observations

### Positive Findings
1. **Good existing utilities** - `lib/utils/error-utils.ts` already has useful patterns
2. **Modern API client** - `lib/api/client.ts` uses ky with good foundation
3. **Hook patterns** - `useFormSubmit` is well-designed, just underutilized

### Technical Debt Areas
1. **Inconsistent naming** - Some components use `isOpen`, others use `open`
2. **Mixed error handling** - Some use Results, others throw
3. **Type safety gaps** - Some API responses typed as `any`

### Recommendations Beyond This Report
1. Consider adding ESLint rules to prevent future duplication
2. Create component library documentation for reusable patterns
3. Implement automated code complexity analysis in CI/CD

---

## Conclusion

This analysis identified **10 concrete refactoring opportunities** that can significantly improve codebase maintainability:

**Quick Wins (4-6 hours):**
- Items #1, #3, #6, #8, #10

**Medium Effort (8-12 hours):**
- Items #2, #4, #7, #9

**Ongoing Improvement:**
- Item #5 (toast patterns) can be gradually adopted

**Total Estimated Effort:** 20-25 hours for complete implementation
**Total Estimated Impact:** ~600 lines of code reduction, 6 new reusable utilities

All opportunities focus on **DRY principle enforcement** and **pattern standardization** while maintaining backward compatibility and allowing incremental adoption.
