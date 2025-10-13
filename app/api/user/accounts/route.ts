import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { success } from '@/lib/api/responses';
import { withDatabaseHandler } from '@/lib/api/middleware';
import { AuthenticationError, ValidationError, NotFoundError } from '@/lib/utils/app-errors';

/**
 * GET linked accounts for the current user
 * Now using withDatabaseHandler for automatic error handling and Prisma error mapping
 */
export const GET = withDatabaseHandler(async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new AuthenticationError('Not authenticated');
  }

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
 * Now using withDatabaseHandler for automatic error handling and Prisma error mapping
 */
export const DELETE = withDatabaseHandler(async (request: Request) => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new AuthenticationError('Not authenticated');
  }

  const { accountId } = await request.json();

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
  const otherAccounts = user.accounts.filter(a => a.id !== accountId);

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