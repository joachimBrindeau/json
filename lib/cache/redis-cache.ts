/**
 * Redis Caching Utilities
 *
 * Provides type-safe caching with TTL management, cache invalidation,
 * and monitoring capabilities.
 */

import { redis } from '../redis';
import { logger } from '../logger';

export interface CacheOptions {
  /** Time-to-live in seconds */
  ttl: number;
  /** Cache key prefix for namespacing */
  prefix?: string;
  /** Whether to log cache hits/misses */
  logAccess?: boolean;
  /** Whether to compress large values */
  compress?: boolean;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  avgResponseTime: number;
}

/**
 * In-memory fallback when Redis is unavailable
 */
class MemoryCache {
  private cache = new Map<string, { value: string; expiresAt: number }>();

  async get(key: string): Promise<string | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(pattern.replace('*', '.*'));
    return Array.from(this.cache.keys()).filter((key) => regex.test(key));
  }

  // Cleanup expired entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

// Fallback cache instance
const memoryCache = new MemoryCache();

// Cleanup memory cache every 5 minutes
if (typeof window === 'undefined') {
  setInterval(() => memoryCache.cleanup(), 5 * 60 * 1000);
}

// Cache statistics tracking
const cacheStats = {
  hits: 0,
  misses: 0,
  totalResponseTime: 0,
  operations: 0,
};

/**
 * Build a cache key with optional prefix
 */
export function buildCacheKey(prefix: string | undefined, key: string): string {
  return prefix ? `${prefix}:${key}` : key;
}

/**
 * Check if Redis is available
 */
async function isRedisAvailable(): Promise<boolean> {
  if (!redis) return false;

  try {
    await redis.ping();
    return true;
  } catch {
    return false;
  }
}

/**
 * Get value from cache with automatic fallback to memory cache
 */
export async function cacheGet<T = any>(
  key: string,
  options: Partial<CacheOptions> = {}
): Promise<T | null> {
  const fullKey = buildCacheKey(options.prefix, key);
  const startTime = Date.now();

  try {
    // Try Redis first
    if (await isRedisAvailable()) {
      const value = await redis!.get(fullKey);

      if (value !== null) {
        cacheStats.hits++;
        const responseTime = Date.now() - startTime;
        cacheStats.totalResponseTime += responseTime;
        cacheStats.operations++;

        if (options.logAccess) {
          logger.debug({ key: fullKey, responseTime }, 'Cache hit (Redis)');
        }

        return JSON.parse(value) as T;
      }
    } else {
      // Fallback to memory cache
      const value = await memoryCache.get(fullKey);

      if (value !== null) {
        cacheStats.hits++;
        const responseTime = Date.now() - startTime;
        cacheStats.totalResponseTime += responseTime;
        cacheStats.operations++;

        if (options.logAccess) {
          logger.debug({ key: fullKey, responseTime }, 'Cache hit (Memory)');
        }

        return JSON.parse(value) as T;
      }
    }

    // Cache miss
    cacheStats.misses++;
    cacheStats.operations++;

    if (options.logAccess) {
      logger.debug({ key: fullKey }, 'Cache miss');
    }

    return null;
  } catch (error) {
    logger.error({ err: error, key: fullKey }, 'Cache get error');
    return null;
  }
}

/**
 * Set value in cache with TTL
 */
export async function cacheSet<T = any>(
  key: string,
  value: T,
  options: CacheOptions
): Promise<boolean> {
  const fullKey = buildCacheKey(options.prefix, key);

  try {
    const serialized = JSON.stringify(value);

    // Try Redis first
    if (await isRedisAvailable()) {
      await redis!.setex(fullKey, options.ttl, serialized);

      if (options.logAccess) {
        logger.debug({ key: fullKey, ttl: options.ttl }, 'Cache set (Redis)');
      }

      return true;
    } else {
      // Fallback to memory cache
      await memoryCache.set(fullKey, serialized, options.ttl);

      if (options.logAccess) {
        logger.debug({ key: fullKey, ttl: options.ttl }, 'Cache set (Memory)');
      }

      return true;
    }
  } catch (error) {
    logger.error({ err: error, key: fullKey }, 'Cache set error');
    return false;
  }
}

/**
 * Delete key from cache
 */
export async function cacheDel(key: string, options: Partial<CacheOptions> = {}): Promise<boolean> {
  const fullKey = buildCacheKey(options.prefix, key);

  try {
    if (await isRedisAvailable()) {
      await redis!.del(fullKey);
    } else {
      await memoryCache.del(fullKey);
    }

    if (options.logAccess) {
      logger.debug({ key: fullKey }, 'Cache delete');
    }

    return true;
  } catch (error) {
    logger.error({ err: error, key: fullKey }, 'Cache delete error');
    return false;
  }
}

/**
 * Delete multiple keys matching pattern
 */
export async function cacheDelPattern(
  pattern: string,
  options: Partial<CacheOptions> = {}
): Promise<number> {
  const fullPattern = buildCacheKey(options.prefix, pattern);

  try {
    if (await isRedisAvailable()) {
      const keys = await redis!.keys(fullPattern);
      if (keys.length === 0) return 0;

      await redis!.del(...keys);

      if (options.logAccess) {
        logger.debug({ pattern: fullPattern, count: keys.length }, 'Cache delete pattern');
      }

      return keys.length;
    } else {
      const keys = await memoryCache.keys(fullPattern);
      for (const key of keys) {
        await memoryCache.del(key);
      }

      if (options.logAccess) {
        logger.debug({ pattern: fullPattern, count: keys.length }, 'Cache delete pattern (Memory)');
      }

      return keys.length;
    }
  } catch (error) {
    logger.error({ err: error, pattern: fullPattern }, 'Cache delete pattern error');
    return 0;
  }
}

