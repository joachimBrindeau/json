# API Error Handling Centralization

## Summary

Centralized API error handling patterns across the application by enhancing the API client with automatic logging and toast notifications, eliminating redundant error handling code in components.

## Changes Made

### 1. Enhanced `lib/api/client.ts`

**New Features:**
- Centralized error logging with context
- Automatic toast notifications for user-facing errors (4xx except 401, 403)
- Support for skipping automatic toasts via `skipErrorToast` option
- Custom error context via `errorContext` option
- Backward-compatible `statusCode` property on `ApiError`

**Updated `RequestOptions`:**
```typescript
export interface RequestOptions extends Options {
  skipErrorHandling?: boolean;
  skipErrorToast?: boolean;      // NEW: Skip automatic error toast
  errorContext?: string;          // NEW: Custom context for logging
}
```

**Updated `ApiError`:**
```typescript
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,        // Primary property
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    // Backward-compatible statusCode getter
    Object.defineProperty(this, 'statusCode', {
      get() { return this.status; },
      enumerable: true,
    });
  }
}
```

**Error Handling Flow:**
```typescript
async function handleError(error: unknown, context?: string, options?: RequestOptions): Promise<never> {
  // 1. Parse error into ApiError
  let apiError: ApiError = parseError(error);

  // 2. Log with context
  logger.error({
    err: apiError,
    context: options?.errorContext || context || 'API call',
    status: apiError.status,
    code: apiError.code
  }, 'API call failed');

  // 3. Show toast for user-facing errors (4xx except auth)
  const shouldShowToast =
    !options?.skipErrorToast &&
    apiError.status >= 400 &&
    apiError.status < 500 &&
    ![401, 403].includes(apiError.status);

  if (shouldShowToast) {
    showErrorToast(apiError, context);
  }

  // 4. Re-throw for component-level handling
  throw apiError;
}
```

### 2. Created `hooks/use-api-mutation.ts`

**Purpose:** Standardized mutation handling with automatic error handling and success toasts.

**Core Hook:**
```typescript
export function useApiMutation<TData, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: UseApiMutationOptions<TData, TVariables> = {}
): UseApiMutationReturn<TData, TVariables>
```

**Features:**
- Automatic error handling via apiClient
- Optional success toast notifications
- Loading state management
- Error state management
- Success/error callbacks

**Convenience Hooks:**
```typescript
// POST request
useApiPost<TData, TVariables>(url, options)

// PUT request
useApiPut<TData, TVariables>(url | urlFn, options)

// DELETE request
useApiDelete<TData, TVariables>(url | urlFn, options)

// PATCH request
useApiPatch<TData, TVariables>(url | urlFn, options)
```

### 3. Updated Components

**Example: `share-modal.tsx`**

**Before:**
```typescript
try {
  await apiClient.post(`/api/json/${shareId}/publish`, publishData);
  showSuccessToast('Published successfully!', {
    description: 'Your JSON is now discoverable'
  });
  onUpdated?.();
  onOpenChange(false);
} catch (error) {
  logger.error({ err: error }, 'Failed to publish');
  showErrorToast(error, 'Failed to update');
}
```

**After:**
```typescript
const publishMutation = useApiMutation(
  async (data: Omit<ShareFormData, 'visibility'>) =>
    apiClient.post(`/api/json/${shareId}/publish`, data),
  {
    successMessage: 'Published successfully!',
    onSuccess: () => {
      onUpdated?.();
      onOpenChange(false);
    },
  }
);

// Later in code:
await publishMutation.mutate(publishData);
```

**Benefits:**
- No manual `try/catch` blocks needed
- No manual `logger.error` calls (handled by apiClient)
- No manual `showErrorToast` calls (handled by apiClient)
- Cleaner, more declarative code
- Consistent error handling across the app

## Migration Guide

### For Simple API Calls

**Before:**
```typescript
const [isLoading, setIsLoading] = useState(false);

const handleAction = async () => {
  try {
    setIsLoading(true);
    const data = await apiClient.post('/api/endpoint', payload);
    showSuccessToast('Success!');
    onSuccess(data);
  } catch (error) {
    logger.error({ err: error }, 'Operation failed');
    showErrorToast(error, 'Failed to perform action');
  } finally {
    setIsLoading(false);
  }
};
```

**After:**
```typescript
const { mutate, isLoading } = useApiMutation(
  async (payload) => apiClient.post('/api/endpoint', payload),
  {
    successMessage: 'Success!',
    onSuccess: (data) => onSuccess(data),
  }
);

const handleAction = () => mutate(payload);
```

### For API Calls with Custom Error Handling

**Before:**
```typescript
try {
  const data = await apiClient.get('/api/data');
  processData(data);
} catch (error) {
  logger.error({ err: error }, 'Failed to load data');
  showErrorToast(error, 'Failed to load data');
  // Custom error handling
  setFallbackData();
}
```

**After:**
```typescript
const { mutate } = useApiMutation(
  async () => apiClient.get('/api/data'),
  {
    onSuccess: (data) => processData(data),
    onError: () => setFallbackData(),
  }
);

mutate();
// Error logging and toast handled automatically by apiClient
```

### For API Calls Without Success Toast

