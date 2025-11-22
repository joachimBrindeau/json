import { NextRequest, NextResponse } from 'next/server';
import { getServerSession, Session } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AUTH_ERROR_MESSAGES } from '@/lib/auth/constants';
import { ZodSchema, ZodError } from 'zod';
import { createHash } from 'crypto';
import { logger } from '@/lib/logger';
// Simple rate limiter interface (compatible with the one in middleware/rate-limit.ts)
interface RateLimiter {
  isAllowed(identifier: string): boolean;
  getRemainingAttempts(identifier: string): number;
  getResetTime(identifier: string): Date | null;
  maxAttempts?: number;
}

/**
 * Standard API error types for consistent error handling
 */
export interface ApiError {
  code: string;
  message: string;
  details?: string;
  statusCode: number;
}

/**
 * API response wrapper interface
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string;
  timestamp?: string;
}

/**
 * Pagination parameters interface
 */
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

/**
 * Request validation result interface
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: ZodError;
}

/**
 * Higher-order function that wraps API route handlers with authentication
 * Ensures the user is authenticated before processing the request
 *
 * @param handler - The API route handler function
 * @returns Wrapped handler with authentication check
 *
 * @example
 * export const GET = withAuth(async (req, session) => {
 *   // session is guaranteed to exist here
 *   return createApiResponse({ userId: session.user.id });
 * });
 */
export function withAuth<T extends any[]>(
  handler: (req: NextRequest, session: Session, ...args: T) => Promise<NextResponse | Response>
) {
  return async (req: NextRequest, ...args: T): Promise<NextResponse | Response> => {
    try {
      const session = await getServerSession(authOptions);

      if (!session?.user?.id) {
        return createApiResponse({ error: AUTH_ERROR_MESSAGES.SESSION_REQUIRED }, { status: 401 });
      }

      return await handler(req, session as Session, ...args);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

/**
 * Higher-order function that wraps API route handlers with optional authentication
 * Allows anonymous access but provides session if available
 */
export function withOptionalAuth<T extends any[]>(
  handler: (req: NextRequest, session: Session | null, ...args: T) => Promise<NextResponse | Response>
) {
  return async (req: NextRequest, ...args: T): Promise<NextResponse | Response> => {
    try {
      const session = await getServerSession(authOptions);
      return await handler(req, session as Session | null, ...args);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

/**
 * Centralized error handler for API routes
 * Provides consistent error responses and logging
 */
export function handleApiError(error: unknown, context?: string): NextResponse {
  logger.error({ err: error, context }, `API Error${context ? ` in ${context}` : ''}`);

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return createApiResponse(
      {
        error: 'Validation failed',
        details: error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      },
      { status: 400 }
    );
  }

  // Handle Prisma errors
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as { code: string; message: string };

    switch (prismaError.code) {
      case 'P2002':
        return createApiResponse({ error: 'Resource already exists' }, { status: 409 });
      case 'P2025':
        return createApiResponse({ error: 'Resource not found' }, { status: 404 });
      case 'P1001':
        return createApiResponse({ error: 'Database connection failed' }, { status: 503 });
      case 'P2024':
        return createApiResponse({ error: 'Request timeout' }, { status: 408 });
    }
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    if (error.message.includes('timeout')) {
      return createApiResponse({ error: 'Request timeout' }, { status: 408 });
    }

    if (error.message.includes('not found')) {
      return createApiResponse({ error: 'Resource not found' }, { status: 404 });
    }
  }

  // Default server error
  return createApiResponse(
    {
      error: 'Internal server error',
      details:
        process.env.NODE_ENV === 'development'
          ? error instanceof Error
            ? error.message
            : String(error)
          : undefined,
    },
    { status: 500 }
  );
}

/**
 * Validates request data against a Zod schema
 * Returns typed data or validation errors
 */
export async function validateRequest<T>(
  req: NextRequest,
  schema: ZodSchema<T>,
  source: 'body' | 'query' | 'params' = 'body'
): Promise<ValidationResult<T>> {
  try {
    let data: unknown;

    switch (source) {
      case 'body':
        const contentType = req.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          data = await req.json();
        } else if (contentType?.includes('application/x-www-form-urlencoded')) {
          const formData = await req.formData();
          data = Object.fromEntries(formData.entries());
        } else {
          data = await req.text();
        }
        break;
      case 'query':
        const url = new URL(req.url);
        data = Object.fromEntries(url.searchParams.entries());
        break;
      case 'params':
        // This would typically be handled by Next.js route params
        throw new Error('Params validation should be handled in route handler');
    }

    const result = schema.safeParse(data);

    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    return {
      success: false,
      error: new ZodError([
        {
          code: 'custom',
          message: error instanceof Error ? error.message : 'Validation failed',
          path: [],
        },
      ]),
    };
  }
}

/**
 * Creates a standardized API response
 * Ensures consistent response format across all endpoints
 */
export function createApiResponse<T>(
  data: ApiResponse<T> | { error: string; details?: string },
  options: {
    status?: number;
    headers?: Record<string, string>;
  } = {}
): NextResponse {
  const response: ApiResponse<T> = {
    success: !('error' in data),
    timestamp: new Date().toISOString(),
    ...data,
  };

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  return NextResponse.json(response, {
    status: options.status || 200,
    headers,
  });
}

/**
 * Rate limiting middleware wrapper
 * Applies rate limiting to API endpoints
 */
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  limiter: RateLimiter,
  options: {
    keyGenerator?: (req: NextRequest) => string;
    skipCondition?: (req: NextRequest) => boolean;
  } = {}
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const { keyGenerator = defaultKeyGenerator, skipCondition = () => false } = options;

    if (skipCondition(req)) {
      return handler(req);
    }

    const identifier = keyGenerator(req);

    if (!limiter.isAllowed(identifier)) {
      const resetTime = limiter.getResetTime(identifier);
      return createApiResponse(
        {
          error: 'Too many requests. Please try again later.',
          details: resetTime ? `Try again at ${resetTime.toISOString()}` : undefined,
        },
        {
          status: 429,
          headers: {
            'Retry-After': resetTime
              ? Math.ceil((resetTime.getTime() - Date.now()) / 1000).toString()
              : '900',
            'X-RateLimit-Limit': limiter.maxAttempts?.toString() || '10',
            'X-RateLimit-Remaining': limiter.getRemainingAttempts(identifier).toString(),
            'X-RateLimit-Reset': resetTime?.toISOString() || '',
          },
        }
      );
    }

    return handler(req);
  };
}

/**
 * Default key generator for rate limiting
 * Uses IP address or session ID as identifier
 */
function defaultKeyGenerator(req: NextRequest): string {
  // Try to get user ID from session first (would need to be passed in real implementation)
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || 'anonymous';

  // Hash the IP for privacy
  return createHash('sha256').update(ip).digest('hex');
}

/**
 * CORS handling utility
 * Provides consistent CORS headers across endpoints
 */
export function withCors(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: {
    origin?: string | string[];
    methods?: string[];
    headers?: string[];
    credentials?: boolean;
  } = {}
) {
  const {
    origin = '*',
    methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    headers = ['Content-Type', 'Authorization'],
    credentials = false,
  } = options;

  return async (req: NextRequest): Promise<NextResponse> => {
    // Handle preflight OPTIONS requests
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: getCorsHeaders(origin, methods, headers, credentials),
      });
    }

    const response = await handler(req);

    // Add CORS headers to the response
    const corsHeaders = getCorsHeaders(origin, methods, headers, credentials);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  };
}

