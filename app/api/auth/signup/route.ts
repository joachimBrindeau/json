import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { created, error as errorResponse } from '@/lib/api/responses';
import { withValidationHandler } from '@/lib/api/middleware';
import { ConflictError } from '@/lib/utils/app-errors';
import { hashPassword, validatePasswordStrength } from '@/lib/auth/password';
import { PASSWORD_REQUIREMENTS } from '@/lib/auth/constants';
import { normalizeEmail } from '@/lib/utils/email';
import { ValidationError } from '@/lib/utils/app-errors';
import { signupLimiter } from '@/lib/middleware/rate-limit';
import { sendVerificationEmail } from '@/lib/auth/email-verification';

const signupSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(
      PASSWORD_REQUIREMENTS.minLength,
      `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters`
    ),
});

/**
 * POST create new user account
 * Now using withValidationHandler for automatic Zod validation and Prisma error handling
 */
export const POST = withValidationHandler(
  async (request: NextRequest) => {
    // Apply rate limiting to prevent signup abuse
    const identifier =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'anonymous';

    if (!signupLimiter.isAllowed(identifier)) {
      const resetTime = signupLimiter.getResetTime(identifier);
      return errorResponse(
        'Too many signup attempts. Please try again later.',
        {
          status: 429,
          headers: {
            'Retry-After': resetTime
              ? Math.ceil((resetTime.getTime() - Date.now()) / 1000).toString()
              : '3600',
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': signupLimiter.getRemainingAttempts(identifier).toString(),
            'X-RateLimit-Reset': resetTime?.toISOString() || '',
          },
        }
      );
    }

    // Parse and validate request body - Zod errors automatically handled by middleware
    const body = await request.json();
    const { name, email, password } = signupSchema.parse(body);

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      throw new ValidationError('Password does not meet requirements', [
        ...passwordValidation.errors.map((error) => ({ field: 'password', message: error })),
      ]);
    }

    // Normalize email
    const normalizedEmail = normalizeEmail(email);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new ConflictError('User with this email already exists', {
        field: 'email',
      });
    }

    // Hash password using centralized password utility
    const hashedPassword = await hashPassword(password);

    // Create user - Prisma P2002 (unique constraint) errors automatically handled by middleware
    // Note: emailVerified is null for email/password signups (requires verification)
    // OAuth users are automatically verified in the signIn callback
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        emailVerified: null, // Requires email verification
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    logger.info(
      {
        userId: user.id,
        email: user.email,
      },
      'New user created'
    );

    // Send verification email
    // Don't fail signup if email sending fails - user can request verification later
    try {
      await sendVerificationEmail(normalizedEmail, name.trim() || undefined);
    } catch (error) {
      logger.error(
        {
          err: error,
          userId: user.id,
          email: normalizedEmail,
        },
        'Failed to send verification email during signup'
      );
    }

    return created(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
      { message: 'Account created successfully' }
    );
  }
);
