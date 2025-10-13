# Centralized Utilities Documentation

## Overview

This project includes four centralized utilities for consistent code quality:

1. **Logger** (`lib/logger.ts`) - Structured logging
2. **API Client** (`lib/api/client.ts`) - HTTP request handling
3. **Error Classes** (`lib/utils/app-errors.ts`) - Standardized errors
4. **API Types** (`lib/api/types.ts`) - Type definitions

---

## 🔍 Logger (`lib/logger.ts`)

### Features
- ✅ Environment-aware (debug logs only in development)
- ✅ Structured logging with metadata
- ✅ Error object handling with stack traces
- ✅ Context loggers for components
- ✅ External service integration ready

### Basic Usage

```typescript
import { logger } from '@/lib/logger';

// Simple logging
logger.info('User logged in');
logger.warn('Rate limit approaching');
logger.error('Database connection failed');
logger.debug('Detailed debug info'); // Dev only

// With metadata
logger.info('Document uploaded', {
  documentId: 'abc123',
  size: 1024,
  userId: 'user_456',
});

// With error objects
try {
  await riskyOperation();
} catch (error) {
  logger.error('Operation failed', error, {
    operation: 'riskyOperation',
    retryCount: 3,
  });
}
```

### Context Logger

Create context-specific loggers for better organization:

```typescript
import { logger } from '@/lib/logger';

// In a component or service
const log = logger.child('AuthService');

class AuthService {
  async login(email: string) {
    log.info('Login attempt', { email });

    try {
      // ... login logic
      log.info('Login successful', { email });
    } catch (error) {
      log.error('Login failed', error, { email });
      throw error;
    }
  }
}
```

### Output Examples

```
[INFO] User logged in { userId: "123", sessionId: "abc" }
[WARN] Rate limit approaching { endpoint: "/api/json", remaining: 5 }
[ERROR] Database connection failed { error: "Connection timeout", ... }
[DEBUG] Processing request { method: "POST", url: "/api/upload" }
```

### Environment Behavior

- **Development**: All log levels visible
- **Production**: Debug logs disabled, errors sent to external service

---

## 🌐 API Client (`lib/api/client.ts`)

### Features
- ✅ Automatic retries with exponential backoff
- ✅ Request timeout handling
- ✅ Consistent error handling
- ✅ TypeScript generics for type safety
- ✅ Support for JSON, FormData, and text

### Basic Usage

```typescript
import { apiClient, ApiError } from '@/lib/api/client';
import type { Document } from '@/lib/api/types';

// GET request
const document = await apiClient.get<Document>('/api/json/abc123');

// POST request
const result = await apiClient.post('/api/json/upload', {
  title: 'My Document',
  content: { foo: 'bar' },
});

// PUT request
await apiClient.put(`/api/json/${id}`, { title: 'Updated' });

// DELETE request
await apiClient.delete(`/api/json/${id}`);

// PATCH request
await apiClient.patch(`/api/json/${id}`, { viewCount: 10 });
```

### Error Handling

```typescript
import { apiClient, ApiError } from '@/lib/api/client';

try {
  const data = await apiClient.post('/api/endpoint', payload);
} catch (error) {
  if (error instanceof ApiError) {
    console.log(error.statusCode); // 404, 500, etc.
    console.log(error.code);       // Error code from API
    console.log(error.details);    // Additional details

    // Handle specific status codes
    if (error.statusCode === 404) {
      toast.error('Resource not found');
    } else if (error.statusCode === 429) {
      toast.error('Too many requests, please wait');
    }
  }
}
```

### Advanced Options

```typescript
// Custom timeout (default: 30s)
await apiClient.get('/api/slow-endpoint', {
  timeout: 60000, // 60 seconds
});

// Custom retries (default: 3)
await apiClient.post('/api/endpoint', data, {
  retries: 5,
});

// Skip automatic error handling
const response = await apiClient.get('/api/endpoint', {
  skipErrorHandling: true,
});

// Custom headers
await apiClient.post('/api/endpoint', data, {
  headers: {
    'X-Custom-Header': 'value',
  },
});
```

### FormData Support

```typescript
const formData = new FormData();
formData.append('file', file);
formData.append('title', 'Document Title');

// Client automatically detects FormData
const result = await apiClient.post('/api/upload', formData);
```

### Retry Logic

The client automatically retries requests with exponential backoff:

- Initial retry: 1 second delay
- Second retry: 2 seconds delay
- Third retry: 4 seconds delay
- Max delay: 10 seconds

**Retries are skipped for**:
- Client errors (4xx status codes)
- Validation errors
- Authentication errors

---

## ⚠️ Error Classes (`lib/utils/app-errors.ts`)

### Available Error Classes

| Class | Status | Code | Use Case |
|-------|--------|------|----------|
| `AppError` | 500 | Custom | Base class |
| `AuthenticationError` | 401 | `UNAUTHORIZED` | Not logged in |
| `AuthorizationError` | 403 | `FORBIDDEN` | No permission |
| `NotFoundError` | 404 | `NOT_FOUND` | Resource missing |
| `ConflictError` | 409 | `ALREADY_EXISTS` | Duplicate resource |
| `ValidationError` | 400 | `VALIDATION_ERROR` | Invalid input |
| `RateLimitError` | 429 | `RATE_LIMIT_EXCEEDED` | Too many requests |
| `DatabaseError` | 500 | `DATABASE_ERROR` | DB operation failed |
| `ExternalServiceError` | 502 | `EXTERNAL_SERVICE_ERROR` | External API failed |
| `InvalidJsonError` | 400 | `INVALID_JSON` | JSON parse error |
| `FileTooLargeError` | 413 | `FILE_TOO_LARGE` | File exceeds limit |