/**
 * Generates CORS headers
 */
function getCorsHeaders(
  origin: string | string[],
  methods: string[],
  headers: string[],
  credentials: boolean
): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': Array.isArray(origin) ? origin.join(', ') : origin,
    'Access-Control-Allow-Methods': methods.join(', '),
    'Access-Control-Allow-Headers': headers.join(', '),
    'Access-Control-Allow-Credentials': credentials.toString(),
    'Access-Control-Max-Age': '86400', // 24 hours
  };
}

/**
 * Validates and parses pagination parameters from query string
 */
export function parsePaginationParams(
  searchParams: URLSearchParams,
  defaults: { page?: number; limit?: number; maxLimit?: number } = {}
): PaginationParams | { error: string; status: number } {
  const { page: defaultPage = 1, limit: defaultLimit = 20, maxLimit = 100 } = defaults;

  const pageParam = searchParams.get('page');
  const limitParam = searchParams.get('limit');

  let page = defaultPage;
  let limit = defaultLimit;

  // Validate page parameter
  if (pageParam) {
    const parsedPage = parseInt(pageParam);
    if (isNaN(parsedPage) || parsedPage < 1) {
      return {
        error: 'Invalid page parameter. Must be a positive integer.',
        status: 400,
      };
    }
    page = parsedPage;
  }

  // Validate limit parameter
  if (limitParam) {
    const parsedLimit = parseInt(limitParam);
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > maxLimit) {
      return {
        error: `Invalid limit parameter. Must be between 1 and ${maxLimit}.`,
        status: 400,
      };
    }
    limit = parsedLimit;
  }

  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/**
 * Sanitizes string input to prevent XSS and injection attacks
 */
