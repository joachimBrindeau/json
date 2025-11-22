'use client';

import type { JsonValue } from '@/lib/api/types';

// KISS approach for handling very large JSONs
// YAGNI: Only what's needed for performance

interface LargeJsonConfig {
  maxMemoryMB: number;
  chunkSizeMB: number;
  virtualScrollThreshold: number;
  lazyLoadThreshold: number;
}

const DEFAULT_CONFIG: LargeJsonConfig = {
  maxMemoryMB: 100, // Max 100MB in memory
  chunkSizeMB: 2, // 2MB chunks for better performance
  virtualScrollThreshold: 500, // Virtual scroll after 500 items for better responsiveness
  lazyLoadThreshold: 5000, // Lazy load after 5k items for faster initial render
};

export class LargeJsonHandler {
  private config: LargeJsonConfig;
  private chunks: Map<string, JsonValue> = new Map();
  private metadata: Map<string, { size: number; type: string; count: number }> = new Map();

  constructor(config: Partial<LargeJsonConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // Fast size estimation without full parsing
  estimateSize(jsonString: string): number {
    return new Blob([jsonString]).size;
  }

  // Check if JSON needs special handling
  isLarge(jsonString: string): boolean {
    const sizeMB = this.estimateSize(jsonString) / (1024 * 1024);
    return sizeMB > 5; // 5MB threshold for large JSON handling
  }

  // Check if JSON is extremely large and needs aggressive optimization
  isVeryLarge(jsonString: string): boolean {
    const sizeMB = this.estimateSize(jsonString) / (1024 * 1024);
    return sizeMB > 50; // 50MB threshold for very large JSON
  }

  // Stream parse large JSON with memory limits
  async parseStream(jsonString: string): Promise<{
    data: JsonValue;
    isChunked: boolean;
    stats: { size: number; chunks: number; parseTime: number };
  }> {
    const start = performance.now();
    const size = this.estimateSize(jsonString);
    const sizeMB = size / (1024 * 1024);

    // Small JSON - parse normally
    if (sizeMB <= this.config.chunkSizeMB) {
      try {
        const data = JSON.parse(jsonString);
        return {
          data,
          isChunked: false,
          stats: { size, chunks: 1, parseTime: performance.now() - start },
        };
      } catch (error) {
        throw new Error(`JSON parse failed: ${error}`);
      }
    }

    // Large JSON - chunk it
    return this.parseInChunks(jsonString, size, start);
  }

  private async parseInChunks(jsonString: string, size: number, start: number) {
    const chunkSize = this.config.chunkSizeMB * 1024 * 1024;
    const chunks: string[] = [];

    // Split into chunks
    for (let i = 0; i < jsonString.length; i += chunkSize) {
      chunks.push(jsonString.slice(i, i + chunkSize));
    }

    // Try to parse first chunk to get structure
    try {
      const firstChunk = chunks[0];
      const partial = JSON.parse(firstChunk);

      return {
        data: {
          __chunked: true,
          __preview: this.createPreview(partial),
          __loadChunk: (index: number) => this.loadChunk(chunks, index),
          __totalChunks: chunks.length,
          __originalSize: size,
        } as any,
        isChunked: true,
        stats: {
          size,
          chunks: chunks.length,
          parseTime: performance.now() - start,
        },
      };
    } catch {
      // Fallback: stream parse with limits
      return this.streamParseWithLimits(jsonString, size, start);
    }
  }

  private async streamParseWithLimits(jsonString: string, size: number, start: number) {
    const MAX_DEPTH = 10;
    const MAX_ARRAY_ITEMS = 100;
    const MAX_OBJECT_PROPS = 100;

    try {
      const result = await this.limitedParse(
        jsonString,
        MAX_DEPTH,
        MAX_ARRAY_ITEMS,
        MAX_OBJECT_PROPS
      );

      return {
        data: result,
        isChunked: true,
        stats: {
          size,
          chunks: 1,
          parseTime: performance.now() - start,
        },
      };
    } catch (error) {
      throw new Error(`Large JSON parsing failed: ${error}`);
    }
  }

  private async limitedParse(
    jsonString: string,
    maxDepth: number,
    maxArrayItems: number,
    maxObjectProps: number
  ): Promise<JsonValue> {
    return new Promise((resolve, reject) => {
      try {
        let currentDepth = 0;

        const parsed = JSON.parse(jsonString, (key, value) => {
          // Track depth to prevent stack overflow
          if (key === '') currentDepth = 0;
          else currentDepth++;

          if (currentDepth > maxDepth) {
            return { __truncated: `... (max depth ${maxDepth} exceeded)` };
          }

          // Limit array size with progressive loading hint
          if (Array.isArray(value) && value.length > maxArrayItems) {
            const truncated = [
              ...value.slice(0, maxArrayItems),
              {
                __truncated: `... ${value.length - maxArrayItems} more items`,
                __loadMore: true,
                __totalLength: value.length,
                __loadedLength: maxArrayItems,
              },
            ];
            return truncated;
          }

          // Limit object properties with progressive loading hint
          if (value && typeof value === 'object' && !Array.isArray(value) && value !== null) {
            const keys = Object.keys(value);
            if (keys.length > maxObjectProps) {
              const limited: Record<string, JsonValue> = {};
              keys.slice(0, maxObjectProps).forEach((k) => {
                limited[k] = value[k];
              });
              limited.__truncated = `... ${keys.length - maxObjectProps} more properties`;
              limited.__loadMore = true;
              limited.__totalKeys = keys.length;
              limited.__loadedKeys = maxObjectProps;
              return limited;
            }
          }

          return value;
        });

        resolve(parsed);
      } catch (error) {
        reject(error);
      }
    });
  }

  private createPreview(data: JsonValue): JsonValue {
    if (Array.isArray(data)) {
      return {
        type: 'array',
        length: data.length,
        sample: data.slice(0, 3),
        preview: `Array[${data.length}]`,
      };
    } else if (data && typeof data === 'object') {
      const keys = Object.keys(data);
      const sampleKeys = keys.slice(0, 5);
      const sample: Record<string, JsonValue> = {};
      sampleKeys.forEach((key) => {
        sample[key] = this.summarizeValue(data[key]);
      });

      return {
        type: 'object',
        keyCount: keys.length,
        keys: sampleKeys,
        sample,
        preview: `Object{${keys.length} keys}`,
      };
    } else {
      return { type: typeof data, value: data, preview: String(data).slice(0, 100) };
    }
  }

  private summarizeValue(value: JsonValue): JsonValue {
    if (Array.isArray(value)) {
      return `Array[${value.length}]`;
    } else if (value && typeof value === 'object') {
      return `Object{${Object.keys(value).length} keys}`;
    } else if (typeof value === 'string' && value.length > 50) {
      return value.slice(0, 50) + '...';
    } else {
      return value;
    }
  }

  private async loadChunk(chunks: string[], index: number): Promise<JsonValue | null> {
    if (index >= chunks.length) return null;

    try {
      return JSON.parse(chunks[index]);
    } catch (error) {
      return { __error: `Chunk ${index} parse failed: ${error}` };
    }
  }

  // Get memory usage estimate
  getMemoryUsage(): { used: number; limit: number; percentage: number } {
    const used = this.chunks.size * 5; // Rough estimate: 5MB per chunk
    const limit = this.config.maxMemoryMB;
    return {
      used,
      limit,
      percentage: (used / limit) * 100,
    };
  }

  // Clear memory
  clearCache(): void {
    this.chunks.clear();
    this.metadata.clear();
  }

  // Check if should use virtual scrolling
  shouldVirtualize(data: JsonValue): boolean {
    const nodeCount = this.countNodes(data);
    return nodeCount > this.config.virtualScrollThreshold;
  }

  // Check if should lazy load
  shouldLazyLoad(data: JsonValue): boolean {
    const nodeCount = this.countNodes(data);
    return nodeCount > this.config.lazyLoadThreshold;
  }

  // Count total nodes for better performance decisions
  private countNodes(data: JsonValue, maxCount = 10000, currentCount = 0): number {
    if (currentCount >= maxCount) return currentCount;

    if (Array.isArray(data)) {
      let count = currentCount + 1;
      for (let i = 0; i < Math.min(data.length, 100); i++) {
        count = this.countNodes(data[i], maxCount, count);
        if (count >= maxCount) break;
      }
      // Estimate remaining if array is large
      if (data.length > 100) {
        count += Math.min((data.length - 100) * (count / 100), maxCount - count);
      }
      return Math.min(count, maxCount);
    } else if (data && typeof data === 'object' && data !== null) {
      let count = currentCount + 1;
      const keys = Object.keys(data);
      for (let i = 0; i < Math.min(keys.length, 100); i++) {
        count = this.countNodes(data[keys[i]], maxCount, count);
        if (count >= maxCount) break;
      }
      // Estimate remaining if object is large
      if (keys.length > 100) {
        count += Math.min((keys.length - 100) * (count / 100), maxCount - count);
      }
      return Math.min(count, maxCount);
    }

    return currentCount + 1;
  }

  // Performance optimization: detect JSON patterns for better handling
  analyzeJsonStructure(data: JsonValue): {
    isHomogeneous: boolean;
    primaryType: string;
    estimatedSize: number;
    depth: number;
    hasLargearrays: boolean;
    hasLargeObjects: boolean;
  } {
    const analysis = {
      isHomogeneous: true,
      primaryType: Array.isArray(data) ? 'array' : typeof data,
      estimatedSize: this.estimateObjectSize(data),
      depth: this.calculateDepth(data),
      hasLargearrays: false,
      hasLargeObjects: false,
    };

    this.analyzeStructureRecursive(data, analysis, 0, new Set());
    return analysis;
  }

  private analyzeStructureRecursive(
    data: JsonValue,
    analysis: Record<string, unknown>,
    depth: number,
    visited: Set<JsonValue>
  ): void {
    if (depth > 10 || visited.has(data)) return;

    if (data && typeof data === 'object') {
      visited.add(data);

      if (Array.isArray(data)) {
        if (data.length > 1000) analysis.hasLargearrays = true;

        // Check homogeneity in arrays
        if (data.length > 0) {
          const firstType = typeof data[0];
          for (let i = 1; i < Math.min(data.length, 10); i++) {
            if (typeof data[i] !== firstType) {
              analysis.isHomogeneous = false;
              break;
            }
          }
        }

        // Recursive analysis on sample items
        for (let i = 0; i < Math.min(data.length, 5); i++) {
          this.analyzeStructureRecursive(data[i], analysis, depth + 1, visited);
        }
      } else {
        const keys = Object.keys(data);
        if (keys.length > 500) analysis.hasLargeObjects = true;

        // Recursive analysis on sample properties
        for (let i = 0; i < Math.min(keys.length, 5); i++) {
          this.analyzeStructureRecursive(data[keys[i]], analysis, depth + 1, visited);
        }
      }
    }
  }

  private calculateDepth(data: JsonValue, maxDepth = 20, currentDepth = 0): number {
    if (currentDepth >= maxDepth || !data || typeof data !== 'object') {
      return currentDepth;
    }

    let maxChildDepth = currentDepth;

    if (Array.isArray(data)) {
      for (let i = 0; i < Math.min(data.length, 10); i++) {
        const childDepth = this.calculateDepth(data[i], maxDepth, currentDepth + 1);
        maxChildDepth = Math.max(maxChildDepth, childDepth);
      }
    } else {
      const keys = Object.keys(data);
      for (let i = 0; i < Math.min(keys.length, 10); i++) {
        const childDepth = this.calculateDepth(data[keys[i]], maxDepth, currentDepth + 1);
        maxChildDepth = Math.max(maxChildDepth, childDepth);
      }
    }

    return maxChildDepth;
  }

  private estimateObjectSize(data: JsonValue): number {
    try {
      return JSON.stringify(data).length;
    } catch {
      return 0;
    }
  }
}

// Singleton instance
export const largeJsonHandler = new LargeJsonHandler();
