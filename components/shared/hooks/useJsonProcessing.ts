'use client';

import { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { VIEWER_CONFIG } from '@/lib/config/viewer-config';

export interface JsonNode {
  id: string;
  key: string;
  value: any;
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  level: number;
  path: string;
  children?: JsonNode[];
  size: number;
  childCount: number;
}

export interface JsonStats {
  nodeCount: number;
  maxDepth: number;
  size: number;
  parseTime: number;
  type: 'object' | 'array' | 'primitive' | 'null';
  keys: number;
}

export interface JsonValidationResult {
  isValid: boolean;
  error: string | null;
  parsedData: any;
  stats: JsonStats | null;
}

export interface UseJsonProcessingOptions {
  maxNodes?: number;
  enablePerformanceMonitoring?: boolean;
  enableValidation?: boolean;
  enableStructureAnalysis?: boolean;
  expandedNodes?: Set<string>;
}

// Utility functions for JSON processing
export const getValueType = (value: any): JsonNode['type'] => {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  return typeof value as JsonNode['type'];
};

export const estimateSize = (value: any): number => {
  if (value === null) return 4;
  if (typeof value === 'boolean') return 4;
  if (typeof value === 'number') return 8;
  if (typeof value === 'string') return value.length * 2;
  if (Array.isArray(value)) {
    return value.reduce((sum, item) => sum + estimateSize(item), 24);
  }
  if (typeof value === 'object') {
    return Object.entries(value).reduce(
      (sum, [key, val]) => sum + key.length * 2 + estimateSize(val),
      24
    );
  }
  return 0;
};

export const formatJsonValue = (value: any, type: string, maxLength = 50): string => {
  switch (type) {
    case 'string':
      const stringValue = value || '';
      return `"${stringValue.length > maxLength ? stringValue.slice(0, maxLength) + '...' : stringValue}"`;
    case 'object':
      if (value === null || value === undefined) return 'null';
      return `{${Object.keys(value).length} keys}`;
    case 'array':
      if (!value) return '[]';
      return `[${value.length} items]`;
    case 'null':
      return 'null';
    case 'boolean':
      return String(value);
    case 'number':
      return String(value);
    default:
      return String(value || '');
  }
};

export const getTypeColor = (type: string): string => {
  switch (type) {
    case 'object':
      return 'text-blue-600 bg-blue-50';
    case 'array':
      return 'text-green-600 bg-green-50';
    case 'string':
      return 'text-yellow-600 bg-yellow-50';
    case 'number':
      return 'text-purple-600 bg-purple-50';
    case 'boolean':
      return 'text-orange-600 bg-orange-50';
    case 'null':
      return 'text-gray-600 bg-gray-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

export const detectJsonFormat = (jsonString: string): {
  isMinified: boolean;
  indentation: number;
  lineCount: number;
  hasTrailingComma: boolean;
} => {
  const lines = jsonString.split('\n');
  const lineCount = lines.length;
  const isMinified = lineCount === 1;
  
  let indentation = 0;
  let hasTrailingComma = false;
  
  if (!isMinified) {
    // Detect indentation
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && line.length > trimmed.length) {
        const leadingSpaces = line.length - line.trimStart().length;
        if (leadingSpaces > 0) {
          indentation = leadingSpaces;
          break;
        }
      }
    }
    
    // Check for trailing commas
    hasTrailingComma = /,\s*[}\]]/.test(jsonString);
  }
  
  return {
    isMinified,
    indentation: indentation || 2,
    lineCount,
    hasTrailingComma,
  };
};

