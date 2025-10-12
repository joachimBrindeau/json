import rateLimit from 'express-rate-limit';
import { NextRequest, NextResponse } from 'next/server';

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
    // Use user ID if authenticated, otherwise use IP
    return req.user?.id || req.ip || 'anonymous';
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
 * Simple in-memory rate limiter for Next.js API routes
 * Since express-rate-limit doesn't work directly with Next.js
 */
class SimpleRateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map();
  private readonly windowMs: number;
  private readonly maxAttempts: number;

  constructor(windowMs: number = 15 * 60 * 1000, maxAttempts: number = 10) {
    this.windowMs = windowMs;
    this.maxAttempts = maxAttempts;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const userAttempts = this.attempts.get(identifier);

    if (!userAttempts) {
      // First attempt
      this.attempts.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return true;
    }

    // Check if window has expired
    if (now > userAttempts.resetTime) {
      // Reset the window
      this.attempts.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return true;
    }

    // Within the window
    if (userAttempts.count >= this.maxAttempts) {
      return false;
    }

    // Increment count
    userAttempts.count++;
    return true;
  }

  getRemainingAttempts(identifier: string): number {
    const userAttempts = this.attempts.get(identifier);
    if (!userAttempts) return this.maxAttempts;

    const now = Date.now();
    if (now > userAttempts.resetTime) {
      return this.maxAttempts;
    }

    return Math.max(0, this.maxAttempts - userAttempts.count);
  }

  getResetTime(identifier: string): Date | null {
    const userAttempts = this.attempts.get(identifier);
    if (!userAttempts) return null;

    return new Date(userAttempts.resetTime);
  }

  // Clean up old entries periodically
  cleanup() {
    const now = Date.now();
    for (const [key, value] of this.attempts.entries()) {
      if (now > value.resetTime) {
        this.attempts.delete(key);
      }
    }
  }
}

// Create rate limiter instances
export const publishLimiter = new SimpleRateLimiter(15 * 60 * 1000, 10); // 10 publishes per 15 minutes
export const tagSuggestLimiter = new SimpleRateLimiter(60 * 1000, 60); // 60 requests per minute

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
  limiter: SimpleRateLimiter = publishLimiter
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
