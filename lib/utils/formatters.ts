/**
 * Centralized formatting utilities
 * Consolidates duplicate formatting logic across the application
 */

/**
 * Format bytes to human-readable size
 * @param bytes - Number of bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string (e.g., "1.50 KB", "2.30 MB")
 */
export function formatSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  const size = bytes / Math.pow(k, i);
  const formatted = i === 0 ? size.toString() : size.toFixed(decimals);

  return `${formatted} ${sizes[i]}`;
}

/**
 * Format date to relative time string
 * @param date - Date string or Date object
 * @returns Relative time string (e.g., "just now", "2 hours ago", "3 months ago")
 */
export function formatRelativeTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const seconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  // Handle future dates
  if (seconds < 0) return 'in the future';

  // Handle recent times with more granularity
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)} weeks ago`;
  if (seconds < 31536000) return `${Math.floor(seconds / 2592000)} months ago`;

  return `${Math.floor(seconds / 31536000)} years ago`;
}

/**
 * Format date to localized date string
 * @param date - Date string or Date object
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export function formatDate(
  date: string | Date,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = new Date(date);
  return d.toLocaleDateString(undefined, options);
}

/**
 * Format date to ISO string
 * @param date - Date object (defaults to now)
 * @returns ISO 8601 formatted string
 */
export function formatISO(date: Date = new Date()): string {
  return date.toISOString();
}

/**
 * Format number with k/M suffixes for large counts
 * @param count - Number to format
 * @returns Formatted string (e.g., "1.5k", "2.3M")
 */
export function formatCount(count: number): string {
  if (count < 1000) return count.toString();
  if (count < 1000000) return `${(count / 1000).toFixed(1)}k`;
  return `${(count / 1000000).toFixed(1)}M`;
}

/**
 * Format number with locale-specific separators
 * @param value - Number to format
 * @param options - Intl.NumberFormatOptions
 * @returns Formatted number string
 */
export function formatNumber(
  value: number,
  options?: Intl.NumberFormatOptions
): string {
  return value.toLocaleString(undefined, options);
}

/**
 * Format timestamp for display
 * @param date - Date string or Date object
 * @returns Formatted timestamp string
 */
export function formatTimestamp(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleString();
}

/**
 * Format file size for export filenames
 * @param date - Date object (defaults to now)
 * @returns Formatted date for filename (e.g., "2025-10-12")
 */
export function formatDateForFilename(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}
