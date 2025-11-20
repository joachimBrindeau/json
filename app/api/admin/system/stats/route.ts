import { requireSuperAdmin } from '@/lib/auth/admin';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { success, forbidden, internalServerError } from '@/lib/api/responses';
import { config } from '@/lib/config';

export async function GET() {
  try {
    await requireSuperAdmin();

    // Database health check
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbResponseTime = Date.now() - dbStart;

    // Get database statistics
    const [userCount, documentCount, documentStats] = await Promise.all([
      prisma.user.count(),
      prisma.jsonDocument.count(),
      prisma.jsonDocument.aggregate({
        _avg: { size: true },
        _sum: { size: true },
      }),
    ]);

    // Redis health check
    let redisStatus: 'connected' | 'disconnected' | 'error' = 'disconnected';
    let redisResponseTime: number | undefined;
    const redisInfo: { memoryUsed?: number; memoryMax?: number } = {};

    try {
      const { redis } = await import('@/lib/redis');
      if (redis) {
        const redisStart = Date.now();
        const pingResponse = await redis.ping();
        redisResponseTime = Date.now() - redisStart;

        if (pingResponse === 'PONG') {
          redisStatus = 'connected';

          // Get Redis memory info
          try {
            const info = await redis.info('memory');
            const memoryUsedMatch = info.match(/used_memory:(\d+)/);
            const memoryMaxMatch = info.match(/maxmemory:(\d+)/);

            if (memoryUsedMatch) {
              redisInfo.memoryUsed = parseInt(memoryUsedMatch[1], 10);
            }
            if (memoryMaxMatch) {
              redisInfo.memoryMax = parseInt(memoryMaxMatch[1], 10);
            }
          } catch (infoError) {
            logger.warn({ err: infoError }, 'Failed to get Redis memory info');
          }
        }
      }
    } catch (error) {
      logger.error({ err: error }, 'Redis health check failed');
      redisStatus = 'error';
    }

    // System information
    const stats = {
      database: {
        status: 'healthy' as const,
        responseTime: dbResponseTime,
        totalTables: 5, // Estimate based on schema
        totalRecords: userCount + documentCount,
      },
      redis: {
        status: redisStatus,
        responseTime: redisResponseTime,
        memoryUsed: redisInfo.memoryUsed || null,
        memoryMax: redisInfo.memoryMax || null,
        available: redisStatus === 'connected',
      },
      application: {
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        nodeVersion: process.version,
        environment: config.nodeEnv,
        memoryUsage: process.memoryUsage().heapUsed,
      },
      storage: {
        documentsCount: documentCount,
        totalSize: documentStats._sum.size || 0,
        avgDocumentSize: documentStats._avg.size || 0,
      },
    };

    return success(stats);
  } catch (error: unknown) {
    logger.error({ err: error }, 'Admin system stats API error');

    if (error instanceof Error && error.message === 'Unauthorized: Superadmin access required') {
      return forbidden('Unauthorized access');
    }

    return internalServerError('Failed to fetch system stats');
  }
}
