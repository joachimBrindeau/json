import { createHash } from 'crypto';
import { Readable } from 'stream';
import { config } from '@/lib/config';
import { logger } from '@/lib/logger';
import type { JsonValue } from '@/lib/api/types';

export interface JsonAnalysisResult {
  size: number;
  nodeCount: number;
  maxDepth: number;
  complexity: 'Low' | 'Medium' | 'High';
  checksum: string;
  paths: string[];
  largeArrays: Array<{ path: string; size: number }>;
  deepObjects: Array<{ path: string; depth: number }>;
}

export interface JsonChunkInfo {
  index: number;
  path: string;
  content: JsonValue;
  size: number;
  checksum: string;
}

// Stream-based JSON analysis for large files
export async function analyzeJsonStream(
  jsonContent: string | object,
  options: {
    maxChunkSize?: number;
    trackPaths?: boolean;
    findLargeArrays?: boolean;
  } = {}
): Promise<JsonAnalysisResult> {
  const {
    trackPaths = true,
    findLargeArrays = true,
  } = options;

  let parsed: JsonValue;
  if (typeof jsonContent === 'string') {
    parsed = JSON.parse(jsonContent) as JsonValue;
  } else {
    parsed = jsonContent as JsonValue;
  }

  const analysis: JsonAnalysisResult = {
    size: typeof jsonContent === 'string' ? jsonContent.length : JSON.stringify(jsonContent).length,
    nodeCount: 0,
    maxDepth: 0,
    complexity: 'Low',
    checksum: createHash('sha256')
      .update(typeof jsonContent === 'string' ? jsonContent : JSON.stringify(jsonContent))
      .digest('hex'),
    paths: [],
    largeArrays: [],
    deepObjects: [],
  };

  function traverse(obj: JsonValue, currentPath = '', currentDepth = 0): void {
    analysis.nodeCount++;
    analysis.maxDepth = Math.max(analysis.maxDepth, currentDepth);

    if (trackPaths && currentPath) {
      analysis.paths.push(currentPath);
    }

    if (Array.isArray(obj)) {
      if (findLargeArrays && obj.length > 1000) {
        analysis.largeArrays.push({
          path: currentPath,
          size: obj.length,
        });
      }

      obj.forEach((item, index) => {
        const newPath = currentPath ? `${currentPath}[${index}]` : `[${index}]`;
        traverse(item, newPath, currentDepth + 1);
      });
    } else if (obj !== null && typeof obj === 'object') {
      if (currentDepth > 10) {
        analysis.deepObjects.push({
          path: currentPath,
          depth: currentDepth,
        });
      }

      Object.entries(obj).forEach(([key, value]) => {
        const newPath = currentPath ? `${currentPath}.${key}` : key;
        traverse(value, newPath, currentDepth + 1);
      });
    }
  }

  traverse(parsed);

  // Determine complexity
  if (analysis.nodeCount > 10000 || analysis.maxDepth > 20 || analysis.size > 5 * 1024 * 1024) {
    analysis.complexity = 'High';
  } else if (analysis.nodeCount > 1000 || analysis.maxDepth > 10 || analysis.size > 1024 * 1024) {
    analysis.complexity = 'Medium';
  }

  return analysis;
}

// Chunk large JSON for streaming
export function chunkJsonData(
  jsonData: JsonValue,
  maxChunkSize: number = config.performance.jsonStreamingChunkSize
): JsonChunkInfo[] {
  const chunks: JsonChunkInfo[] = [];

  function processNode(obj: JsonValue, path: string): boolean {
    const serialized = JSON.stringify(obj);
    const size = Buffer.byteLength(serialized, 'utf8');

    if (size <= maxChunkSize) {
      // Small enough to be a single chunk
      chunks.push({
        index: chunks.length,
        path,
        content: obj,
        size,
        checksum: createHash('sha256').update(serialized).digest('hex'),
      });
      return true;
    }

    // Need to split further
    if (Array.isArray(obj)) {
      let currentChunk: JsonValue[] = [];
      let currentSize = 2; // For []

      for (let i = 0; i < obj.length; i++) {
        const item = obj[i];
        const itemSerialized = JSON.stringify(item);
        const itemSize = Buffer.byteLength(itemSerialized, 'utf8');

        if (currentSize + itemSize + 1 > maxChunkSize && currentChunk.length > 0) {
          // Flush current chunk
          const chunkSerialized = JSON.stringify(currentChunk);
          chunks.push({
            index: chunks.length,
            path: `${path}[${i - currentChunk.length}:${i}]`,
            content: currentChunk,
            size: Buffer.byteLength(chunkSerialized, 'utf8'),
            checksum: createHash('sha256').update(chunkSerialized).digest('hex'),
          });
          currentChunk = [];
          currentSize = 2;
        }

        currentChunk.push(item);
        currentSize += itemSize + 1; // +1 for comma
      }

      // Flush remaining
      if (currentChunk.length > 0) {
        const chunkSerialized = JSON.stringify(currentChunk);
        chunks.push({
          index: chunks.length,
          path: `${path}[${obj.length - currentChunk.length}:${obj.length}]`,
          content: currentChunk,
          size: Buffer.byteLength(chunkSerialized, 'utf8'),
          checksum: createHash('sha256').update(chunkSerialized).digest('hex'),
        });
      }
    } else if (obj && typeof obj === 'object') {
      const entries = Object.entries(obj);
      let currentChunk: Record<string, JsonValue> = {};
      let currentSize = 2; // For {}

      for (const [key, value] of entries) {
        const valueSize = Buffer.byteLength(JSON.stringify(value), 'utf8');
        const keySize = Buffer.byteLength(`"${key}":`, 'utf8');

        if (
          currentSize + keySize + valueSize + 1 > maxChunkSize &&
          Object.keys(currentChunk).length > 0
        ) {
          // Flush current chunk
          const chunkSerialized = JSON.stringify(currentChunk);
          chunks.push({
            index: chunks.length,
            path: `${path}.{${Object.keys(currentChunk).join(',')}}`,
            content: currentChunk,
            size: Buffer.byteLength(chunkSerialized, 'utf8'),
            checksum: createHash('sha256').update(chunkSerialized).digest('hex'),
          });
          currentChunk = {};
          currentSize = 2;
        }

        currentChunk[key] = value;
        currentSize += keySize + valueSize + 1;
      }

      // Flush remaining
      if (Object.keys(currentChunk).length > 0) {
        const chunkSerialized = JSON.stringify(currentChunk);
        chunks.push({
          index: chunks.length,
          path: `${path}.{${Object.keys(currentChunk).join(',')}}`,
          content: currentChunk,
          size: Buffer.byteLength(chunkSerialized, 'utf8'),
          checksum: createHash('sha256').update(chunkSerialized).digest('hex'),
        });
      }
    }

    return false;
  }

  processNode(jsonData, '$');
  return chunks;
}

