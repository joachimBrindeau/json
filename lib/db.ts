import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';
import { config } from '@/lib/config';

// Global Prisma instance with connection pooling optimizations
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: config.isDevelopment ? ['query', 'error', 'warn'] : ['error'],
    datasourceUrl: config.database.url,
  });

if (!config.isProduction) globalForPrisma.prisma = prisma;

// Database health check
export async function checkDBHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`;

    // Dynamically import Redis only on server
    let redisHealth = false;
    if (typeof window === 'undefined') {
      try {
        const { redis } = await import('@/lib/redis');
        if (redis) {
          redisHealth = (await redis.ping()) === 'PONG';
        }
      } catch (error) {
        logger.warn({ err: error }, 'Redis not available');
      }
    }

    return {
      postgres: true,
      redis: redisHealth,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error({ err: error }, 'Database health check failed');
    return {
      postgres: false,
      redis: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

// Graceful shutdown
export async function closeConnections() {
  await prisma.$disconnect();

  if (typeof window === 'undefined') {
    try {
      const { closeRedisConnection } = await import('@/lib/redis');
      await closeRedisConnection();
    } catch (error) {
      logger.warn({ err: error }, 'Redis cleanup failed');
    }
  }
}
