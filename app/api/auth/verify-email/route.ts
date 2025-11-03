import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { success, badRequest, unauthorized, internalServerError, error as errorResponse } from '@/lib/api/responses';
import { verifyEmailToken, markEmailAsVerified } from '@/lib/auth/email-verification';
import { normalizeEmail } from '@/lib/utils/email';
import { emailVerificationLimiter } from '@/lib/middleware/rate-limit';
import { z } from 'zod';

const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  email: z.string().email('Invalid email address'),
});

/**
 * GET verify email from query parameters (for email link clicks)
 * POST verify email from request body (for API calls)
 */
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting to prevent brute force attacks
    const identifier =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'anonymous';

    if (!emailVerificationLimiter.isAllowed(identifier)) {
      const resetTime = emailVerificationLimiter.getResetTime(identifier);
      return errorResponse('Too many verification attempts. Please try again later.', {
        status: 429,
        headers: {
          'Retry-After': resetTime
            ? Math.ceil((resetTime.getTime() - Date.now()) / 1000).toString()
            : '900',
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': emailVerificationLimiter.getRemainingAttempts(identifier).toString(),
          'X-RateLimit-Reset': resetTime?.toISOString() || '',
        },
      });
    }

    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token || !email) {
      return badRequest('Token and email are required');
    }

    const normalizedEmail = normalizeEmail(email);

    // Verify token
    const isValid = await verifyEmailToken(normalizedEmail, token);
    if (!isValid) {
      return badRequest('Invalid or expired verification token');
    }

    // Mark email as verified
    await markEmailAsVerified(normalizedEmail);

    logger.info({ email: normalizedEmail }, 'Email verified via GET');

    // Redirect to success page or return JSON
    const acceptsHtml = request.headers.get('accept')?.includes('text/html');
    if (acceptsHtml) {
      return Response.redirect(new URL('/?verified=true', request.url));
    }

    return success({ message: 'Email verified successfully' });
  } catch (error) {
    logger.error({ err: error }, 'Failed to verify email');
    return internalServerError('Failed to verify email');
  }
}

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting to prevent brute force attacks
    const identifier =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'anonymous';

    if (!emailVerificationLimiter.isAllowed(identifier)) {
      const resetTime = emailVerificationLimiter.getResetTime(identifier);
      return errorResponse('Too many verification attempts. Please try again later.', {
        status: 429,
        headers: {
          'Retry-After': resetTime
            ? Math.ceil((resetTime.getTime() - Date.now()) / 1000).toString()
            : '900',
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': emailVerificationLimiter.getRemainingAttempts(identifier).toString(),
          'X-RateLimit-Reset': resetTime?.toISOString() || '',
        },
      });
    }

    const body = await request.json();
    const { token, email } = verifyEmailSchema.parse(body);

    const normalizedEmail = normalizeEmail(email);

    // Verify token
    const isValid = await verifyEmailToken(normalizedEmail, token);
    if (!isValid) {
      return badRequest('Invalid or expired verification token');
    }

    // Mark email as verified
    await markEmailAsVerified(normalizedEmail);

    logger.info({ email: normalizedEmail }, 'Email verified via POST');

    return success({ message: 'Email verified successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequest('Invalid request data', {
        details: error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', '),
      });
    }

    logger.error({ err: error }, 'Failed to verify email');
    return internalServerError('Failed to verify email');
  }
}

