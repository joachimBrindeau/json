import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { success } from '@/lib/api/responses';
import { sanitizeString, withAuth } from '@/lib/api/utils';
import { ValidationError, NotFoundError } from '@/lib/utils/app-errors';
import { z } from 'zod';

/**
 * GET linked accounts for the current user
 */
export const GET = withAuth(async (_request: NextRequest, session) => {
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      accounts: {
        select: {
          id: true,
          provider: true,
          type: true,
        },
      },
    },
  });

  if (!user) {
    throw new NotFoundError('User', session.user.id);
  }

  // Check if user has a password (credentials account)
  const hasPassword = !!user.password;

  return success({
    accounts: user.accounts,
    hasPassword,
    email: user.email,
  });
});

/**
 * DELETE unlink an account
 */
export const DELETE = withAuth(async (request: NextRequest, session) => {
  const body = await request.json();
  const parsed = z
    .object({ accountId: z.string().min(1, 'Account ID is required').max(64) })
    .safeParse(body);
  if (!parsed.success) {
    throw new ValidationError('Account ID required', [
      { field: 'accountId', message: parsed.error.issues[0]?.message || 'Account ID is required' },
    ]);
  }
  const accountId = sanitizeString(parsed.data.accountId).slice(0, 64);
  if (!accountId) {
    throw new ValidationError('Account ID required', [
      { field: 'accountId', message: 'Account ID is required' },
    ]);
  }

  // Check if this is the user's account
  const account = await prisma.account.findFirst({
    where: {
      id: accountId,
      userId: session.user.id,
    },
  });

  if (!account) {
    throw new NotFoundError('Account', accountId);
  }

  // Check if user has at least one other auth method
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { accounts: true },
  });

  if (!user) {
    throw new NotFoundError('User', session.user.id);
  }

  const hasPassword = !!user.password;
  const otherAccounts = user.accounts.filter((a) => a.id !== accountId);

  if (!hasPassword && otherAccounts.length === 0) {
    throw new ValidationError('Cannot remove last authentication method', [
      { field: 'accountId', message: 'At least one authentication method must remain' },
    ]);
  }

  // Unlink the account - Prisma errors automatically handled by middleware
  await prisma.account.delete({
    where: { id: accountId },
  });

  return success({});
});
