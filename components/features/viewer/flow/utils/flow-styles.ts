/**
 * Centralized style constants for Flow components
 *
 * Single source of truth for styling to follow DRY principle
 */

export const FLOW_STYLES = {
  // NodeToolbar styles
  toolbar:
    'flex gap-1 bg-white dark:bg-gray-950 p-1 rounded shadow-lg border border-gray-200 dark:border-gray-800',

  // Toolbar button styles
  toolbarButton: 'p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors',

  // Connection stats container
  connectionStats:
    'flex items-center gap-2 px-2 text-xs text-gray-600 dark:text-gray-400 border-l border-gray-200 dark:border-gray-800',

  // Individual connection stat
  connectionStat: 'flex items-center gap-1',
} as const;
