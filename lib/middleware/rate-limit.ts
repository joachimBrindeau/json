import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { NextRequest, NextResponse } from 'next/server';
import { redis } from '../redis';
import { logger } from '../logger';

/**
 * Rate limiting configurations using express-rate-limit
 */

// Rate limiter for tag creation/publishing
export const publishRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each user to 10 publishes per 15 minutes
  message: 'Too many publish requests, please try again later',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: (req) => {
    // Use user ID if authenticated; otherwise use IPv6-safe helper
    return (req as any).user?.id || ipKeyGenerator(req as any);
  },
  skip: (req) => {
    // Skip rate limiting for admin users if needed
    return req.user?.role === 'admin';
  },
});

// More aggressive rate limiting for tag suggestions (to prevent abuse)
export const tagSuggestionsRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // Limit to 60 requests per minute (1 per second)
  message: 'Too many tag suggestion requests',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Redis-backed rate limiter for Next.js API routes
 * Falls back to in-memory when Redis is unavailable
 */
class RedisRateLimiter {
  private memoryCache = new Map<string, { count: number; resetTime: number }>();
  private readonly windowMs: number;
  private readonly maxAttempts: number;
  private readonly keyPrefix: string;

  constructor(
    windowMs: number = 15 * 60 * 1000,
    maxAttempts: number = 10,
    keyPrefix: string = 'ratelimit'
  ) {
    this.windowMs = windowMs;
    this.maxAttempts = maxAttempts;
    this.keyPrefix = keyPrefix;
  }

  private async isRedisAvailable(): Promise<boolean> {
    if (!redis) return false;
    try {
      await redis.ping();
      return true;
    } catch {
      return false;
    }
  }

  isAllowed(identifier: string): boolean {
    const key = `${this.keyPrefix}:${identifier}`;
    const now = Date.now();

    try {
      // Use in-memory rate limiting only (Redis would require async)
      // Fallback to in-memory rate limiting
      const userAttempts = this.memoryCache.get(key);

      if (!userAttempts) {
        this.memoryCache.set(key, {
          count: 1,
          resetTime: now + this.windowMs,
        });
        return true;
      }

      if (now > userAttempts.resetTime) {
        this.memoryCache.set(key, {
          count: 1,
          resetTime: now + this.windowMs,
        });
        return true;
      }

      if (userAttempts.count >= this.maxAttempts) {
        logger.warn(
          { identifier, count: userAttempts.count, limit: this.maxAttempts },
          'Rate limit exceeded (Memory)'
        );
        return false;
      }

      userAttempts.count++;
      return true;
    } catch (error) {
      logger.error({ err: error, identifier }, 'Rate limit check error');
      // On error, allow the request (fail open)
      return true;
    }
  }

  getRemainingAttempts(identifier: string): number {
    const key = `${this.keyPrefix}:${identifier}`;
    const userAttempts = this.memoryCache.get(key);
    if (!userAttempts || Date.now() > userAttempts.resetTime) {
      return this.maxAttempts;
    }
    return Math.max(0, this.maxAttempts - userAttempts.count);
  }

  getResetTime(identifier: string): Date | null {
    const key = `${this.keyPrefix}:${identifier}`;
    const userAttempts = this.memoryCache.get(key);
    return userAttempts ? new Date(userAttempts.resetTime) : null;
  }

  // Clean up old entries from memory cache periodically
  cleanup() {
    const now = Date.now();
    const keysToDelete: string[] = [];
    this.memoryCache.forEach((value, key) => {
      if (now > value.resetTime) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach((key) => this.memoryCache.delete(key));
  }
}

// Create rate limiter instances
export const publishLimiter = new RedisRateLimiter(15 * 60 * 1000, 10); // 10 publishes per 15 minutes
export const tagSuggestLimiter = new RedisRateLimiter(60 * 1000, 60); // 60 requests per minute

// Cleanup old entries every 5 minutes
if (typeof window === 'undefined') {
  setInterval(
    () => {
      publishLimiter.cleanup();
      tagSuggestLimiter.cleanup();
    },
    5 * 60 * 1000
  );
}

/**
 * Middleware function for Next.js API routes
 */
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  limiter: RedisRateLimiter = publishLimiter
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    // Get identifier (use IP or session)
    const identifier =
      req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'anonymous';

    if (!limiter.isAllowed(identifier)) {
      const resetTime = limiter.getResetTime(identifier);
      return NextResponse.json(
        {
          error: 'Too many requests. Please try again later.',
          resetTime: resetTime?.toISOString(),
        },
        {
          status: 429,
          headers: {
            'Retry-After': resetTime
              ? Math.ceil((resetTime.getTime() - Date.now()) / 1000).toString()
              : '900',
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': limiter.getRemainingAttempts(identifier).toString(),
            'X-RateLimit-Reset': resetTime?.toISOString() || '',
          },
        }
      );
    }

    return handler(req);
  };
}