export const useJsonProcessing = (
  content: string | object,
  options: UseJsonProcessingOptions = {}
) => {
  const {
    maxNodes = VIEWER_CONFIG.performance.maxNodes,
    enablePerformanceMonitoring = true,
    enableValidation = true,
    enableStructureAnalysis = true,
    expandedNodes = new Set(['root']),
  } = options;

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const performanceRef = useRef<number>(0);

  // Validate and parse JSON
  const validation = useMemo((): JsonValidationResult => {
    if (!enableValidation) {
      return {
        isValid: true,
        error: null,
        parsedData: typeof content === 'string' ? JSON.parse(content) : content,
        stats: null,
      };
    }

    const startTime = performance.now();
    
    try {
      const parsed = typeof content === 'string' ? JSON.parse(content) : content;
      const parseTime = performance.now() - startTime;
      
      if (enablePerformanceMonitoring) {
        performanceRef.current = parseTime;
      }

      const contentString = typeof content === 'string' ? content : JSON.stringify(content);
      const size = contentString.length;
      
      const stats: JsonStats = {
        nodeCount: 0,
        maxDepth: 0,
        size,
        parseTime,
        type: getValueType(parsed) as any,
        keys: Array.isArray(parsed)
          ? parsed.length
          : typeof parsed === 'object' && parsed !== null
            ? Object.keys(parsed).length
            : 0,
      };

      return {
        isValid: true,
        error: null,
        parsedData: parsed,
        stats,
      };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Invalid JSON',
        parsedData: null,
        stats: null,
      };
    }
  }, [content, enableValidation, enablePerformanceMonitoring]);

  // Structure analysis and node creation
  const structureAnalysis = useMemo(() => {
    if (!enableStructureAnalysis || !validation.isValid || !validation.parsedData) {
      return {
        flatNodes: [],
        treeStructure: null,
        stats: validation.stats || {
          nodeCount: 0,
          maxDepth: 0,
          size: 0,
          parseTime: 0,
          type: 'null' as const,
          keys: 0,
        },
      };
    }

    const nodes: JsonNode[] = [];
    let nodeCount = 0;
    let maxDepth = 0;
    let totalSize = 0;

    function createNode(value: any, key: string, level: number, path: string): JsonNode {
      const id = path || 'root';
      const type = getValueType(value);
      const size = estimateSize(value);

      totalSize += size;
      nodeCount++;
      maxDepth = Math.max(maxDepth, level);

      let children: JsonNode[] = [];
      let childCount = 0;

      if (type === 'object' && value !== null) {
        const entries = Object.entries(value);
        childCount = entries.length;

        if (expandedNodes.has(id) && entries.length <= 1000) {
          children = entries.map(([k, v]) => createNode(v, k, level + 1, `${path}.${k}`));
        }
      } else if (type === 'array') {
        childCount = value.length;

        if (expandedNodes.has(id) && value.length <= 1000) {
          children = value.map((item: any, index: number) =>
            createNode(item, `[${index}]`, level + 1, `${path}[${index}]`)
          );
        }
      }

      const node: JsonNode = {
        id,
        key: key === 'root' ? 'JSON Root' : key,
        value: type === 'object' || type === 'array' ? undefined : value,
        type,
        level,
        path,
        children,
        size,
        childCount,
      };

      return node;
    }

    const rootNode = createNode(validation.parsedData, 'root', 0, 'root');

    // Flatten for list view
    function flattenTree(node: JsonNode, result: JsonNode[] = []): JsonNode[] {
      result.push(node);

      if (expandedNodes.has(node.id) && node.children) {
        for (const child of node.children) {
          flattenTree(child, result);
        }
      }

      return result;
    }

    const flattened = flattenTree(rootNode);

    const updatedStats: JsonStats = {
      ...validation.stats!,
      nodeCount,
      maxDepth,
      size: totalSize,
    };

    return {
      flatNodes: flattened.slice(0, maxNodes),
      treeStructure: rootNode,
      stats: updatedStats,
    };
  }, [validation, enableStructureAnalysis, expandedNodes, maxNodes]);

  // Search functionality
  const createSearchFilter = useCallback((searchTerm: string) => {
    if (!searchTerm) return () => true;
    
    const lowercaseSearch = searchTerm.toLowerCase();
    
    return (node: JsonNode) => {
      return (
        node.key.toLowerCase().includes(lowercaseSearch) ||
        (node.value && String(node.value).toLowerCase().includes(lowercaseSearch)) ||
        node.path.toLowerCase().includes(lowercaseSearch)
      );
    };
  }, []);

  // Performance calculations
  const performanceMetrics = useMemo(() => {
    if (!enablePerformanceMonitoring || !validation.stats) {
      return {
        parseTime: 0,
        isLarge: false,
        isVeryLarge: false,
        shouldVirtualize: false,
        performanceLevel: 'excellent' as const,
        recommendations: [],
      };
    }

    const { size, parseTime, nodeCount } = validation.stats;
    const sizeMB = size / (1024 * 1024);
    
    const isLarge = sizeMB > 5 || nodeCount > 1000;
    const isVeryLarge = sizeMB > 50 || nodeCount > 10000;
    const shouldVirtualize = sizeMB > 10 || nodeCount > 5000;
    
    let performanceLevel: 'excellent' | 'good' | 'warning' | 'critical' = 'excellent';
    const recommendations: string[] = [];
    
    if (sizeMB > 100 || parseTime > 5000) {
      performanceLevel = 'critical';
      recommendations.push('Consider using virtual scrolling');
      recommendations.push('Enable chunked processing');
    } else if (sizeMB > 20 || parseTime > 2000) {
      performanceLevel = 'warning';
      recommendations.push('Consider virtual scrolling for better performance');
    } else if (sizeMB > 5 || parseTime > 1000) {
      performanceLevel = 'good';
      recommendations.push('Performance optimizations available');
    }
    
    return {
      parseTime,
      isLarge,
      isVeryLarge,
      shouldVirtualize,
      performanceLevel,
      recommendations,
    };
  }, [validation.stats, enablePerformanceMonitoring]);

  // Copy and download utilities
  const copyToClipboard = useCallback(async (data: any = validation.parsedData) => {
    if (!data) throw new Error('No data to copy');
    
    const jsonString = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    await navigator.clipboard.writeText(jsonString);
  }, [validation.parsedData]);

  const downloadAsJson = useCallback((
    data: any = validation.parsedData,
    filename = `json-data-${Date.now()}.json`
  ) => {
    if (!data) throw new Error('No data to download');
    
    const jsonString = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [validation.parsedData]);

  // Format detection
  const formatInfo = useMemo(() => {
    if (!validation.isValid || typeof content !== 'string') {
      return null;
    }
    
    return detectJsonFormat(content);
  }, [content, validation.isValid]);

  return {
    // Core data
    isValid: validation.isValid,
    error: validation.error,
    parsedData: validation.parsedData,
    
    // Structure
    flatNodes: structureAnalysis.flatNodes,
    treeStructure: structureAnalysis.treeStructure,
    
    // Statistics
    stats: structureAnalysis.stats,
    
    // Performance
    performance: performanceMetrics,
    
    // Processing state
    isProcessing,
    processingProgress,
    
    // Utilities
    createSearchFilter,
    copyToClipboard,
    downloadAsJson,
    
    // Format info
    formatInfo,
    
    // Helper functions (exported for reuse)
    formatValue: formatJsonValue,
    getTypeColor,
    formatSize: formatFileSize,
  };
};