### Usage Examples

#### Authentication Error
```typescript
import { AuthenticationError } from '@/lib/utils/app-errors';

if (!session) {
  throw new AuthenticationError('Please log in to continue');
}
```

#### Not Found Error
```typescript
import { NotFoundError } from '@/lib/utils/app-errors';

const document = await findDocument(id);
if (!document) {
  throw new NotFoundError('Document', id);
  // Message: "Document with id 'abc123' not found"
}
```

#### Validation Error
```typescript
import { ValidationError } from '@/lib/utils/app-errors';

if (!isValid) {
  throw new ValidationError('Invalid input', [
    { field: 'email', message: 'Invalid email format' },
    { field: 'password', message: 'Password must be 8+ characters' },
  ]);
}
```

#### File Too Large Error
```typescript
import { FileTooLargeError } from '@/lib/utils/app-errors';

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
if (file.size > MAX_SIZE) {
  throw new FileTooLargeError(MAX_SIZE, file.size, {
    fileName: file.name,
  });
}
```

#### Rate Limit Error
```typescript
import { RateLimitError } from '@/lib/utils/app-errors';

if (isRateLimited) {
  throw new RateLimitError(
    900, // retry after 900 seconds (15 min)
    'Rate limit exceeded. Try again later.'
  );
}
```

### Error Metadata

All errors support metadata:

```typescript
throw new NotFoundError('User', userId, {
  requestId: req.headers.get('x-request-id'),
  attemptedAction: 'profile-update',
  source: 'ProfileService',
});
```

### Error Serialization

Errors can be serialized to JSON:

```typescript
const error = new ValidationError('Invalid input', [
  { field: 'email', message: 'Required' },
]);

console.log(error.toJSON());
// Output:
// {
//   name: 'ValidationError',
//   message: 'Invalid input',
//   code: 'VALIDATION_ERROR',
//   statusCode: 400,
//   metadata: { validationErrors: [...] },
//   stack: '...' // in development only
// }
```

---

## 📘 API Types (`lib/api/types.ts`)

### Core Types

```typescript
import type {
  ApiResponse,
  PaginatedResponse,
  ErrorResponse,
  Document,
  DocumentMetadata,
  PublicDocument,
  UserProfile,
  LibraryQueryParams,
} from '@/lib/api/types';
```

### Usage in Functions

```typescript
import type {
  Document,
  LibraryQueryParams,
  PaginatedResponse
} from '@/lib/api/types';

async function searchDocuments(
  params: LibraryQueryParams
): Promise<PaginatedResponse<Document>> {
  return apiClient.get('/api/library', { params });
}

async function getDocument(id: string): Promise<Document> {
  const response = await apiClient.get<ApiResponse<Document>>(
    `/api/json/${id}`
  );
  return response.data!;
}
```

### Type Definitions

#### Document Types
```typescript
interface DocumentMetadata {
  id: string;
  shareId: string;
  title?: string;
  description?: string;
  tags?: string[];
  category?: string;
  size: number;
  nodeCount: number;
  maxDepth: number;
  complexity: 'Low' | 'Medium' | 'High';
  visibility: 'private' | 'public';
  viewCount: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface Document extends DocumentMetadata {
  content: unknown;
}

interface PublicDocument extends DocumentMetadata {
  author?: {
    name?: string;
    image?: string;
  };
  preview?: string;
  richContent?: string;
}
```

#### Query Parameters
```typescript
interface LibraryQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  tags?: string[];
  category?: string;
  sort?: 'recent' | 'popular' | 'title' | 'size';
  visibility?: 'private' | 'public';
}
```

#### Pagination
```typescript
interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationMeta;
}
```

---

## 🎯 Best Practices

### 1. Always Use Logger
```typescript
// ❌ Bad
console.log('User action:', action);

// ✅ Good
logger.info('User action', { action, userId });
```

### 2. Use API Client for Fetch
```typescript
// ❌ Bad
const res = await fetch('/api/endpoint');
const data = await res.json();

// ✅ Good
const data = await apiClient.get('/api/endpoint');
```

### 3. Throw Specific Errors
```typescript
// ❌ Bad
throw new Error('Not found');

// ✅ Good
throw new NotFoundError('Document', id);
```

### 4. Use Type Definitions
```typescript
// ❌ Bad
async function getDoc(id: string): Promise<any> {
  return apiClient.get(`/api/json/${id}`);
}

// ✅ Good
async function getDoc(id: string): Promise<Document> {
  return apiClient.get<Document>(`/api/json/${id}`);
}
```

---

## 🚀 Quick Start Checklist

- [ ] Import `logger` instead of using `console.*`
- [ ] Use `apiClient` for all HTTP requests
- [ ] Throw specific error classes in API routes
- [ ] Import types from `@/lib/api/types`
- [ ] Add metadata to logs for better debugging
- [ ] Handle `ApiError` in client-side code
- [ ] Use context loggers for services/components
- [ ] Add type annotations to API functions

---

## 📚 Related Documentation

- [Migration Guide](./MIGRATION_GUIDE.md) - Step-by-step migration instructions
- [API Utils](../lib/api/utils.ts) - Server-side API utilities
- [ESLint Config](../eslint.config.mjs) - Code style enforcement
