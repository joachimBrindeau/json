import { PrismaClient } from '@prisma/client';

// Global Prisma instance with connection pooling optimizations
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasourceUrl: process.env.DATABASE_URL,
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

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
          redisHealth = await redis.ping() === 'PONG';
        }
      } catch (error) {
        console.warn('Redis not available:', error);
      }
    }
    
    return {
      postgres: true,
      redis: redisHealth,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Database health check failed:', error);
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
      console.warn('Redis cleanup failed:', error);
    }
  }
}
