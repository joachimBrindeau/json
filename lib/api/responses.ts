import { NextResponse } from 'next/server';

/**
 * Standard API response interfaces
 */

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: string;
  timestamp: string;
  code?: string;
  metadata?: Record<string, unknown>;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Pagination response interface
 */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Stream response interface
 */
export interface StreamResponse {
  stream: boolean;
  contentType: string;
  headers?: Record<string, string>;
}

/**
 * File download response interface
 */
export interface DownloadResponse {
  filename: string;
  contentType: string;
  size?: number;
  headers?: Record<string, string>;
}

/**
 * Success response builders
 */

/**
 * Creates a successful API response
 */
export function success<T>(
  data: T,
  options: {
    message?: string;
    status?: number;
    headers?: Record<string, string>;
    metadata?: Record<string, unknown>;
  } = {}
): NextResponse {
  const { message, status = 200, headers = {}, metadata } = options;

  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
    ...(message && { message }),
    ...(metadata && { metadata }),
  };

  return NextResponse.json(response, {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

/**
 * Creates a successful response for resource creation
 */
export function created<T>(
  data: T,
  options: {
    location?: string;
    message?: string;
    headers?: Record<string, string>;
    metadata?: Record<string, unknown>;
  } = {}
): NextResponse {
  const { location, message = 'Resource created successfully', headers = {}, metadata } = options;

  return success(data, {
    message,
    status: 201,
    headers: {
      ...(location && { Location: location }),
      ...headers,
    },
    metadata,
  });
}

/**
 * Creates a successful response with no content
 */
export function noContent(
  options: {
    headers?: Record<string, string>;
  } = {}
): NextResponse {
  const { headers = {} } = options;

  return new NextResponse(null, {
    status: 204,
    headers,
  });
}

/**
 * Creates a successful response indicating resource was accepted for processing
 */
export function accepted<T>(
  data?: T,
  options: {
    message?: string;
    headers?: Record<string, string>;
    metadata?: Record<string, unknown>;
  } = {}
): NextResponse {
  const { message = 'Request accepted for processing', headers = {}, metadata } = options;

  return success(data, {
    message,
    status: 202,
    headers,
    metadata,
  });
}

/**
 * Error response builders
 */

/**
 * Creates an error API response
 */
export function error(
  message: string,
  options: {
    details?: string;
    status?: number;
    code?: string;
    headers?: Record<string, string>;
    metadata?: Record<string, unknown>;
  } = {}
): NextResponse {
  const { details, status = 500, code, headers = {}, metadata } = options;

  const response: ApiErrorResponse = {
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
    ...(details && { details }),
    ...(code && { code }),
    ...(metadata && { metadata }),
  };

  return NextResponse.json(response, {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

/**
 * Common error response options interface
 */
interface ErrorOptions {
  details?: string;
  code?: string;
  headers?: Record<string, string>;
  metadata?: Record<string, unknown>;
}

/**
 * Creates a 400 Bad Request error response
 */
export function badRequest(
  message: string = 'Bad request',
  options: ErrorOptions = {}
): NextResponse {
  return error(message, { ...options, status: 400 });
}

/**
 * Creates a 401 Unauthorized error response
 */
export function unauthorized(
  message: string = 'Authentication required',
  options: ErrorOptions = {}
): NextResponse {
  return error(message, {
    ...options,
    status: 401,
    headers: { 'WWW-Authenticate': 'Bearer', ...options.headers },
  });
}

/**
 * Creates a 403 Forbidden error response
 */
export function forbidden(
  message: string = 'Access denied',
  options: ErrorOptions = {}
): NextResponse {
  return error(message, { ...options, status: 403 });
}

/**
 * Creates a 404 Not Found error response
 */
export function notFound(
  message: string = 'Resource not found',
  options: ErrorOptions = {}
): NextResponse {
  return error(message, { ...options, status: 404 });
}

/**
 * Creates a 409 Conflict error response
 */
export function conflict(
  message: string = 'Resource already exists',
  options: ErrorOptions = {}
): NextResponse {
  return error(message, { ...options, status: 409 });
}

/**
 * Creates a 422 Unprocessable Entity error response (validation errors)
 */
export function unprocessableEntity(
  message: string = 'Validation failed',
  options: ErrorOptions = {}
): NextResponse {
  return error(message, { ...options, status: 422 });
}

/**
 * Creates a 429 Too Many Requests error response
 */
export function tooManyRequests(
  message: string = 'Too many requests',
  options: {
    details?: string;
    code?: string;
    headers?: Record<string, string>;
    retryAfter?: number;
    metadata?: Record<string, unknown>;
  } = {}
): NextResponse {
  const { retryAfter, ...errorOptions } = options;

  return error(message, {
    ...errorOptions,
    status: 429,
    headers: {
      ...(retryAfter && { 'Retry-After': retryAfter.toString() }),
      ...errorOptions.headers,
    },
  });
}

/**
 * Creates a 500 Internal Server Error response
 */
export function internalServerError(
  message: string = 'Internal server error',
  options: ErrorOptions = {}
): NextResponse {
  return error(message, { ...options, status: 500 });
}

/**
 * Creates a 503 Service Unavailable error response
 */
export function serviceUnavailable(
  message: string = 'Service temporarily unavailable',
  options: {
    details?: string;
    code?: string;
    headers?: Record<string, string>;
    retryAfter?: number;
    metadata?: Record<string, unknown>;
  } = {}
): NextResponse {
  const { retryAfter, ...errorOptions } = options;

  return error(message, {
    ...errorOptions,
    status: 503,
    headers: {
      ...(retryAfter && { 'Retry-After': retryAfter.toString() }),
      ...errorOptions.headers,
    },
  });
}

/**
 * Pagination response builders
 */

/**
 * Creates a paginated response
 */
export function paginated<T>(
  items: T[],
  paginationInfo: {
    page: number;
    limit: number;
    total: number;
  },
  options: {
    message?: string;
    status?: number;
    headers?: Record<string, string>;
    metadata?: Record<string, unknown>;
  } = {}
): NextResponse {
  const { page, limit, total } = paginationInfo;
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  const response: PaginatedResponse<T> = {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext,
      hasPrev,
    },
  };

  return success(response, options);
}

/**
 * Stream response helpers
 */

/**
 * Creates a streaming response
 */
export function stream(
  readable: ReadableStream,
  options: {
    contentType?: string;
    filename?: string;
    headers?: Record<string, string>;
  } = {}
): NextResponse {
  const { contentType = 'application/json', filename, headers = {} } = options;

  const responseHeaders: Record<string, string> = {
    'Content-Type': contentType,
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    ...headers,
  };

  if (filename) {
    responseHeaders['Content-Disposition'] = `attachment; filename="${filename}"`;
  }

  return new NextResponse(readable, {
    status: 200,
    headers: responseHeaders,
  });
}

/**
 * Creates a JSON streaming response
 */
export function jsonStream(
  data: unknown,
  options: {
    filename?: string;
    headers?: Record<string, string>;
  } = {}
): NextResponse {
  const readableStream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      try {
        const jsonString = JSON.stringify(data, null, 2);
        const chunks = [];

        // Split into manageable chunks
        const chunkSize = 64 * 1024; // 64KB chunks
        for (let i = 0; i < jsonString.length; i += chunkSize) {
          chunks.push(jsonString.slice(i, i + chunkSize));
        }

        // Send chunks
        chunks.forEach((chunk) => {
          controller.enqueue(encoder.encode(chunk));
        });

        controller.close();
      } catch (streamError) {
        controller.error(streamError);
      }
    },
  });

  return stream(readableStream, {
    contentType: 'application/json',
    ...options,
  });
}

/**
 * Creates a file download response
 */
export function download(
  data: string | Buffer,
  options: {
    filename: string;
    contentType?: string;
    headers?: Record<string, string>;
  }
): NextResponse {
  const { filename, contentType = 'application/octet-stream', headers = {} } = options;

  const responseHeaders: Record<string, string> = {
    'Content-Type': contentType,
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Cache-Control': 'no-cache',
    ...headers,
  };

  // Add content length if possible
  if (typeof data === 'string') {
    responseHeaders['Content-Length'] = new TextEncoder().encode(data).length.toString();
  } else if (data instanceof Buffer) {
    responseHeaders['Content-Length'] = data.length.toString();
  }

  return new NextResponse(data as BodyInit, {
    status: 200,
    headers: responseHeaders,
  });
}

/**
 * Server-Sent Events helpers
 */

/**
 * Creates a Server-Sent Events response
 */
export function serverSentEvents(
  options: {
    headers?: Record<string, string>;
  } = {}
): NextResponse {
  const { headers = {} } = options;

  const responseHeaders = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
    ...headers,
  };

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection event
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode('data: {"type":"connected"}\n\n'));
    },
  });

  return new NextResponse(stream, {
    status: 200,
    headers: responseHeaders,
  });
}

