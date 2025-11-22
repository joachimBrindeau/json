/**
 * NextAuth callback functions
 * Handles signIn, JWT, session, and redirect callbacks
 */

import type { CallbacksOptions } from 'next-auth';
import { logger } from '@/lib/logger';
import { linkOAuthAccount } from './account-linking';
import { getPrismaClient } from './adapter';
import { normalizeEmail } from '@/lib/utils/email';

const prisma = getPrismaClient();

/**
 * NextAuth callbacks configuration
 *
 * - signIn: Tracks login timestamp and handles OAuth account linking
 * - jwt: Populates JWT token with user data and handles updates
 * - session: Populates session with JWT data
 * - redirect: Handles post-authentication redirects
 */
export const authCallbacks: Partial<CallbacksOptions> = {
  /**
   * SignIn callback
   * Called when user signs in (credentials or OAuth)
   *
   * Responsibilities:
   * - Track last login timestamp (only for existing users)
   * - Link OAuth accounts to existing users with same email
   * - Validate sign-in attempts
   * - Handle OAuth-specific error cases
   */
  async signIn({ user, account }) {
    try {
      // Normalize email for consistency
      if (user.email) {
        user.email = normalizeEmail(user.email);
      }

      // Handle OAuth account linking before updating lastLoginAt
      // SECURITY: Only link OAuth accounts (not credentials)
      // IMPORTANT: Do this FIRST before updating lastLoginAt to ensure user exists
      if (prisma && account?.provider && account.provider !== 'credentials') {
        if (user.email) {
          // Check if email is already verified before updating (performance optimization)
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
            select: { emailVerified: true },
          });

          // Mark email as verified for OAuth users (providers verify emails)
          // Only update if not already verified to avoid unnecessary writes
          if (existingUser && !existingUser.emailVerified) {
            await prisma.user
              .updateMany({
                where: { email: user.email },
                data: { emailVerified: new Date() },
              })
              .catch((err: Error) => {
                logger.debug({ err, email: user.email }, 'Could not mark OAuth email as verified');
              });
          }

          // Link OAuth account to existing user if email matches
          const existingUserId = await linkOAuthAccount(user, account, prisma);
          if (existingUserId) {
            user.id = existingUserId;
          }
        } else {
          // Log warning for OAuth accounts without email
          logger.warn(
            {
              provider: account.provider,
              userId: user.id,
            },
            'OAuth sign-in without email - account linking skipped'
          );
        }
      }

      // Track last login timestamp (only for existing users)
      // Note: For new OAuth users, the adapter will create the user first,
      // so by the time we reach here, the user should exist
      if (prisma && user.email && user.id) {
        await prisma.user
          .update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          })
          .catch((err: Error) => {
            // Log but don't fail - this is non-critical
            logger.warn({ err, email: user.email, userId: user.id }, 'Failed to update lastLoginAt');
          });
      }

      return true;
    } catch (error) {
      logger.error(
        {
          err: error,
          email: user.email,
          provider: account?.provider,
          userId: user.id,
        },
        'SignIn callback error'
      );
      // Don't block sign-in for non-critical errors, but log them
      // Critical errors will be thrown and caught by NextAuth
      return true;
    }
  },

  /**
   * JWT callback
   * Called when JWT is created or updated
   *
   * Responsibilities:
   * - Populate token with user data on initial sign-in
   * - Refresh user data from database on update trigger
   * - Maintain token consistency
   */
  async jwt({ token, user, account: _account, trigger }) {
    // On initial sign-in, populate token with user data
    if (user) {
      token.id = user.id;
      token.name = user.name ?? null;
      token.email = user.email ?? null;
      token.image = user.image ?? null;
    }

    // On profile update, refresh user data from database
    if (trigger === 'update' && prisma && token.email && typeof token.email === 'string') {
      const dbUser = await prisma.user.findUnique({
        where: { email: token.email },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      });

      if (dbUser) {
        token.id = dbUser.id;
        token.name = dbUser.name ?? null;
        token.email = dbUser.email ?? null;
        token.image = dbUser.image ?? null;
      }
    }

    return token;
  },

  /**
   * Session callback
   * Called when session is accessed
   *
   * Responsibilities:
   * - Populate session with JWT data
   * - No database queries (uses JWT data directly)
   */
  async session({ session, token }) {
    // Use JWT data directly - no database query needed
    if (session.user && token.id && typeof token.id === 'string') {
      session.user.id = token.id;
      session.user.name = (typeof token.name === 'string' ? token.name : null) ?? null;
      session.user.email = (typeof token.email === 'string' ? token.email : null) ?? null;
      session.user.image = (typeof token.image === 'string' ? token.image : null) ?? null;
    }
    return session;
  },

  /**
   * Redirect callback
   * Called after successful sign-in to determine redirect URL
   *
   * Responsibilities:
   * - Handle post-OAuth redirects
   * - Preserve callbackUrl from query parameters
   * - Redirect to home page by default
   */
  async redirect({ url, baseUrl }) {
    // If url is a relative path, prepend baseUrl
    if (url.startsWith('/')) {
      return `${baseUrl}${url}`;
    }

    // If url is on same origin, allow it
    if (new URL(url).origin === baseUrl) {
      return url;
    }

    // Default to home page
    return baseUrl;
  },
};
