/**
 * API error handling middleware
 * Provides consistent error handling for API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError, ValidationError, normalizeError } from '@/lib/utils/app-errors';
import { mapPrismaError, isPrismaError } from '@/lib/db/errors';
import { logger, logError } from '@/lib/logger';
import * as responses from '@/lib/api/responses';

/**
 * API route handler function type
 */
export type ApiRouteHandler<T = unknown> = (
  request: NextRequest,
  context?: { params: Record<string, string> }
) => Promise<NextResponse<T>> | NextResponse<T>;

/**
 * Error handler options
 */
export interface ErrorHandlerOptions {
  /**
   * Whether to log errors (default: true)
   */
  logErrors?: boolean;

  /**
   * Custom error transformer
   */
  transformError?: (error: unknown) => AppError;

  /**
   * Called after error is caught but before response is sent
   */
  onError?: (error: AppError, request: NextRequest) => void | Promise<void>;

  /**
   * Include request ID in response metadata (default: true)
   */
  includeRequestId?: boolean;
}

/**
 * Generates a unique request ID for tracing
 */
function generateRequestId(): string {
  return crypto.randomUUID();
}

/**
 * Extracts request metadata for logging
 */
function extractRequestMetadata(request: NextRequest) {
  return {
    method: request.method,
    url: request.url,
    pathname: new URL(request.url).pathname,
    userAgent: request.headers.get('user-agent'),
    referer: request.headers.get('referer'),
  };
}

/**
 * Converts Zod errors to ValidationError
 */
function handleZodError(error: ZodError): ValidationError {
  const validationErrors = error.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));

  return new ValidationError(
    'Validation failed',
    validationErrors,
    {
      zodErrors: error.issues,
    }
  );
}

/**
 * Wraps an API route handler with comprehensive error handling
 *
 * @example
 * export const GET = withErrorHandler(async (request) => {
 *   const data = await fetchData();
 *   return responses.success(data);
 * });
 *
 * @example
 * export const POST = withErrorHandler(async (request) => {
 *   const body = await request.json();
 *   const result = await createResource(body);
 *   return responses.created(result);
 * }, {
 *   logErrors: true,
 *   onError: async (error) => {
 *     await notifyErrorTracking(error);
 *   }
 * });
 */
export function withErrorHandler<T = unknown>(
  handler: ApiRouteHandler<T>,
  options: ErrorHandlerOptions = {}
): ApiRouteHandler<T> {
  const {
    logErrors = true,
    transformError,
    onError,
    includeRequestId = true,
  } = options;

  return async (request: NextRequest, context?: { params: Record<string, string> }) => {
    const requestId = generateRequestId();
    const requestMetadata = extractRequestMetadata(request);

    // Create child logger with request context
    const requestLogger = logger.child({
      requestId,
      ...requestMetadata,
    });

    try {
      // Execute the handler
      const response = await handler(request, context);

      // Add request ID to successful responses
      if (includeRequestId) {
        response.headers.set('X-Request-ID', requestId);
      }

      return response;
    } catch (error) {
      let appError: AppError;

      // Transform error to AppError
      if (transformError) {
        appError = transformError(error);
      } else if (error instanceof AppError) {
        appError = error;
      } else if (error instanceof ZodError) {
        appError = handleZodError(error);
      } else if (isPrismaError(error)) {
        appError = mapPrismaError(error);
      } else {
        appError = normalizeError(error);
      }

      // Log error if enabled
      if (logErrors) {
        const errorMetadata = {
          requestId,
          errorCode: appError.code,
          statusCode: appError.statusCode,
          isOperational: appError.isOperational,
          metadata: appError.metadata,
          ...requestMetadata,
        };

        if (appError.isOperational) {
          // Operational errors are expected and logged at warn level
          requestLogger.warn(errorMetadata, `Operational error: ${appError.message}`);
        } else {
          // Non-operational errors are unexpected and logged at error level
          logError(requestLogger, `Unexpected error: ${appError.message}`, error, errorMetadata);
        }
      }

      // Call onError hook if provided
      if (onError) {
        try {
          await onError(appError, request);
        } catch (hookError) {
          requestLogger.error({ err: hookError, requestId }, 'Error in onError hook');
        }
      }

      // Convert to response
      const errorResponse = appError.toResponse();

      // Add request ID to error response
      if (includeRequestId) {
        errorResponse.headers.set('X-Request-ID', requestId);

        // Also include in response body metadata
        try {
          const body = await errorResponse.json();
          return NextResponse.json(
            {
              ...body,
              metadata: {
                ...body.metadata,
                requestId,
              },
            },
            {
              status: errorResponse.status,
              headers: errorResponse.headers,
            }
          );
        } catch {
          // If we can't parse response, return as-is
          return errorResponse;
        }
      }

      return errorResponse;
    }
  };
}

