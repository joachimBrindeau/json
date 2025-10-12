# API Utilities Documentation

This directory contains comprehensive shared API utilities to eliminate code duplication and provide consistent patterns across all API endpoints.

## Files Overview

### `/lib/api/utils.ts`
Core utilities for authentication, validation, error handling, rate limiting, and CORS.

### `/lib/api/validators.ts` 
Comprehensive Zod schemas for request validation, covering all common patterns used in the application.

### `/lib/api/responses.ts`
Standardized response builders for success, error, pagination, streaming, and file downloads.

## Usage Examples

### Basic API Route with Authentication and Validation

```typescript
import { NextRequest } from 'next/server';
import { withAuth, validateRequest, handleApiError } from '@/lib/api/utils';
import { jsonDocumentCreateSchema } from '@/lib/api/validators';
import { success, badRequest } from '@/lib/api/responses';
import { prisma } from '@/lib/db';

export const POST = withAuth(async (req: NextRequest, session) => {
  try {
    // Validate request body
    const validation = await validateRequest(req, jsonDocumentCreateSchema);
    
    if (!validation.success) {
      return badRequest('Invalid request data', {
        details: validation.error?.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      });
    }

    const { title, content, description, visibility } = validation.data;

    // Create document
    const document = await prisma.jsonDocument.create({
      data: {
        title,
        content,
        description,
        visibility,
        userId: session.user.id,
      },
    });

    return success(document, {
      message: 'Document created successfully',
      status: 201,
    });
  } catch (error) {
    return handleApiError(error, 'POST /api/json');
  }
});
```

### Paginated List Endpoint

```typescript
import { NextRequest } from 'next/server';
import { withAuth, parsePaginationParams, validateSortParam } from '@/lib/api/utils';
import { paginated, badRequest } from '@/lib/api/responses';
import { prisma } from '@/lib/db';

export const GET = withAuth(async (req: NextRequest, session) => {
  try {
    const { searchParams } = new URL(req.url);
    
    // Parse pagination
    const pagination = parsePaginationParams(searchParams);
    if ('error' in pagination) {
      return badRequest(pagination.error);
    }

    // Validate sort parameter
    const sort = validateSortParam(
      searchParams.get('sort'),
      ['recent', 'title', 'size'],
      'recent'
    );
    if (typeof sort !== 'string') {
      return badRequest(sort.error);
    }

    // Query database
    const [documents, total] = await Promise.all([
      prisma.jsonDocument.findMany({
        where: { userId: session.user.id },
        skip: pagination.offset,
        take: pagination.limit,
        orderBy: { createdAt: sort === 'recent' ? 'desc' : 'asc' },
      }),
      prisma.jsonDocument.count({ where: { userId: session.user.id } }),
    ]);

    return paginated(documents, {
      page: pagination.page,
      limit: pagination.limit,
      total,
    });
  } catch (error) {
    return handleApiError(error, 'GET /api/library');
  }
});
```

### Rate Limited Endpoint

```typescript
import { NextRequest } from 'next/server';
import { withAuth, withRateLimit, composeMiddleware } from '@/lib/api/utils';
import { publishLimiter } from '@/lib/middleware/rate-limit';
import { success, tooManyRequests } from '@/lib/api/responses';

const handler = withAuth(async (req: NextRequest, session) => {
  // Your endpoint logic here
  return success({ message: 'Published successfully' });
});

// Apply rate limiting (10 requests per 15 minutes)
export const POST = withRateLimit(handler, publishLimiter);
```

### File Upload with Validation

```typescript
import { NextRequest } from 'next/server';
import { validateRequest } from '@/lib/api/utils';
import { fileUploadSchema } from '@/lib/api/validators';
import { success, badRequest, unprocessableEntity } from '@/lib/api/responses';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;

    // Validate file
    const validation = await validateRequest(req, fileUploadSchema, 'body');
    if (!validation.success) {
      return unprocessableEntity('File validation failed');
    }

    // Process file...
    
    return success({ 
      id: 'doc-123',
      message: 'File uploaded successfully' 
    });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Streaming JSON Response

```typescript
import { NextRequest } from 'next/server';
import { jsonStream } from '@/lib/api/responses';

