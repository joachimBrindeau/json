import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { success, internalServerError } from '@/lib/api/responses';
import { withAuth } from '@/lib/api/utils';

/**
 * Optimized user statistics endpoint using database aggregation
 * Replaces N+1 query pattern with single aggregation query
 */
export const GET = withAuth(async (_request: NextRequest, session) => {
  try {
    // Single aggregation query instead of fetching all documents
    const stats = await prisma.jsonDocument.aggregate({
      where: {
        userId: session.user.id,
        expiresAt: { gt: new Date() } // Exclude expired documents
      },
      _count: { id: true },
      _sum: { size: true }
    });

    return success({
      total: stats._count.id || 0,
      totalSize: Number(stats._sum.size || 0)
    });

  } catch (error: unknown) {
    logger.error({ err: error }, 'User stats API error');
    return internalServerError('Failed to fetch user statistics');
  }
});
