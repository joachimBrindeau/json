import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { success, internalServerError } from '@/lib/api/responses';
import { withAuth } from '@/lib/api/utils';

// In-memory cache for user stats
// Cache stats for 30 seconds to prevent hammering the database
const statsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds

/**
 * Optimized user statistics endpoint using database aggregation
 * Includes in-memory caching to prevent excessive database queries
 * Replaces N+1 query pattern with single aggregation query
 */
export const GET = withAuth(async (_request: NextRequest, session) => {
  try {
    const userId = session.user.id;
    const now = Date.now();

    // Check cache first
    const cached = statsCache.get(userId);
    if (cached && now - cached.timestamp < CACHE_TTL) {
      logger.debug({ userId }, 'Returning cached user stats');

      // Return cached response with cache headers
      const response = success(cached.data);
      response.headers.set('X-Cache', 'HIT');
      response.headers.set('Cache-Control', 'private, max-age=30');
      return response;
    }

    // Single aggregation query instead of fetching all documents
    const stats = await prisma.jsonDocument.aggregate({
      where: {
        userId,
        expiresAt: { gt: new Date() }, // Exclude expired documents
      },
      _count: { id: true },
      _sum: { size: true },
    });

    const data = {
      total: stats._count.id || 0,
      totalSize: Number(stats._sum.size || 0),
    };

    // Update cache
    statsCache.set(userId, { data, timestamp: now });

    // Clean up old cache entries (simple cleanup strategy)
    if (statsCache.size > 1000) {
      const cutoff = now - CACHE_TTL;
      for (const [key, value] of statsCache.entries()) {
        if (value.timestamp < cutoff) {
          statsCache.delete(key);
        }
      }
    }

    const response = success(data);
    response.headers.set('X-Cache', 'MISS');
    response.headers.set('Cache-Control', 'private, max-age=30');
    return response;
  } catch (error: unknown) {
    logger.error({ err: error }, 'User stats API error');
    return internalServerError('Failed to fetch user statistics');
  }
});

