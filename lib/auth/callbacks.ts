/**
 * NextAuth callback functions
 * Handles signIn, JWT, and session callbacks
 */

import type { CallbacksOptions } from 'next-auth';
import { logger } from '@/lib/logger';
import { linkOAuthAccount } from './account-linking';
import { getPrismaClient } from './adapter';

const prisma = getPrismaClient();

/**
 * NextAuth callbacks configuration
 * 
 * - signIn: Tracks login timestamp and handles OAuth account linking
 * - jwt: Populates JWT token with user data and handles updates
 * - session: Populates session with JWT data
 */
export const authCallbacks: Partial<CallbacksOptions> = {
  /**
   * SignIn callback
   * Called when user signs in (credentials or OAuth)
   * 
   * Responsibilities:
   * - Track last login timestamp
   * - Link OAuth accounts to existing users with same email
   * - Validate sign-in attempts
   */
  async signIn({ user, account }) {
    // Track last login timestamp
    if (prisma && user.email) {
      await prisma.user.update({
        where: { email: user.email },
        data: { lastLoginAt: new Date() }
      }).catch((err: Error) => {
        logger.error({ err, email: user.email }, 'Failed to update lastLoginAt');
      });
    }

    // Allow OAuth account linking to existing users with same email
    // SECURITY: Only link OAuth accounts (not credentials)
    if (prisma && account?.provider && account.provider !== 'credentials') {
      const existingUserId = await linkOAuthAccount(user, account, prisma);
      if (existingUserId) {
        user.id = existingUserId;
      }
    }
    
    return true;
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
  async jwt({ token, user, account, trigger }) {
    // On initial sign-in, populate token with user data
    if (user) {
      token.id = user.id;
      token.name = user.name;
      token.email = user.email;
      token.image = user.image;
    }

    // On profile update, refresh user data from database
    if (trigger === 'update' && prisma && token.email) {
      const dbUser = await prisma.user.findUnique({
        where: { email: token.email as string },
        select: {
          id: true,
          name: true,
          email: true,
          image: true
        },
      });

      if (dbUser) {
        token.id = dbUser.id;
        token.name = dbUser.name;
        token.email = dbUser.email;
        token.image = dbUser.image;
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
    if (session.user && token.id) {
      session.user.id = token.id as string;
      session.user.name = token.name as string;
      session.user.email = token.email as string;
      session.user.image = token.image as string;
    }
    return session;
  },
};