/**
 * Check if key exists in cache
 */
export async function cacheExists(
  key: string,
  options: Partial<CacheOptions> = {}
): Promise<boolean> {
  const fullKey = buildCacheKey(options.prefix, key);

  try {
    if (await isRedisAvailable()) {
      const exists = await redis!.exists(fullKey);
      return exists === 1;
    } else {
      return await memoryCache.exists(fullKey);
    }
  } catch (error) {
    logger.error({ err: error, key: fullKey }, 'Cache exists error');
    return false;
  }
}

/**
 * Get or set pattern: fetch from cache or execute function and cache result
 */
export async function cacheGetOrSet<T = any>(
  key: string,
  fetchFn: () => Promise<T>,
  options: CacheOptions
): Promise<T> {
  // Try to get from cache first
  const cached = await cacheGet<T>(key, options);
  if (cached !== null) {
    return cached;
  }

  // Cache miss - fetch data
  const data = await fetchFn();

  // Store in cache (fire and forget, don't wait)
  cacheSet(key, data, options).catch((error) => {
    logger.error({ err: error, key }, 'Failed to cache result');
  });

  return data;
}

/**
 * Get cache statistics
 */
export function getCacheStats(): CacheStats {
  const total = cacheStats.hits + cacheStats.misses;
  return {
    hits: cacheStats.hits,
    misses: cacheStats.misses,
    hitRate: total > 0 ? cacheStats.hits / total : 0,
    avgResponseTime:
      cacheStats.operations > 0 ? cacheStats.totalResponseTime / cacheStats.operations : 0,
  };
}

/**
 * Reset cache statistics
 */
export function resetCacheStats(): void {
  cacheStats.hits = 0;
  cacheStats.misses = 0;
  cacheStats.totalResponseTime = 0;
  cacheStats.operations = 0;
}

/**
 * Cache key builders for common patterns
 */
export const CacheKeys = {
  // Public documents listing
  publicDocuments: (page: number, limit: number, filters?: string) =>
    `public:docs:${page}:${limit}${filters ? `:${filters}` : ''}`,

  // User documents listing
  userDocuments: (userId: string, page: number, limit: number) =>
    `user:${userId}:docs:${page}:${limit}`,

  // Document by ID
  document: (id: string) => `doc:${id}`,

  // Document analytics
  documentAnalytics: (id: string) => `analytics:doc:${id}`,

  // Tag analytics
  tagAnalytics: (days: number, limit: number) => `analytics:tags:${days}:${limit}`,

  // User analytics
  userAnalytics: (userId: string, days: number) => `analytics:user:${userId}:${days}`,

  // User stats
  userStats: (userId: string) => `stats:user:${userId}`,

  // Platform analytics (admin)
  platformAnalytics: (days: number) => `analytics:platform:${days}`,
};

/**
 * Predefined TTL values (in seconds)
 */
export const CacheTTL = {
  /** 30 seconds - for frequently changing data */
  SHORT: 30,

  /** 1 minute - for user-specific stats */
  MINUTE: 60,

  /** 5 minutes - for public document listings */
  MEDIUM: 5 * 60,

  /** 15 minutes - for analytics data */
  LONG: 15 * 60,

  /** 1 hour - for rarely changing data */
  HOUR: 60 * 60,

  /** 1 day - for static content */
  DAY: 24 * 60 * 60,
};

/**
 * Cache invalidation helpers
 */
export const CacheInvalidation = {
  /**
   * Invalidate all caches related to a document
   */
  async document(documentId: string): Promise<void> {
    await Promise.all([
      cacheDel(CacheKeys.document(documentId)),
      cacheDel(CacheKeys.documentAnalytics(documentId)),
      cacheDelPattern('public:docs:*'), // Invalidate public listings
    ]);
  },

  /**
   * Invalidate all caches related to a user
   */
  async user(userId: string): Promise<void> {
    await Promise.all([
      cacheDelPattern(`user:${userId}:*`),
      cacheDelPattern(`analytics:user:${userId}:*`),
      cacheDel(CacheKeys.userStats(userId)),
    ]);
  },

  /**
   * Invalidate tag analytics
   */
  async tags(): Promise<void> {
    await cacheDelPattern('analytics:tags:*');
  },

  /**
   * Invalidate platform analytics
   */
  async platform(): Promise<void> {
    await cacheDelPattern('analytics:platform:*');
  },

  /**
   * Invalidate all public document listings
   */
  async publicDocuments(): Promise<void> {
    await cacheDelPattern('public:docs:*');
  },
};

const redisCache = {
  get: cacheGet,
  set: cacheSet,
  del: cacheDel,
  delPattern: cacheDelPattern,
  exists: cacheExists,
  getOrSet: cacheGetOrSet,
  getStats: getCacheStats,
  resetStats: resetCacheStats,
  keys: CacheKeys,
  ttl: CacheTTL,
  invalidate: CacheInvalidation,
};

export default redisCache;
