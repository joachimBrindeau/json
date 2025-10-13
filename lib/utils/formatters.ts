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

/**
 * Format uptime duration to human-readable string
 * @param seconds - Duration in seconds
 * @returns Formatted duration (e.g., "2d 5h 30m", "5h 30m", "30m")
 * @example
 * formatUptime(3600) // "1h 0m"
 * formatUptime(90061) // "1d 1h 1m"
 */
export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / (24 * 60 * 60));
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((seconds % (60 * 60)) / 60);

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/**
 * Truncate string to specified length with ellipsis
 * @param str - String to truncate
 * @param maxLength - Maximum length before truncation
 * @param suffix - Suffix to append (default: "...")
 * @returns Truncated string
 * @example
 * truncate("Hello World", 8) // "Hello..."
 * truncate("Short", 10) // "Short"
 */
export function truncate(str: string, maxLength: number, suffix: string = '...'): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + suffix;
}

/**
 * Capitalize first letter of string
 * @param str - String to capitalize
 * @returns Capitalized string
 * @example
 * capitalize("hello") // "Hello"
 * capitalize("HELLO") // "HELLO" (only first letter affected)
 */
export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Capitalize first letter of each word
 * @param str - String to title case
 * @returns Title cased string
 * @example
 * titleCase("hello world") // "Hello World"
 * titleCase("hello-world") // "Hello-World"
 */
export function titleCase(str: string): string {
  if (!str) return str;
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Convert string to kebab-case
 * @param str - String to convert
 * @returns Kebab-cased string
 * @example
 * kebabCase("Hello World") // "hello-world"
 * kebabCase("helloWorld") // "hello-world"
 */
export function kebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/**
 * Get initials from name (first 2 chars)
 * @param name - Full name or string
 * @returns Uppercase initials
 * @example
 * getInitials("John Doe") // "JD"
 * getInitials("Alice") // "AL"
 */
export function getInitials(name: string): string {
  if (!name) return '';
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

/**
 * Format percentage with specified decimal places
 * @param value - Decimal value (0-1) or percentage (0-100)
 * @param decimals - Number of decimal places (default: 1)
 * @param isDecimal - Whether value is decimal (0-1) or percentage (0-100)
 * @returns Formatted percentage string with % symbol
 * @example
 * formatPercentage(0.856, 2) // "85.60%"
 * formatPercentage(85.6, 1, false) // "85.6%"
 */
export function formatPercentage(
  value: number,
  decimals: number = 1,
  isDecimal: boolean = true
): string {
  const percentage = isDecimal ? value * 100 : value;
  return `${percentage.toFixed(decimals)}%`;
}

/**
 * Format duration in milliseconds to human-readable string
 * @param ms - Duration in milliseconds
 * @returns Formatted duration string
 * @example
 * formatDuration(1500) // "1.5s"
 * formatDuration(60000) // "1m 0s"
 * formatDuration(3661000) // "1h 1m"
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  return `${minutes}m ${seconds % 60}s`;
}
