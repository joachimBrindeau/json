/**
 * Viewer Settings Hook
 * Provides type-safe access to centralized viewer configuration
 */

import { VIEWER_CONFIG, type ViewerConfig } from '@/lib/config/viewer-config';

/**
 * Hook to access the complete viewer configuration
 *
 * @returns Complete viewer configuration object with all settings
 *
 * @example
 * ```tsx
 * const config = useViewerSettings();
 * const threshold = config.performance.renderThreshold;
 * ```
 */
export function useViewerSettings(): ViewerConfig {
  return VIEWER_CONFIG;
}

/**
 * Convenience hook to access only performance-related viewer settings
 *
 * @returns Performance configuration subset
 *
 * @example
 * ```tsx
 * const { renderThreshold, maxVisibleNodes } = usePerformanceSettings();
 * ```
 */
export function usePerformanceSettings() {
  return VIEWER_CONFIG.performance;
}
