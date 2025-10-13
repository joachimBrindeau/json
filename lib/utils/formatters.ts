/**
 * Centralized formatting utilities
 * Consolidates duplicate formatting logic across the application
 */

/**
 * Format bytes to human-readable size
 * @param bytes - Number of bytes
 * @returns Formatted string (e.g., "1.5 KB", "2.3 MB")
 */
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Format date to relative time string
 * @param date - Date string or Date object
 * @returns Relative time string (e.g., "Today", "2 days ago", "3 months ago")
 */
export function formatRelativeTime(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - d.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 1) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;

  return d.toLocaleDateString();
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
