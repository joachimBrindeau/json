import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';
import { config } from '@/lib/config';

// Global Prisma instance with connection pooling optimizations
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Lazy initialization function to avoid connecting during build time
function getPrismaClient(): PrismaClient | null {
  // During build time, skip Prisma initialization if database URL is not available or is a placeholder
  const isBuildTime =
    process.env.SKIP_ENV_VALIDATION === 'true' ||
    process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.npm_lifecycle_event === 'build';
  
  const dbUrl = config.database.url;
  const isPlaceholderUrl =
    dbUrl?.includes('build_user') ||
    dbUrl?.includes('build_database') ||
    dbUrl?.includes('localhost:5432/build');

  // Don't create PrismaClient during build with placeholder URLs
  if (isBuildTime && isPlaceholderUrl) {
    return null;
  }

  // Don't create PrismaClient if database URL is not available
  if (!dbUrl) {
    return null;
  }

  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  try {
    const client = new PrismaClient({
      log: config.isDevelopment ? ['query', 'error', 'warn'] : ['error'],
      datasourceUrl: dbUrl,
    });

    if (!config.isProduction) {
      globalForPrisma.prisma = client;
    }

    return client;
  } catch (error) {
    logger.warn({ err: error }, 'Failed to create PrismaClient, database may not be available');
    return null;
  }
}

// Export prisma with lazy initialization
// This will only create the client when actually accessed, not during module load
let _prismaInstance: PrismaClient | null = null;

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (!_prismaInstance) {
      _prismaInstance = getPrismaClient();
    }
    if (!_prismaInstance) {
      // Return a no-op function for methods, or undefined for properties
      if (typeof prop === 'string' && prop.startsWith('$')) {
        // For Prisma methods like $queryRaw, $transaction, etc.
        return () => {
          throw new Error('PrismaClient is not available. Database may not be configured or is unavailable during build.');
        };
      }
      throw new Error('PrismaClient is not available. Database may not be configured or is unavailable during build.');
    }
    return (_prismaInstance as any)[prop];
  },
}) as PrismaClient;

// Database health check
export async function checkDBHealth() {
  const client = getPrismaClient();
  if (!client) {
    return {
      postgres: false,
      redis: false,
      error: 'Database not configured or unavailable',
      timestamp: new Date().toISOString(),
    };
  }

  try {
    await client.$queryRaw`SELECT 1`;

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
  const client = getPrismaClient();
  if (client) {
    await client.$disconnect();
  }

  if (typeof window === 'undefined') {
    try {
      const { closeRedisConnection } = await import('@/lib/redis');
      await closeRedisConnection();
    } catch (error) {
      logger.warn({ err: error }, 'Redis cleanup failed');
    }
  }
}
