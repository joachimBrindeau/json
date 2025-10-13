import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { api } from '@/lib/api/client';
import { success, unauthorized, notFound, internalServerError } from '@/lib/api/responses';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return unauthorized('Unauthorized');
    }

    // Get current user data from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { accounts: true }
    });

    if (!user) {
      return notFound('User not found');
    }

    // Find Google account
    const googleAccount = user.accounts.find(account => account.provider === 'google');
    
    if (!googleAccount) {
      return success({
        message: 'No Google account linked',
        currentImage: user.image
      });
    }

    // Try to refresh profile data from Google
    try {
      const googleProfile = await api.get(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${googleAccount.access_token}`).json<any>();

      // Update user with fresh Google profile data
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          image: googleProfile.picture,
          name: googleProfile.name || user.name,
        }
      });

      return success({
        message: 'Profile refreshed successfully',
        oldImage: user.image,
        newImage: updatedUser.image,
        updated: true
      });
    } catch (error) {
      logger.error({ err: error, userId: user.id, provider: 'google' }, 'Error refreshing Google profile');
      return success({
        message: 'Error refreshing profile',
        currentImage: user.image,
        updated: false
      });
    }

  } catch (error) {
    logger.error({ err: error, userId: (await getServerSession(authOptions))?.user?.id }, 'Profile refresh error');
    return internalServerError('Failed to refresh profile');
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return unauthorized('Unauthorized');
    }

    // Get current user data from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { accounts: true }
    });

    if (!user) {
      return notFound('User not found');
    }

    return success({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      accounts: user.accounts.map(account => ({
        provider: account.provider,
        type: account.type,
        providerAccountId: account.providerAccountId
      })),
      hasGoogleAccount: user.accounts.some(account => account.provider === 'google'),
      hasGitHubAccount: user.accounts.some(account => account.provider === 'github')
    });

  } catch (error) {
    logger.error({ err: error, userId: (await getServerSession(authOptions))?.user?.id }, 'Get profile error');
    return internalServerError('Failed to get profile');
  }
}
