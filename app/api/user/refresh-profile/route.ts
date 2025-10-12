import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user data from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { accounts: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find Google account
    const googleAccount = user.accounts.find(account => account.provider === 'google');
    
    if (!googleAccount) {
      return NextResponse.json({ 
        message: 'No Google account linked',
        currentImage: user.image 
      });
    }

    // Try to refresh profile data from Google
    try {
      const response = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${googleAccount.access_token}`);
      
      if (response.ok) {
        const googleProfile = await response.json();
        
        // Update user with fresh Google profile data
        const updatedUser = await prisma.user.update({
          where: { id: user.id },
          data: {
            image: googleProfile.picture,
            name: googleProfile.name || user.name,
          }
        });

        return NextResponse.json({
          message: 'Profile refreshed successfully',
          oldImage: user.image,
          newImage: updatedUser.image,
          updated: true
        });
      } else {
        // If token is expired or invalid, we can't refresh
        return NextResponse.json({
          message: 'Could not refresh from Google (token may be expired)',
          currentImage: user.image,
          updated: false
        });
      }
    } catch (error) {
      console.error('Error refreshing Google profile:', error);
      return NextResponse.json({
        message: 'Error refreshing profile',
        currentImage: user.image,
        updated: false
      });
    }

  } catch (error) {
    console.error('Profile refresh error:', error);
    return NextResponse.json(
      { error: 'Failed to refresh profile' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user data from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { accounts: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
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
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Failed to get profile' },
      { status: 500 }
    );
  }
}
