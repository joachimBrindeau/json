import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { success, unauthorized, internalServerError } from '@/lib/api/responses';
import { withAuth } from '@/lib/api/utils';

export const DELETE = withAuth(async (_request: NextRequest, session) => {
  try {
    // withAuth already ensures session.user.id exists
    // Delete user - cascade will automatically delete all related data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return unauthorized('User not found');
    }

    await prisma.user.delete({
      where: { id: user.id },
    });

    logger.info(
      {
        userId: user.id,
        email: session.user.email,
      },
      'Account deleted successfully'
    );

    return success({ message: 'Account deleted successfully' });
  } catch (error) {
    logger.error(
      {
        err: error,
        email: session?.user?.email,
      },
      'Failed to delete account'
    );
    return internalServerError('Failed to delete account');
  }
});