export async function GET(req: NextRequest) {
  const largeData = {
    // ... large JSON object
  };

  return jsonStream(largeData, {
    filename: 'large-data.json'
  });
}
```

### CORS-Enabled Endpoint

```typescript
import { NextRequest } from 'next/server';
import { withCors } from '@/lib/api/utils';
import { success } from '@/lib/api/responses';

const handler = async (req: NextRequest) => {
  return success({ message: 'CORS-enabled response' });
};

export const GET = withCors(handler, {
  origin: ['https://example.com', 'https://app.example.com'],
  methods: ['GET', 'POST'],
  credentials: true,
});

export const POST = withCors(handler);
export const OPTIONS = withCors(async () => new Response(null));
```

### Middleware Composition

```typescript
import { NextRequest } from 'next/server';
import { withAuth, withRateLimit, withCors, composeMiddleware } from '@/lib/api/utils';
import { publishLimiter } from '@/lib/middleware/rate-limit';
import { success } from '@/lib/api/responses';

const baseHandler = async (req: NextRequest, session: any) => {
  return success({ message: 'Fully protected endpoint' });
};

// Compose multiple middleware layers
export const POST = composeMiddleware(
  withCors,
  (handler) => withRateLimit(handler, publishLimiter),
  withAuth
)(baseHandler);
```

## Error Handling

All utilities use consistent error handling:

```typescript
try {
  // Your logic
} catch (error) {
  return handleApiError(error, 'context');
}
```

The `handleApiError` function automatically:
- Handles Zod validation errors
- Handles Prisma database errors  
- Provides appropriate HTTP status codes
- Logs errors for debugging
- Returns consistent error responses

## Validation Patterns

### Request Body Validation
```typescript
const validation = await validateRequest(req, jsonDocumentCreateSchema);
if (!validation.success) {
  return badRequest('Validation failed', {
    details: validation.error?.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
  });
}
```

### Query Parameter Validation
```typescript
const validation = await validateRequest(req, libraryQuerySchema, 'query');
```

### Custom Validation
```typescript
import { z } from 'zod';

const customSchema = z.object({
  customField: z.string().min(1).max(100),
});

const validation = await validateRequest(req, customSchema);
```

## Response Patterns

### Success Responses
```typescript
return success(data); // 200 OK
return created(data, { location: '/api/resource/123' }); // 201 Created
return accepted(data); // 202 Accepted
return noContent(); // 204 No Content
```

### Error Responses
```typescript
return badRequest('Invalid input'); // 400 Bad Request
return unauthorized(); // 401 Unauthorized
return forbidden('Access denied'); // 403 Forbidden
return notFound('Resource not found'); // 404 Not Found
return conflict('Already exists'); // 409 Conflict
return unprocessableEntity('Validation failed'); // 422 Unprocessable Entity
return tooManyRequests('Rate limit exceeded'); // 429 Too Many Requests
return internalServerError(); // 500 Internal Server Error
```

### Pagination
```typescript
return paginated(items, {
  page: 1,
  limit: 20,
  total: 100,
});
```

## Available Validators

The validators cover all common patterns:

- **IDs**: `shareIdSchema`, `documentIdSchema`, `userIdSchema`
- **User Input**: `titleSchema`, `descriptionSchema`, `emailSchema`, `passwordSchema`
- **Pagination**: `paginationSchema`
- **Search**: `searchQuerySchema`, `sortFieldSchema`
- **JSON**: `jsonContentSchema`, `jsonMetadataSchema`
- **Authentication**: `userRegistrationSchema`, `userLoginSchema`
- **File Handling**: `fileUploadSchema`, `fileValidationSchema`
- **API Requests**: All major request schemas for endpoints

## Rate Limiting

Rate limiting is handled by importing the existing rate limiters:

```typescript
import { publishLimiter, tagSuggestLimiter } from '@/lib/middleware/rate-limit';
```

Then applying them with the `withRateLimit` wrapper.

## Security Features

- Input sanitization with `sanitizeString()`
- Client IP extraction with `getClientIp()`
- Sensitive data hashing with `hashSensitiveData()`
- CSRF protection through proper CORS configuration
- Request validation to prevent injection attacks

## Performance Features

- Streaming responses for large data
- Pagination utilities
- Efficient error handling
- Proper caching headers
- Connection management for SSE