import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { success, unauthorized, badRequest, internalServerError } from '@/lib/api/responses';
import { withAuth } from '@/lib/api/utils';
import { sendVerificationEmail } from '@/lib/auth/email-verification';
import { normalizeEmail } from '@/lib/utils/email';

/**
 * POST send verification email
 * Sends a verification email to the authenticated user
 */
export const POST = withAuth(async (_request: NextRequest, session) => {
  try {
    if (!session.user.email) {
      return unauthorized('Email not found in session');
    }

    const normalizedEmail = normalizeEmail(session.user.email);

    // Check if email is already verified
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { emailVerified: true, name: true },
    });

    if (user?.emailVerified) {
      return badRequest('Email is already verified');
    }

    // Get user name for personalized email
    const userName = user?.name || undefined;

    // Send verification email
    const emailSent = await sendVerificationEmail(normalizedEmail, userName);

    if (!emailSent) {
      logger.error(
        {
          email: normalizedEmail,
          userId: session.user.id,
        },
        'Failed to send verification email'
      );
      // Still return success to avoid exposing email service issues
      // Email will be logged for debugging
      return internalServerError('Failed to send verification email. Please try again later.');
    }

    return success({
      message: 'Verification email sent. Please check your inbox.',
    });
  } catch (error) {
    logger.error(
      {
        err: error,
        email: session?.user?.email,
      },
      'Failed to send verification email'
    );
    return internalServerError('Failed to send verification email');
  }
});

