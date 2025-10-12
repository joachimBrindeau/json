import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
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
    });

    return NextResponse.json(
      { message: 'Account deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to delete account:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}