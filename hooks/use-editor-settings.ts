/**
 * Editor Settings Hook
 * Provides type-safe access to centralized editor configuration
 */

import { EDITOR_CONFIG, type EditorConfig } from '@/lib/config/editor-config';

/**
 * Hook to access the complete editor configuration
 *
 * @returns Complete editor configuration object with all settings
 *
 * @example
 * ```tsx
 * const config = useEditorSettings();
 * console.log(config.codemirror.theme);
 * ```
 */
export function useEditorSettings(): EditorConfig {
  return EDITOR_CONFIG;
}
