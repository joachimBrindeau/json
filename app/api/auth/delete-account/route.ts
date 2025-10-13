import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { success, unauthorized, internalServerError } from '@/lib/api/responses';

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return unauthorized('Unauthorized');
    }

    // Start a transaction to delete all user data
    await prisma.$transaction(async (tx) => {
      // Find the user
      const user = await tx.user.findUnique({
        where: { email: session.user.email! },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Delete all documents owned by the user
      await tx.document.deleteMany({
        where: { userId: user.id },
      });

      // Delete the user's account
      await tx.account.deleteMany({
        where: { userId: user.id },
      });

      // Delete the user's sessions
      await tx.session.deleteMany({
        where: { userId: user.id },
      });

      // Finally, delete the user
      await tx.user.delete({
        where: { id: user.id },
      });

      logger.info(
        {
          userId: user.id,
          email: session.user.email
        },
        'Account deleted successfully'
      );
    });

    return success({ message: 'Account deleted successfully' });
  } catch (error) {
    logger.error(
      {
        err: error,
        email: session?.user?.email
      },
      'Failed to delete account'
    );
    return internalServerError('Failed to delete account');
  }
}