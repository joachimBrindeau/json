import Redis from 'ioredis';

// Server-only Redis instance
const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

let redis: Redis | undefined;

if (typeof window === 'undefined') {
  // Only create Redis instance on server
  redis = globalForRedis.redis ?? 
    new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      keepAlive: 30000,
      commandTimeout: 5000,
    });

  if (process.env.NODE_ENV !== 'production') {
    globalForRedis.redis = redis;
  }
}

export { redis };

// Graceful shutdown
export async function closeRedisConnection() {
  if (redis) {
    redis.disconnect();
  }
}