**Before:**
```typescript
try {
  await apiClient.post('/api/endpoint', data);
  // No success toast needed
  doSomething();
} catch (error) {
  logger.error({ err: error }, 'Operation failed');
  showErrorToast(error, 'Failed');
}
```

**After:**
```typescript
const { mutate } = useApiMutation(
  async (data) => apiClient.post('/api/endpoint', data),
  {
    showSuccessToast: false,
    onSuccess: () => doSomething(),
  }
);

mutate(data);
```

### For API Calls with Custom Context

**Before:**
```typescript
try {
  await apiClient.post('/api/endpoint', data);
} catch (error) {
  logger.error({
    err: error,
    userId,
    operation: 'user-update'
  }, 'Failed to update user');
  showErrorToast(error, 'Failed to update user');
}
```

**After:**
```typescript
const { mutate } = useApiMutation(
  async (data) =>
    apiClient.post('/api/endpoint', data, {
      errorContext: `Update user ${userId}`,
    }),
  {
    successMessage: 'User updated',
  }
);

mutate(data);
```

### For API Calls Without Automatic Toast

**Before:**
```typescript
try {
  const data = await apiClient.get('/api/metadata');
  // Silent operation, no toast on error
  processMetadata(data);
} catch (error) {
  logger.debug({ err: error }, 'Metadata not found - using defaults');
  useDefaults();
}
```

**After:**
```typescript
const { mutate } = useApiMutation(
  async () =>
    apiClient.get('/api/metadata', { skipErrorToast: true }),
  {
    showSuccessToast: false,
    onSuccess: (data) => processMetadata(data),
    onError: (error) => {
      logger.debug({ err: error }, 'Metadata not found - using defaults');
      useDefaults();
    },
  }
);

mutate();
```

## Error Handling Decision Tree

```
API Call
├─ Need custom error handling?
│  ├─ YES → Use onError callback
│  └─ NO → Let apiClient handle it
├─ Need success toast?
│  ├─ YES → Set successMessage
│  └─ NO → Set showSuccessToast: false
├─ Need custom error context?
│  ├─ YES → Set errorContext in RequestOptions
│  └─ NO → Default context used
└─ Silent operation (no error toast)?
   ├─ YES → Set skipErrorToast: true
   └─ NO → Auto toast for 4xx errors (except 401, 403)
```

## Benefits

### For Developers
1. **Less Boilerplate:** No manual try/catch, logging, or toast calls
2. **Consistency:** All API errors handled the same way
3. **Type Safety:** Full TypeScript support with generics
4. **Flexibility:** Can override defaults when needed
5. **Maintainability:** Centralized error handling logic

### For Users
1. **Better UX:** Consistent error messaging
2. **Better Debugging:** Comprehensive error logs with context
3. **No Duplicate Toasts:** Prevents multiple error notifications
4. **Clear Feedback:** Success and error states clearly communicated

## Components to Migrate

The following components still use manual error handling and should be migrated:

### High Priority (Frequently Used)
- [ ] `components/features/editor/json-editor.tsx`
- [ ] `components/features/viewer/ViewerActions.tsx`
- [ ] `components/features/admin/user-list.tsx`
- [ ] `components/features/admin/system-stats.tsx`

### Medium Priority
- [ ] `components/features/modals/publish-modal.tsx`
- [ ] `components/features/modals/export-modal.tsx`
- [ ] `components/features/modals/login-modal.tsx`
- [ ] `app/library/page.tsx`

### Low Priority (Less Common Operations)
- [ ] `app/api/auth/*` (already server-side)
- [ ] `app/superadmin/*` (admin-only)

## Testing Checklist

When migrating a component:

- [ ] Verify error logging includes appropriate context
- [ ] Confirm error toasts appear for user-facing errors (4xx)
- [ ] Verify no error toasts for auth errors (401, 403)
- [ ] Check success toasts display correctly
- [ ] Test loading states work as expected
- [ ] Verify custom error handling (onError) works
- [ ] Confirm skipErrorToast option prevents toasts when needed
- [ ] Test that errors are still catchable at component level if needed

## Advanced Patterns

### Batch Operations
```typescript
const deleteMutation = useApiMutation(
  async (ids: string[]) =>
    Promise.all(ids.map(id => apiClient.delete(`/api/items/${id}`))),
  {
    successMessage: 'All items deleted',
    onSuccess: () => refreshList(),
  }
);
```

### Optimistic Updates
```typescript
const updateMutation = useApiMutation(
  async (item: Item) => apiClient.put(`/api/items/${item.id}`, item),
  {
    onSuccess: (data) => {
      // Update cache optimistically
      queryClient.setQueryData(['items', item.id], data);
    },
    onError: (error) => {
      // Rollback on error
      queryClient.invalidateQueries(['items']);
    },
  }
);
```

### Sequential Mutations
```typescript
const saveAndPublish = async (data: FormData) => {
  // First mutation
  const saved = await saveMutation.mutate(data);

  // Second mutation with result from first
  await publishMutation.mutate(saved.id);
};
```

## Related Files

- `/lib/api/client.ts` - Enhanced API client
- `/hooks/use-api-mutation.ts` - Mutation hook
- `/lib/utils/toast-helpers.ts` - Toast utilities
- `/lib/logger.ts` - Logging utility
- `/components/features/modals/share-modal.tsx` - Example migration
