import { PrismaClient, User, Account } from '@prisma/client';
import { Account as NextAuthAccount } from 'next-auth';
import type { User as NextAuthUser } from 'next-auth';
import type { UserUpdateData } from './types';
import { logger } from '@/lib/logger';

/**
 * Links OAuth provider account to existing user or creates account record
 * Handles account linking for OAuth providers (GitHub, Google, etc.)
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

    const email = user.email;
    if (!email) {
      logger.warn({ provider: account.provider }, 'OAuth account has no email');
      return null;
    }

    // Check if user exists with this email
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: { accounts: true },
    });

    if (!existingUser) {
      return null;
    }

    // Check if this provider is already linked
    const isLinked = existingUser.accounts.some(
      (acc) =>
        acc.provider === account.provider && acc.providerAccountId === account.providerAccountId
    );

    if (!isLinked) {
      // Link the OAuth account to existing user
      // Use upsert to handle race conditions where account might be created concurrently
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
