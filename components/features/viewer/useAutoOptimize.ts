/**
 * Auto-optimization hook - determines if virtualization is needed
 */

import { useMemo } from 'react';
import {
  getPerformanceLevel,
  shouldVirtualize as shouldVirtualizeHelper,
  type PerformanceLevel,
} from '@/lib/config/viewer-config';

interface OptimizationResult {
  shouldVirtualize: boolean;
  estimatedNodes: number;
  performanceLevel: PerformanceLevel;
}

export const useAutoOptimize = (
  jsonString: string,
  data: any,
  maxNodes?: number
): OptimizationResult => {
  return useMemo(() => {
    if (!data) {
      return {
        shouldVirtualize: false,
        estimatedNodes: 0,
        performanceLevel: 'excellent' as PerformanceLevel,
      };
    }

    const size = jsonString.length;
    const sizeMB = size / (1024 * 1024);

    // Estimate node count
    const estimatedNodes = estimateNodeCount(data);

    // Use centralized config with optional override
    const shouldVirtualize = shouldVirtualizeHelper(sizeMB, estimatedNodes);
    const performanceLevel = getPerformanceLevel(sizeMB, estimatedNodes);

    return {
      shouldVirtualize,
      estimatedNodes,
      performanceLevel,
    };
  }, [jsonString, data, maxNodes]);
};

// Helper to estimate node count
function estimateNodeCount(obj: any, maxDepth = 10, currentDepth = 0): number {
  if (currentDepth > maxDepth) return 1;

  if (Array.isArray(obj)) {
    return (
      1 +
      obj.reduce(
        (sum: number, item: any) => sum + estimateNodeCount(item, maxDepth, currentDepth + 1),
        0
      )
    );
  }

  if (obj && typeof obj === 'object') {
    return (
      1 +
      Object.values(obj).reduce(
        (sum: number, value: any) => sum + estimateNodeCount(value, maxDepth, currentDepth + 1),
        0
      )
    );
  }

  return 1;
}