/**
 * Utility functions
 */

/**
 * Formats SSE data
 */
export function formatSSEData(data: unknown, event?: string): string {
  const encoder = new TextEncoder();
  let formatted = '';

  if (event) {
    formatted += `event: ${event}\n`;
  }

  formatted += `data: ${JSON.stringify(data)}\n\n`;
  return formatted;
}

/**
 * CORS helpers
 */

/**
 * Creates a CORS preflight response
 */
export function corsOptions(
  options: {
    origin?: string | string[];
    methods?: string[];
    headers?: string[];
    credentials?: boolean;
    maxAge?: number;
  } = {}
): NextResponse {
  const {
    origin = '*',
    methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    headers = ['Content-Type', 'Authorization'],
    credentials = false,
    maxAge = 86400, // 24 hours
  } = options;

  const responseHeaders: Record<string, string> = {
    'Access-Control-Allow-Origin': Array.isArray(origin) ? origin.join(', ') : origin,
    'Access-Control-Allow-Methods': methods.join(', '),
    'Access-Control-Allow-Headers': headers.join(', '),
    'Access-Control-Allow-Credentials': credentials.toString(),
    'Access-Control-Max-Age': maxAge.toString(),
  };

  return new NextResponse(null, {
    status: 200,
    headers: responseHeaders,
  });
}

/**
 * Health check response
 */
export function healthCheck(
  status: 'healthy' | 'degraded' | 'unhealthy',
  services: Record<string, 'up' | 'down'>,
  options: {
    version?: string;
    metadata?: Record<string, unknown>;
  } = {}
): NextResponse {
  const { version = '1.0.0', metadata } = options;

  const healthData = {
    status,
    timestamp: new Date().toISOString(),
    version,
    services,
    ...(metadata && { metadata }),
  };

  const httpStatus = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503;

  return success(healthData, { status: httpStatus });
}

/**
 * Response middleware for adding common headers
 */
export function withCommonHeaders(
  response: NextResponse,
  options: {
    cacheControl?: string;
    securityHeaders?: boolean;
  } = {}
): NextResponse {
  const { cacheControl, securityHeaders = true } = options;

  // Add caching headers
  if (cacheControl) {
    response.headers.set('Cache-Control', cacheControl);
  }

  // Add security headers
  if (securityHeaders) {
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
  }

  // Add request ID for tracing
  response.headers.set('X-Request-ID', crypto.randomUUID());

  return response;
}
