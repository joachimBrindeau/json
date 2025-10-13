'use client';

import type { JsonValue } from '@/lib/api/types';

export interface JsonStats {
  size: number;
  sizeKB: number;
  sizeMB: number;
  nodeCount: number;
  maxDepth: number;
  complexity: 'Low' | 'Medium' | 'High';
}

export const analyzeJson = (content: string): JsonStats => {
  const size = content.length;
  const sizeKB = size / 1024;
  const sizeMB = sizeKB / 1024;

  let nodeCount = 0;
  let maxDepth = 0;

  try {
    const parsed = JSON.parse(content);

    function traverse(obj: JsonValue, currentDepth = 0): void {
      maxDepth = Math.max(maxDepth, currentDepth);
      nodeCount++;

      if (Array.isArray(obj)) {
        obj.forEach((item) => traverse(item, currentDepth + 1));
      } else if (obj !== null && typeof obj === 'object') {
        Object.values(obj).forEach((value) => traverse(value, currentDepth + 1));
      }
    }

    traverse(parsed);
  } catch (error) {
    // Invalid JSON - return basic stats
  }

  return {
    size,
    sizeKB,
    sizeMB,
    nodeCount,
    maxDepth,
    complexity: nodeCount > 10000 ? 'High' : nodeCount > 1000 ? 'Medium' : 'Low',
  };
};

export const shouldUseOptimizedViewer = (stats: JsonStats): boolean => {
  return stats.nodeCount > 5000 || stats.sizeMB > 2;
};

export const getRecommendedViewer = (stats: JsonStats): string => {
  if (stats.complexity === 'High') return 'Tree View';
  if (stats.complexity === 'Medium') return 'Sea or Tree View';
  return 'Sea Visualization';
};
