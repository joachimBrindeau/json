# Migration Guide: New Utilities

This guide shows how to migrate to the new centralized utilities for logging, API calls, and error handling.

## 📋 Table of Contents
- [Logger Migration](#logger-migration)
- [API Client Migration](#api-client-migration)
- [Error Handling Migration](#error-handling-migration)
- [Benefits](#benefits)

---

## 🔍 Logger Migration

### Before
```typescript
// Scattered throughout codebase
console.log('User logged in:', userId);
console.error('Failed to load:', error);
console.warn('Deprecated feature used');
```

### After
```typescript
import { logger } from '@/lib/logger';

// Structured logging with metadata
logger.info('User logged in', { userId, sessionId });
logger.error('Failed to load JSON', error, { shareId });
logger.warn('Deprecated feature used', { feature: 'oldAuth' });

// Debug logs (development only)
logger.debug('Processing request', { method, url });

// Context logger for components
const log = logger.child('AuthService');
log.info('Authentication started');
log.error('Authentication failed', error);
```

### Migration Pattern
```bash
# Find all console statements
grep -r "console\." --include="*.ts" --include="*.tsx" components/

# Replace patterns:
# console.log(...)    → logger.info(...)
# console.error(...)  → logger.error(..., error, { metadata })
# console.warn(...)   → logger.warn(...)
# console.debug(...)  → logger.debug(...)
```

---

## 🌐 API Client Migration

### Before
```typescript
// Duplicated across 19+ files
const response = await fetch('/api/json/upload', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});

if (!response.ok) {
  const error = await response.json();
  throw new Error(error.error || 'Upload failed');
}

const result = await response.json();
```

### After
```typescript
import { apiClient, ApiError } from '@/lib/api/client';
import { UploadResponse } from '@/lib/api/types';

try {
  const result = await apiClient.post<UploadResponse>(
    '/api/json/upload',
    data
  );
  return result;
} catch (error) {
  if (error instanceof ApiError) {
    // Handle specific status codes
    if (error.statusCode === 413) {
      toast.error('File too large');
    }
  }
  throw error;
}
```

### Benefits
- ✅ Automatic retries with exponential backoff
- ✅ Consistent error handling
- ✅ Request timeout support
- ✅ TypeScript type safety
- ✅ Centralized configuration

### Example: Store Backend Migration

**Before** (`lib/store/backend.ts:388-399`):
```typescript
const response = await fetch('/api/json/upload', {
  method: 'POST',
  body: formData,
});

clearInterval(progressInterval);
set({ uploadProgress: 100 });

if (!response.ok) {
  const error = await response.json();
  throw new Error(error.error || 'Upload failed');
}
```

**After**:
```typescript
import { apiClient } from '@/lib/api/client';
import { UploadResponse } from '@/lib/api/types';

try {
  // Note: FormData requires custom headers
  const result = await apiClient.post<UploadResponse>(
    '/api/json/upload',
    formData,
    {
      headers: {}, // Don't set Content-Type for FormData
    }
  );

  clearInterval(progressInterval);
  set({ uploadProgress: 100 });

  return result;
} catch (error) {
  logger.error('Upload failed', error, { fileName: file.name });
  throw error;
}
```

---

## ⚠️ Error Handling Migration

### Before
```typescript
// Inconsistent error handling
try {
  // ...
} catch (error) {
  return NextResponse.json(
    { error: 'Something went wrong' },
    { status: 500 }
  );
}
```

### After
```typescript
import {
  NotFoundError,
  ValidationError,
  AuthenticationError
} from '@/lib/utils/app-errors';
import { handleApiError } from '@/lib/api/utils';

// Throw specific errors
if (!document) {
  throw new NotFoundError('Document', id);
}

if (!session) {
  throw new AuthenticationError();
}

if (invalidData) {
  throw new ValidationError('Invalid input', [
    { field: 'title', message: 'Title is required' },
    { field: 'content', message: 'Content must be valid JSON' },
  ]);
}

// Error handler converts to proper response
try {
  // ... your logic
} catch (error) {
  return handleApiError(error);
}
```

### Available Error Classes

| Error Class | Status Code | Use Case |
|-------------|-------------|----------|
| `AuthenticationError` | 401 | User not logged in |
| `AuthorizationError` | 403 | Insufficient permissions |
| `NotFoundError` | 404 | Resource doesn't exist |
| `ConflictError` | 409 | Resource already exists |
| `ValidationError` | 400 | Invalid input data |
| `RateLimitError` | 429 | Too many requests |
| `DatabaseError` | 500 | Database operation failed |
| `ExternalServiceError` | 502 | External API failed |
| `InvalidJsonError` | 400 | JSON parsing failed |
| `FileTooLargeError` | 413 | File exceeds size limit |

### Example: API Route Migration

**Before** (`app/api/json/[id]/route.ts`):
```typescript
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const document = await prisma.jsonDocument.findUnique({
      where: { shareId: params.id },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, document });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**After**:
```typescript
import { handleApiError, createApiResponse } from '@/lib/api/utils';
import { NotFoundError } from '@/lib/utils/app-errors';
import { logger } from '@/lib/logger';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const document = await prisma.jsonDocument.findUnique({
      where: { shareId: params.id },
    });

    if (!document) {
      throw new NotFoundError('Document', params.id);
    }

    logger.info('Document retrieved', { shareId: params.id });

    return createApiResponse({ document });
  } catch (error) {
    return handleApiError(error, 'GET /api/json/[id]');
  }
}
```

---

## 📚 Type Definitions

Import types for better type safety:

```typescript
import type {
  ApiResponse,
  PaginatedResponse,
  Document,
  DocumentMetadata,
  PublicDocument,
  LibraryQueryParams,
  SystemStats,
} from '@/lib/api/types';

// Usage
async function getDocuments(
  params: LibraryQueryParams
): Promise<PaginatedResponse<PublicDocument>> {
  return apiClient.get('/api/library', { params });
}
```

---

## ✅ Benefits Summary

### 🔍 Logger
- **Structured logging** with metadata
- **Environment-aware** (debug only in dev)
- **Context loggers** for components
- **External service integration** ready (Sentry, Datadog)

### 🌐 API Client
- **DRY principle** - no duplicate fetch code
- **Automatic retries** with exponential backoff
- **Timeout handling**
- **Type safety** with generics
- **Consistent errors**

### ⚠️ Error Handling
- **Semantic errors** with specific classes
- **Consistent responses** across all endpoints
- **Better debugging** with error codes
- **Type-safe** error handling

---

## 🎯 Migration Priority

1. **High Priority** (Week 1):
   - API routes → Use `handleApiError` and error classes
   - Store actions → Use `apiClient` and `logger`

2. **Medium Priority** (Week 2):
   - Components → Replace `console.*` with `logger`
   - Hooks → Use `apiClient` for fetch calls

3. **Low Priority** (Week 3):
   - Test files → Update to use new utilities
   - Documentation → Update examples

---

## 🔧 Search & Replace Helpers

```bash
# Find all fetch calls
rg "fetch\(" --type ts --type tsx

# Find all console statements
rg "console\.(log|error|warn|debug)" --type ts --type tsx

# Find all try-catch with generic errors
rg "} catch.*\{" -A 3 --type ts
```
