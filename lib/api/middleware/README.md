# API Error Handling Middleware

Comprehensive error handling infrastructure for Next.js API routes with automatic error mapping for Prisma, Zod, and custom errors.

## Features

- **Automatic Error Mapping**: Converts Prisma, Zod, and custom errors to standardized AppError instances
- **Request Tracing**: Adds unique request IDs for debugging
- **Structured Logging**: Integrated with Pino logger for consistent error logging
- **Type Safety**: Full TypeScript support with proper types
- **Flexible Configuration**: Multiple handlers for different use cases

## Quick Start

### Basic Usage

```typescript
import { withErrorHandler } from '@/lib/api/middleware';
import { success } from '@/lib/api/responses';

export const GET = withErrorHandler(async (request) => {
  const data = await fetchData();
  return success(data);
});
```

### With Validation (Zod)

```typescript
import { withValidationHandler } from '@/lib/api/middleware';
import { success } from '@/lib/api/responses';
import { z } from 'zod';

const schema = z.object({
  name: z.string(),
  email: z.string().email(),
});

export const POST = withValidationHandler(async (request) => {
  const body = await request.json();
  const validated = schema.parse(body); // Throws ZodError on failure
  return success(validated);
});
```

### With Database Operations (Prisma)

```typescript
import { withDatabaseHandler } from '@/lib/api/middleware';
import { success, notFound } from '@/lib/api/responses';
import prisma from '@/lib/db';

export const GET = withDatabaseHandler(async (request, { params }) => {
  const { id } = await params;

  // Throws Prisma errors on failure (automatically converted to AppError)
  const user = await prisma.user.findUniqueOrThrow({
    where: { id }
  });

  return success(user);
});
```

## Advanced Usage

### Custom Error Transformation

```typescript
import { withErrorHandler } from '@/lib/api/middleware';
import { AuthenticationError } from '@/lib/utils/app-errors';

export const GET = withErrorHandler(
  async (request) => {
    // Your handler code
  },
  {
    transformError: (error) => {
      if (error instanceof CustomError) {
        return new AuthenticationError('Custom auth error');
      }
      return normalizeError(error);
    }
  }
);
```

### Error Hooks

```typescript
import { withErrorHandler } from '@/lib/api/middleware';

export const POST = withErrorHandler(
  async (request) => {
    // Your handler code
  },
  {
    onError: async (error, request) => {
      // Send to error tracking service
      await errorTracker.capture(error);

      // Send alert for critical errors
      if (!error.isOperational) {
        await sendAlert(error);
      }
    }
  }
);
```

### Composing Multiple Handlers

```typescript
import { composeErrorHandlers, withValidationHandler, withDatabaseHandler } from '@/lib/api/middleware';

// Apply both validation and database error handling
export const POST = composeErrorHandlers(
  withValidationHandler,
  withDatabaseHandler
)(async (request) => {
  // Your handler code with both validation and database operations
});
```

### Error Boundaries for Internal Operations

```typescript
import { withErrorHandler, errorBoundary } from '@/lib/api/middleware';
import { ValidationError } from '@/lib/utils/app-errors';

export const GET = withErrorHandler(async (request) => {
  const data = await errorBoundary(
    async () => await riskyOperation(),
    (error) => new ValidationError('Operation failed', undefined, { originalError: error })
  );

  return success(data);
});
```

## Error Response Format

All errors are converted to a consistent response format:

```json
{
  "success": false,
  "error": "User with id 'abc123' not found",
  "code": "NOT_FOUND",
  "timestamp": "2025-10-12T18:00:00.000Z",
  "metadata": {
    "resource": "User",
    "id": "abc123",
    "requestId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

## Prisma Error Mapping

The middleware automatically maps Prisma errors:

| Prisma Code | HTTP Status | AppError Type |
|-------------|-------------|---------------|
| P2001, P2025 | 404 | NotFoundError |
| P2002 | 409 | ConflictError (unique constraint) |
| P2003 | 400 | ValidationError (foreign key) |
| P2011, P2012 | 400 | ValidationError (null constraint) |
| P2024 | 500 | DatabaseError (timeout) |

## Zod Error Mapping

Zod validation errors are automatically converted to structured validation errors:

```typescript
// Input
const schema = z.object({
  email: z.string().email(),
  age: z.number().min(18)
});

// Error Response
{
  "success": false,
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "metadata": {
    "validationErrors": [
      { "field": "email", "message": "Invalid email format" },
      { "field": "age", "message": "Number must be greater than or equal to 18" }
    ]
  }
}
```

## Logging

All errors are automatically logged with context:

```typescript
// Operational errors (expected) - logged at WARN level
{
  "level": "warn",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "method": "GET",
  "url": "/api/users/abc123",
  "errorCode": "NOT_FOUND",
  "statusCode": 404,
  "msg": "Operational error: User not found"
}

// Non-operational errors (unexpected) - logged at ERROR level
{
  "level": "error",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "method": "POST",
  "url": "/api/users",
  "errorCode": "INTERNAL_ERROR",
  "statusCode": 500,
  "stack": "Error: ...",
  "msg": "Unexpected error: Database connection failed"
}
```

## Configuration Options

```typescript
interface ErrorHandlerOptions {
  // Enable/disable error logging (default: true)
  logErrors?: boolean;

  // Custom error transformer
  transformError?: (error: unknown) => AppError;

  // Error callback hook
  onError?: (error: AppError, request: NextRequest) => void | Promise<void>;

  // Include request ID in responses (default: true)
  includeRequestId?: boolean;
}
```

## Best Practices

1. **Use Specific Handlers**: Use `withValidationHandler` for validation-heavy endpoints, `withDatabaseHandler` for database operations
2. **Throw AppErrors**: In your code, throw specific AppError subclasses for better error handling
3. **Enable Error Tracking**: Use the `onError` hook to integrate with error tracking services
4. **Log Appropriately**: Operational errors (user errors) are logged at WARN, system errors at ERROR
5. **Include Context**: Add relevant metadata to errors for better debugging

## API Reference

### `withErrorHandler(handler, options?)`
Main error handler wrapper for API routes.

### `withValidationHandler(handler, options?)`
Specialized handler for Zod validation errors.

### `withDatabaseHandler(handler, options?)`
Specialized handler for Prisma database errors.

### `createErrorHandler(options)`
Creates a reusable error handler with custom options.

### `composeErrorHandlers(...handlers)`
Composes multiple error handlers together.

### `errorBoundary(operation, errorHandler?)`
Catches errors in async operations and converts them to AppErrors.

### `catchAllErrors(handler, request, options?)`
Middleware-level error catcher for global error handling.

## Related Documentation

- [AppError Classes](../../utils/app-errors.ts) - Custom error types
- [Prisma Error Mapper](../../db/errors.ts) - Prisma error handling
- [API Response Helpers](../responses.ts) - Response builders
