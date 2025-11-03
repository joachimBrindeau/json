/**
 * Centralized Viewer Configuration
 *
 * Single source of truth for all JSON viewer settings across the application.
 * This replaces scattered configuration values from:
 * - app/page.tsx
 * - components/features/viewer/useAutoOptimize.ts
 * - public/json-worker.js
 * - components/shared/hooks/useJsonProcessing.ts
 *
 * @module lib/config/viewer-config
 */

export const VIEWER_CONFIG = {
  /**
   * Performance thresholds for JSON processing and rendering
   */
  performance: {
    /**
     * Maximum number of nodes before triggering optimization strategies
     * Used as the primary threshold across all viewer components
     * @default 1000
     */
    maxNodes: 1000,

    /**
     * Threshold for enabling virtualization (windowing) to improve rendering
     * When node count exceeds this, only visible nodes are rendered
     * @default 100
     */
    virtualizeThreshold: 100,

    /**
     * File size in MB that's considered "large" - triggers optimization
     * @default 1
     */
    largeFileSizeMB: 1,

    /**
     * Critical file size threshold in MB - maximum safe size before warnings
     * @default 100
     */
    criticalSizeMB: 100,

    /**
     * Warning threshold in MB - user should be cautious but processing is safe
     * @default 20
     */
    warningSizeMB: 20,

    /**
     * "Good" performance threshold in MB - optimal processing speed
     * @default 5
     */
    goodSizeMB: 5,

    /**
     * Critical node count threshold - triggers aggressive optimization
     * @default 50000
     */
    criticalNodeCount: 50000,

    /**
     * Warning node count threshold - processing may slow down
     * @default 10000
     */
    warningNodeCount: 10000,

    /**
     * Good node count threshold - optimal performance range
     * @default 5000
     */
    goodNodeCount: 5000,

    /**
     * Node count threshold for enabling virtualization in all views
     * @default 1000
     */
    virtualizeNodeCount: 1000,
  },

  /**
   * Tree view specific configuration
   */
  tree: {
    /**
     * Default height for tree view container in pixels
     * @default 600
     */
    defaultHeight: 600,

    /**
     * Maximum depth to traverse in JSON tree before truncating
     * Prevents infinite recursion and stack overflow
     * @default 50
     */
    maxDepth: 50,
  },

  /**
   * Flow (diagram) view specific configuration
   */
  flow: {
    /**
     * Default height for flow view container in pixels
     * @default 600
     */
    defaultHeight: 600,

    /**
     * Maximum nodes to display per level in flow diagram
     * Prevents overcrowding at any single depth level
     * @default 100
     */
    maxNodesPerLevel: 100,
  },

  /**
   * List view specific configuration
   */
  list: {
    /**
     * Default height for list view container in pixels
     * @default 600
     */
    defaultHeight: 600,

    /**
     * Height of each item in the list view for virtualization calculations
     * Used by react-window for rendering performance
     * @default 48
     */
    itemHeight: 48,
  },

  /**
   * Web Worker configuration for background JSON processing
   */
  worker: {
    /**
     * Maximum depth to process in worker thread
     * Prevents worker from hanging on deeply nested structures
     * @default 10
     */
    maxDepth: 10,

    /**
     * Maximum nodes to process per level in worker
     * Aligns with flow view constraints
     * @default 100
     */
    maxNodesPerLevel: 100,

    /**
     * Enable node clustering for massive datasets
     * Groups similar nodes together to reduce rendering overhead
     * @default true
     */
    enableClustering: true,

    /**
     * Number of nodes to include in each cluster
     * @default 50
     */
    clusterSize: 50,

    /**
     * Maximum total nodes to process before truncation
     * Hard limit to prevent memory issues with extremely large datasets
     * @default 10000
     */
    maxTotalNodes: 10000,

    /**
     * Chunk size for progressive rendering
     * Number of nodes/edges to send in each chunk
     * @default 500
     */
    chunkSize: 500,
  },
} as const;

/**
 * Type definition for viewer configuration
 * Provides type safety when accessing configuration values
 */
export type ViewerConfig = typeof VIEWER_CONFIG;

/**
 * Performance level based on file metrics
 */
export type PerformanceLevel = 'excellent' | 'good' | 'warning' | 'critical';

/**
 * Calculates performance level based on file size and node count
 *
 * @param sizeMB - File size in megabytes
 * @param nodeCount - Total number of nodes in JSON structure
 * @returns Performance level indicator
 */
export function getPerformanceLevel(sizeMB: number, nodeCount: number): PerformanceLevel {
  const { performance } = VIEWER_CONFIG;

  if (sizeMB > performance.criticalSizeMB || nodeCount > performance.criticalNodeCount) {
    return 'critical';
  }

  if (sizeMB > performance.warningSizeMB || nodeCount > performance.warningNodeCount) {
    return 'warning';
  }

  if (sizeMB > performance.goodSizeMB || nodeCount > performance.goodNodeCount) {
    return 'good';
  }

  return 'excellent';
}

/**
 * Determines if virtualization should be enabled based on metrics
 *
 * @param sizeMB - File size in megabytes
 * @param nodeCount - Total number of nodes in JSON structure
 * @returns True if virtualization should be enabled
 */
export function shouldVirtualize(sizeMB: number, nodeCount: number): boolean {
  const { performance } = VIEWER_CONFIG;

  return sizeMB > performance.largeFileSizeMB || nodeCount > performance.virtualizeNodeCount;
}
