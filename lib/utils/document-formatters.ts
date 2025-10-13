/**
 * Document formatting utilities
 * Centralized formatting functions for document display and API responses
 */

/**
 * Format document size in bytes to human-readable format
 */
export function formatDocumentSize(bytes: number | bigint): string {
  const numBytes = typeof bytes === 'bigint' ? Number(bytes) : bytes;

  if (numBytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(numBytes) / Math.log(k));

  const size = numBytes / Math.pow(k, i);
  const formatted = i === 0 ? size.toString() : size.toFixed(2);

  return `${formatted} ${sizes[i]}`;
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
 */
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const seconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)} weeks ago`;
  if (seconds < 31536000) return `${Math.floor(seconds / 2592000)} months ago`;

  return `${Math.floor(seconds / 31536000)} years ago`;
}

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
 * Format view count with abbreviations (e.g., 1.2K, 1.5M)
 */
export function formatViewCount(count: number): string {
  if (count < 1000) return count.toString();
  if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
  return `${(count / 1000000).toFixed(1)}M`;
}

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
export function generateDocumentPreview(content: any, maxLength: number = 200): string {
  try {
    const jsonString = typeof content === 'string'
      ? content
      : JSON.stringify(content, null, 2);

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
export function sanitizeDocumentTitle(title: string | null | undefined, maxLength: number = 100): string {
  if (!title) return 'Untitled Document';

  const sanitized = title.trim();

  if (sanitized.length === 0) return 'Untitled Document';
  if (sanitized.length <= maxLength) return sanitized;

  return sanitized.slice(0, maxLength) + '...';
}
