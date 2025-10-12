import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET linked accounts for the current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
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
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has a password (credentials account)
    const hasPassword = !!user.password;

    return NextResponse.json({
      accounts: user.accounts,
      hasPassword,
      email: user.email,
    });
  } catch (error) {
    console.error('Error fetching linked accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch linked accounts' },
      { status: 500 }
    );
  }
}

// DELETE unlink an account
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { accountId } = await request.json();

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID required' }, { status: 400 });
    }

    // Check if this is the user's account
    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId: session.user.id,
      },
    });

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Check if user has at least one other auth method
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { accounts: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const hasPassword = !!user.password;
    const otherAccounts = user.accounts.filter(a => a.id !== accountId);

    if (!hasPassword && otherAccounts.length === 0) {
      return NextResponse.json(
        { error: 'Cannot remove last authentication method' },
        { status: 400 }
      );
    }

    // Unlink the account
    await prisma.account.delete({
      where: { id: accountId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unlinking account:', error);
    return NextResponse.json(
      { error: 'Failed to unlink account' },
      { status: 500 }
    );
  }
}