/**
 * Creates a specialized error handler for specific error types
 * Useful when you want custom handling for certain errors
 *
 * @example
 * const handleAuthErrors = createErrorHandler({
 *   transformError: (error) => {
 *     if (error instanceof AuthenticationError) {
 *       // Custom auth error handling
 *       return new AuthenticationError('Custom auth message');
 *     }
 *     return normalizeError(error);
 *   }
 * });
 *
 * export const GET = handleAuthErrors(async (request) => {
 *   // Your handler code
 * });
 */
export function createErrorHandler(options: ErrorHandlerOptions) {
  return <T = unknown>(handler: ApiRouteHandler<T>): ApiRouteHandler<T> => {
    return withErrorHandler(handler, options);
  };
}

/**
 * Validation error handler - specialized for request validation
 * Automatically handles Zod validation errors and returns 422 responses
 *
 * @example
 * export const POST = withValidationHandler(async (request) => {
 *   const body = await request.json();
 *   const validated = schema.parse(body); // Throws ZodError on failure
 *   return responses.success(validated);
 * });
 */
export function withValidationHandler<T = unknown>(
  handler: ApiRouteHandler<T>,
  options: Omit<ErrorHandlerOptions, 'transformError'> = {}
): ApiRouteHandler<T> {
  return withErrorHandler(handler, {
    ...options,
    transformError: (error) => {
      if (error instanceof ZodError) {
        return handleZodError(error);
      }
      if (error instanceof AppError) {
        return error;
      }
      return normalizeError(error);
    },
  });
}

/**
 * Database error handler - specialized for database operations
 * Automatically handles Prisma errors and converts them to appropriate AppErrors
 *
 * @example
 * export const GET = withDatabaseHandler(async (request) => {
 *   const users = await prisma.user.findMany();
 *   return responses.success(users);
 * });
 */
export function withDatabaseHandler<T = unknown>(
  handler: ApiRouteHandler<T>,
  options: Omit<ErrorHandlerOptions, 'transformError'> = {}
): ApiRouteHandler<T> {
  return withErrorHandler(handler, {
    ...options,
    transformError: (error) => {
      if (isPrismaError(error)) {
        return mapPrismaError(error);
      }
      if (error instanceof AppError) {
        return error;
      }
      return normalizeError(error);
    },
  });
}

/**
 * Combines multiple error handlers
 * Applies transformations in order until one succeeds
 *
 * @example
 * export const POST = composeErrorHandlers(
 *   withValidationHandler,
 *   withDatabaseHandler
 * )(async (request) => {
 *   // Handler code
 * });
 */
export function composeErrorHandlers(
  ...handlers: Array<(handler: ApiRouteHandler) => ApiRouteHandler>
) {
  return <T = unknown>(handler: ApiRouteHandler<T>): ApiRouteHandler<T> => {
    return handlers.reduceRight(
      (wrappedHandler, middleware) => middleware(wrappedHandler),
      handler
    );
  };
}

/**
 * Error boundary for async operations within handlers
 * Catches errors in async operations and converts them to AppErrors
 *
 * @example
 * export const GET = withErrorHandler(async (request) => {
 *   const data = await errorBoundary(
 *     async () => await riskyOperation(),
 *     (error) => new ValidationError('Operation failed')
 *   );
 *   return responses.success(data);
 * });
 */
export async function errorBoundary<T>(
  operation: () => Promise<T>,
  errorHandler: (error: unknown) => AppError = normalizeError
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw errorHandler(error);
  }
}

/**
 * Middleware for catching all errors at the route level
 * This can be used in Next.js middleware or route handlers
 *
 * @example
 * // middleware.ts
 * export function middleware(request: NextRequest) {
 *   return catchAllErrors(async () => {
 *     // Your middleware logic
 *     return NextResponse.next();
 *   }, request);
 * }
 */
export async function catchAllErrors(
  handler: () => Promise<NextResponse>,
  request: NextRequest,
  options: ErrorHandlerOptions = {}
): Promise<NextResponse> {
  const wrappedHandler: ApiRouteHandler = async () => handler();
  return withErrorHandler(wrappedHandler, options)(request);
}