export function sanitizeString(input: unknown): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    .replace(/[<>'"&]/g, '') // Remove potentially dangerous characters
    .substring(0, 1000); // Limit length
}

/**
 * Validates sort parameter against allowed values
 */
export function validateSortParam(
  sortParam: string | null,
  allowedSorts: readonly string[],
  defaultSort: string = allowedSorts[0]
): string | { error: string; status: number } {
  if (!sortParam) {
    return defaultSort;
  }

  if (!allowedSorts.includes(sortParam)) {
    return {
      error: `Invalid sort parameter. Must be one of: ${allowedSorts.join(', ')}`,
      status: 400,
    };
  }

  return sortParam;
}

/**
 * Extracts client IP address from request headers
 */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const remoteAddress = req.headers.get('remote-addr');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  return realIp || remoteAddress || 'unknown';
}

/**
 * Creates a hashed version of sensitive data for logging/analytics
 */
export function hashSensitiveData(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Middleware composition utility
 * Allows chaining multiple middleware functions
 */
export function composeMiddleware(
  ...middlewares: Array<
    (
      handler: (req: NextRequest) => Promise<NextResponse>
    ) => (req: NextRequest) => Promise<NextResponse>
  >
) {
  return (handler: (req: NextRequest) => Promise<NextResponse>) => {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler);
  };
}

/**
 * Validates search parameter length
 */
export function validateSearchParam(search: string | null, maxLength: number = 100): string | null {
  if (search && search.length > maxLength) {
    throw new Error(`Search query too long. Maximum ${maxLength} characters.`);
  }
  return search?.trim() || null;
}

/**
 * Validates pagination parameters (legacy compatibility wrapper)
 * @deprecated Use parsePaginationParams instead
 */
export function validatePaginationParams(searchParams: URLSearchParams) {
  const result = parsePaginationParams(searchParams);
  if ('error' in result) {
    throw new Error(result.error);
  }
  return { page: result.page, limit: result.limit };
}

/**
 * JSON validation and analysis utility
 * Validates JSON content and calculates statistics
 */
export function validateAndAnalyzeJson(content: any) {
  // Validate JSON content
  let parsedContent;
  try {
    parsedContent = typeof content === 'string' ? JSON.parse(content) : content;
  } catch {
    throw new Error('Invalid JSON content');
  }

  // Calculate new stats - server-side version
  const contentString = typeof content === 'string' ? content : JSON.stringify(content);
  const size = new TextEncoder().encode(contentString).length;

  const analyzeJsonServer = (obj: unknown): { nodeCount: number; maxDepth: number } => {
    let nodeCount = 0;
    let maxDepth = 0;

    const traverse = (value: unknown, depth: number) => {
      nodeCount++;
      maxDepth = Math.max(maxDepth, depth);

      if (Array.isArray(value)) {
        value.forEach((item) => traverse(item, depth + 1));
      } else if (value !== null && typeof value === 'object') {
        Object.values(value).forEach((item) => traverse(item, depth + 1));
      }
    };

    traverse(obj, 0);
    return { nodeCount, maxDepth };
  };

  const { nodeCount, maxDepth } = analyzeJsonServer(parsedContent);
  const complexity = nodeCount > 1000 ? 'High' : nodeCount > 100 ? 'Medium' : 'Low';

  return {
    parsedContent,
    stats: {
      size,
      nodeCount,
      maxDepth,
      complexity,
    },
  };
}

/**
 * Formats a single document for API response
 */
export function formatDocumentResponse(document: any) {
  return {
    success: true,
    document: {
      id: document.id,
      shareId: document.shareId,
      title: document.title,
      description: document.description,
      content: document.content,
      tags: document.tags,
      category: document.category,
      viewCount: document.viewCount,
      size: Number(document.size),
      nodeCount: document.nodeCount,
      maxDepth: document.maxDepth,
      complexity: document.complexity,
      visibility: document.visibility,
      publishedAt: document.publishedAt,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      user: document.user,
    },
  };
}

/**
 * Formats a list of documents for API response
 */
export function formatDocumentListResponse(documents: any[], isPublic: boolean = false) {
  return documents.map((doc) => {
    const formatted: any = {
      id: isPublic ? doc.shareId : doc.id,
      shareId: doc.shareId,
      title: doc.title || 'Untitled',
      description: doc.description,
      richContent: doc.richContent,
      tags: doc.tags,
      category: doc.category,
      viewCount: doc.viewCount,
      size: Number(doc.size),
      nodeCount: doc.nodeCount,
      maxDepth: doc.maxDepth,
      complexity: doc.complexity,
      visibility: doc.visibility,
      publishedAt: doc.publishedAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };

    // Add author info for public library
    if (isPublic && doc.user) {
      formatted.author = doc.user;
      // Add preview for public library
      if (doc.content) {
        formatted.preview = JSON.stringify(doc.content, null, 2).slice(0, 200) + '...';
      }
    }

    return formatted;
  });
}