// Create streaming JSON response
export function createJsonStream(data: JsonValue): Readable {
  let index = 0;
  const chunks = chunkJsonData(data);

  return new Readable({
    objectMode: false,
    read() {
      if (index >= chunks.length) {
        this.push(null); // End stream
        return;
      }

      const chunk = chunks[index++];
      const serialized = JSON.stringify({
        index: chunk.index,
        path: chunk.path,
        data: chunk.content,
        size: chunk.size,
        total: chunks.length,
      });

      this.push(serialized + '\n');
    },
  });
}

// Cache management for frequently accessed JSONs
export class JsonCache {
  private static readonly CACHE_PREFIX = 'json:';
  private static readonly ANALYSIS_PREFIX = 'analysis:';
  private static readonly TTL = 3600; // 1 hour

  static async get(key: string): Promise<JsonValue | null> {
    try {
      const { redis } = await import('@/lib/redis');
      if (!redis) return null;
      const cached = await redis.get(this.CACHE_PREFIX + key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      logger.warn({ err: error, key }, 'Redis cache get failed');
      return null;
    }
  }

  static async set(key: string, data: JsonValue, ttl: number = this.TTL): Promise<void> {
    try {
      const { redis } = await import('@/lib/redis');
      if (!redis) return;
      await redis.setex(this.CACHE_PREFIX + key, ttl, JSON.stringify(data));
    } catch (error) {
      logger.warn({ err: error, key, ttl }, 'Redis cache set failed');
    }
  }

  static async getAnalysis(key: string): Promise<JsonAnalysisResult | null> {
    try {
      const { redis } = await import('@/lib/redis');
      if (!redis) return null;
      const cached = await redis.get(this.ANALYSIS_PREFIX + key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      logger.warn({ err: error, key }, 'Redis analysis cache get failed');
      return null;
    }
  }

  static async setAnalysis(
    key: string,
    analysis: JsonAnalysisResult,
    ttl: number = this.TTL
  ): Promise<void> {
    try {
      const { redis } = await import('@/lib/redis');
      if (!redis) return;
      await redis.setex(this.ANALYSIS_PREFIX + key, ttl, JSON.stringify(analysis));
    } catch (error) {
      logger.warn({ err: error, key, ttl }, 'Redis analysis cache set failed');
    }
  }

  static async invalidate(key: string): Promise<void> {
    try {
      const { redis } = await import('@/lib/redis');
      if (!redis) return;
      await redis.del(this.CACHE_PREFIX + key, this.ANALYSIS_PREFIX + key);
    } catch (error) {
      logger.warn({ err: error, key }, 'Redis cache invalidation failed');
    }
  }
}

// Performance monitoring
export function createPerformanceMonitor() {
  const start = process.hrtime.bigint();
  let memStart: NodeJS.MemoryUsage | undefined;

  if (typeof process !== 'undefined' && process.memoryUsage) {
    memStart = process.memoryUsage();
  }

  return {
    end: () => {
      const end = process.hrtime.bigint();
      const duration = Number(end - start) / 1_000_000; // Convert to milliseconds

      let memoryUsage: number | undefined;
      if (memStart && typeof process !== 'undefined' && process.memoryUsage) {
        const memEnd = process.memoryUsage();
        memoryUsage = memEnd.heapUsed - memStart.heapUsed;
      }

      return {
        duration,
        memoryUsage,
        timestamp: Date.now(),
      };
    },
  };
}
