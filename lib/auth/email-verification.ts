/**
 * Email verification utilities
 * Handles sending and verifying email addresses
 */

import { randomBytes } from 'crypto';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { config } from '@/lib/config';
import { normalizeEmail } from '@/lib/utils/email';
import { sendEmail } from '@/lib/email/service';
import { getVerificationEmailTemplate } from '@/lib/email/templates/verification-email';

/**
 * Generate a secure verification token
 */
export function generateVerificationToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Create email verification token and store it
 * Token expires in 24 hours
 */
export async function createVerificationToken(email: string): Promise<string> {
  const normalizedEmail = normalizeEmail(email);
  const token = generateVerificationToken();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Delete any existing tokens for this email
  await prisma.verificationToken.deleteMany({
    where: {
      identifier: normalizedEmail,
    },
  });

  // Create new verification token
  await prisma.verificationToken.create({
    data: {
      identifier: normalizedEmail,
      token,
      expires,
    },
  });

  logger.info({ email: normalizedEmail }, 'Verification token created');

  return token;
}

/**
 * Verify email token
 * Returns true if token is valid and not expired
 */
export async function verifyEmailToken(email: string, token: string): Promise<boolean> {
  const normalizedEmail = normalizeEmail(email);

  const verificationToken = await prisma.verificationToken.findUnique({
    where: {
      identifier_token: {
        identifier: normalizedEmail,
        token,
      },
    },
  });

  if (!verificationToken) {
    logger.warn({ email: normalizedEmail }, 'Invalid verification token');
    return false;
  }

  // Check if token is expired
  if (verificationToken.expires < new Date()) {
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: normalizedEmail,
          token,
        },
      },
    });
    logger.warn({ email: normalizedEmail }, 'Verification token expired');
    return false;
  }

  return true;
}

/**
 * Mark email as verified
 */
export async function markEmailAsVerified(email: string): Promise<void> {
  const normalizedEmail = normalizeEmail(email);

  await prisma.user.update({
    where: { email: normalizedEmail },
    data: { emailVerified: new Date() },
  });

  // Delete verification token after successful verification
  await prisma.verificationToken.deleteMany({
    where: { identifier: normalizedEmail },
  });

  logger.info({ email: normalizedEmail }, 'Email verified');
}

/**
 * Check if email is verified
 */
export async function isEmailVerified(email: string): Promise<boolean> {
  const normalizedEmail = normalizeEmail(email);

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { emailVerified: true },
  });

  return !!user?.emailVerified;
}

/**
 * Generate verification URL
 * This would be used in email templates
 */
export function generateVerificationUrl(token: string, email: string): string {
  const baseUrl = config.auth.url || config.app.url;
  const params = new URLSearchParams({
    token,
    email,
  });
  return `${baseUrl}/api/auth/verify-email?${params.toString()}`;
}

/**
 * Send verification email
 * Creates token and sends verification email to user
 */
export async function sendVerificationEmail(email: string, recipientName?: string): Promise<boolean> {
  try {
    const normalizedEmail = normalizeEmail(email);
    
    // Create verification token
    const token = await createVerificationToken(normalizedEmail);
    const verificationUrl = generateVerificationUrl(token, normalizedEmail);

    // Generate email template
    const { subject, html, text } = getVerificationEmailTemplate({
      verificationUrl,
      recipientName,
    });

    // Send email
    const sent = await sendEmail({
      to: normalizedEmail,
      subject,
      html,
      text,
    });

    if (sent) {
      logger.info({ email: normalizedEmail }, 'Verification email sent');
    } else {
      logger.warn({ email: normalizedEmail }, 'Verification email failed to send');
    }

    return sent;
  } catch (error) {
    logger.error({ err: error, email }, 'Failed to send verification email');
    return false;
  }
}

