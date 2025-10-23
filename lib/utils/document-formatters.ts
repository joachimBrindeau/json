/**
 * Document formatting utilities
 * Centralized formatting functions for document display and API responses
 */

import { formatSize, formatCount } from './formatters';
import type { JsonValue } from '@/lib/api/types';

/**
 * Format document size in bytes to human-readable format
 * Delegates to the general formatSize utility for consistency
 */
export function formatDocumentSize(bytes: number | bigint): string {
  const numBytes = typeof bytes === 'bigint' ? Number(bytes) : bytes;
  return formatSize(numBytes);
}

/**
 * Format document date to human-readable format
 */
export function formatDocumentDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
}

/**
 * Format document date to short format (no time)
 */
export function formatDocumentDateShort(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(dateObj);
}

/**
 * Format relative time (e.g., "2 hours ago")
 * Re-exported from formatters for consistency
 */
export { formatRelativeTime } from './formatters';

/**
 * Validate share ID format
 */
export function isValidShareId(id: string): boolean {
  // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  // Short hash format: 24 hex characters
  const hashRegex = /^[a-f0-9]{24}$/;

  return uuidRegex.test(id) || hashRegex.test(id);
}

/**
 * Format view count with abbreviations (e.g., 1.2k, 1.5M)
 * Uses the general formatCount utility for consistency
 */
export const formatViewCount = formatCount;

/**
 * Format document complexity for display
 */
export function formatComplexity(complexity: 'Low' | 'Medium' | 'High'): {
  label: string;
  color: string;
  description: string;
} {
  const complexityMap = {
    Low: {
      label: 'Low',
      color: 'green',
      description: 'Simple structure, < 100 nodes',
    },
    Medium: {
      label: 'Medium',
      color: 'yellow',
      description: 'Moderate structure, 100-1000 nodes',
    },
    High: {
      label: 'High',
      color: 'red',
      description: 'Complex structure, > 1000 nodes',
    },
  };

  return complexityMap[complexity];
}

/**
 * Generate document preview from content
 */
export function generateDocumentPreview(content: JsonValue, maxLength: number = 200): string {
  try {
    const jsonString = typeof content === 'string' ? content : JSON.stringify(content, null, 2);

    if (jsonString.length <= maxLength) {
      return jsonString;
    }

    return jsonString.slice(0, maxLength) + '...';
  } catch (error) {
    return 'Invalid JSON content';
  }
}

/**
 * Format document statistics for display
 */
export function formatDocumentStats(doc: {
  size: number | bigint;
  nodeCount?: number;
  maxDepth?: number;
  viewCount?: number;
}) {
  return {
    size: formatDocumentSize(doc.size),
    nodes: doc.nodeCount?.toLocaleString() || '0',
    depth: doc.maxDepth?.toString() || '0',
    views: doc.viewCount ? formatViewCount(doc.viewCount) : '0',
  };
}

/**
 * Sanitize document title for display
 */
export function sanitizeDocumentTitle(
  title: string | null | undefined,
  maxLength: number = 100
): string {
  if (!title) return 'Untitled Document';

  const sanitized = title.trim();

  if (sanitized.length === 0) return 'Untitled Document';
  if (sanitized.length <= maxLength) return sanitized;

  return sanitized.slice(0, maxLength) + '...';
}
