import { NextRequest } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth/admin';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { success, forbidden, notFound, internalServerError } from '@/lib/api/responses';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    await requireSuperAdmin();

    const params = await context.params;
    const userId = params.id;

    // Fetch comprehensive user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        accounts: {
          select: {
            provider: true,
            providerAccountId: true,
            type: true,
          },
        },
        documents: {
          select: {
            id: true,
            title: true,
            visibility: true,
            createdAt: true,
            updatedAt: true,
            viewCount: true,
            size: true,
            tags: true,
          },
          orderBy: {
            updatedAt: 'desc',
          },
          take: 10, // Latest 10 documents
        },
        _count: {
          select: {
            documents: true,
            sessions: true,
          },
        },
      },
    });

    if (!user) {
      return notFound('User not found');
    }

    // Calculate statistics
    const totalSize = user.documents.reduce((sum: number, doc) => sum + Number(doc.size || 0), 0);
    const publicDocuments = user.documents.filter((doc) => doc.visibility === 'public').length;
    const privateDocuments = user.documents.filter((doc) => doc.visibility === 'private').length;
    const totalViews = user.documents.reduce((sum: number, doc) => sum + (doc.viewCount || 0), 0);

    // Extract unique tags
    const allTags = user.documents.flatMap((doc) => doc.tags || []);
    const uniqueTags = [...new Set(allTags)];

    // Get most recent session for last login (use expires as proxy for last activity)
    const latestSession = await prisma.session.findFirst({
      where: { userId },
      orderBy: { expires: 'desc' },
      select: {
        expires: true,
      },
    });

    const enrichedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified?.toISOString() || null,
      image: user.image,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      lastLogin: latestSession?.expires.toISOString() || null,

      // OAuth accounts
      accounts: user.accounts.map((account) => ({
        provider: account.provider,
        providerAccountId: account.providerAccountId,
        type: account.type,
      })),

      // Statistics
      statistics: {
        totalDocuments: user._count.documents,
        publicDocuments,
        privateDocuments,
        totalSize,
        totalViews,
        uniqueTags: uniqueTags.length,
        activeSessions: user._count.sessions,
      },

      // Recent documents
      recentDocuments: user.documents.map((doc) => ({
        id: doc.id,
        title: doc.title || 'Untitled',
        visibility: doc.visibility,
        views: doc.viewCount,
        size: Number(doc.size),
        tags: doc.tags,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
      })),

      // Tag usage
      tags: uniqueTags,
    };

    return success({ user: enrichedUser });
  } catch (error: unknown) {
    logger.error({ err: error }, 'Admin user details API error');

    if (error instanceof Error && error.message === 'Unauthorized: Superadmin access required') {
      return forbidden('Unauthorized access');
    }

    return internalServerError('Failed to fetch user details');
  }
}
