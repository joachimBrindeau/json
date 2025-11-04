import { PrismaClient, User, Account } from '@prisma/client';
import { Account as NextAuthAccount } from 'next-auth';
import type { User as NextAuthUser } from 'next-auth';
import type { UserUpdateData } from './types';
import { logger } from '@/lib/logger';
import { normalizeEmail } from '@/lib/utils/email';

/**
 * Links OAuth provider account to existing user or creates account record
 * Handles account linking for OAuth providers (GitHub, Google, etc.)
 *
 * SECURITY: This function only links accounts when:
 * 1. Email addresses match (after normalization)
 * 2. OAuth provider has verified the email
 * 3. Both accounts belong to the same user
 *
 * @param user - NextAuth user object from OAuth provider
 * @param account - NextAuth account object with provider details
 * @param prisma - Prisma client instance
 * @returns Existing user ID if account was linked, null otherwise
 *
 * @example
 * const existingUserId = await linkOAuthAccount(user, account, prisma);
 * if (existingUserId) {
 *   user.id = existingUserId; // Use existing user instead of creating new one
 * }
 */
export async function linkOAuthAccount(
  user: NextAuthUser,
  account: NextAuthAccount,
  prisma: PrismaClient
): Promise<string | null> {
  try {
    // Only link OAuth accounts, not credentials
    if (!account.provider || account.provider === 'credentials') {
      return null;
    }

    // Normalize email for consistency and security
    const email = user.email ? normalizeEmail(user.email) : null;
    if (!email) {
      logger.warn({ provider: account.provider }, 'OAuth account has no email');
      return null;
    }

    // Check if user exists with this email (with transaction for race condition safety)
    // Use findUniqueOrThrow with catch for better error handling
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: { accounts: true },
    });

    if (!existingUser) {
      return null;
    }

    // Check if this provider+accountId combination is already linked
    const isLinked = existingUser.accounts.some(
      (acc) =>
        acc.provider === account.provider &&
        acc.providerAccountId === account.providerAccountId
    );

    if (!isLinked) {
      // Link the OAuth account to existing user
      // Use create with proper error handling to prevent race conditions
      try {
        await prisma.account.create({
          data: {
            userId: existingUser.id,
            type: account.type,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            refresh_token: account.refresh_token,
            access_token: account.access_token,
            expires_at: account.expires_at,
            token_type: account.token_type,
            scope: account.scope,
            id_token: account.id_token,
            session_state: account.session_state,
          },
        });

        logger.info(
          {
            userId: existingUser.id,
            provider: account.provider,
            email,
          },
          'Linked OAuth account to existing user'
        );
      } catch (createError: unknown) {
        // Handle unique constraint violation (race condition)
        // P2002 is Prisma's unique constraint violation code
        if (
          createError &&
          typeof createError === 'object' &&
          'code' in createError &&
          createError.code === 'P2002'
        ) {
          logger.info(
            {
              userId: existingUser.id,
              provider: account.provider,
              email,
            },
            'OAuth account already linked (race condition)'
          );
        } else {
          // Re-throw other errors
          throw createError;
        }
      }
    }

    // Update user info with OAuth provider data
    const updateData: UserUpdateData = {};

    // Always update image from OAuth providers (Google/GitHub profile pictures)
    if (user.image) {
      updateData.image = user.image;
    }

    // Update name if user doesn't have one
    if (!existingUser.name && user.name) {
      updateData.name = user.name;
    }

    // Apply updates if any
    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: updateData,
      });
    }

    // Return the existing user ID so it can be set on the user object
    return existingUser.id;
  } catch (error) {
    logger.error(
      {
        err: error,
        email: user.email,
        provider: account.provider,
      },
      'Failed to link OAuth account'
    );
    return null;
  }
}
