/**
 * Auto-optimization hook - determines if virtualization is needed
 */

import { useMemo } from 'react';

interface OptimizationResult {
  shouldVirtualize: boolean;
  estimatedNodes: number;
  performanceLevel: 'excellent' | 'good' | 'warning' | 'critical';
}

export const useAutoOptimize = (jsonString: string, data: any): OptimizationResult => {
  return useMemo(() => {
    if (!data) {
      return {
        shouldVirtualize: false,
        estimatedNodes: 0,
        performanceLevel: 'excellent',
      };
    }

    const size = jsonString.length;
    const sizeMB = size / (1024 * 1024);

    // Estimate node count
    const estimatedNodes = estimateNodeCount(data);

    // Determine if virtualization is needed
    const shouldVirtualize = 
      sizeMB > 1 ||           // > 1MB
      estimatedNodes > 1000;  // > 1000 nodes

    // Performance level
    let performanceLevel: OptimizationResult['performanceLevel'] = 'excellent';
    if (sizeMB > 100 || estimatedNodes > 50000) {
      performanceLevel = 'critical';
    } else if (sizeMB > 20 || estimatedNodes > 10000) {
      performanceLevel = 'warning';
    } else if (sizeMB > 5 || estimatedNodes > 5000) {
      performanceLevel = 'good';
    }

    return {
      shouldVirtualize,
      estimatedNodes,
      performanceLevel,
    };
  }, [jsonString, data]);
};

// Helper to estimate node count
function estimateNodeCount(obj: any, maxDepth = 10, currentDepth = 0): number {
  if (currentDepth > maxDepth) return 1;
  
  if (Array.isArray(obj)) {
    return 1 + obj.reduce((sum, item) => 
      sum + estimateNodeCount(item, maxDepth, currentDepth + 1), 0
    );
  }
  
  if (obj && typeof obj === 'object') {
    return 1 + Object.values(obj).reduce((sum, value) => 
      sum + estimateNodeCount(value, maxDepth, currentDepth + 1), 0
    );
  }
  
  return 1;
}

