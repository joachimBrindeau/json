/**
 * Centralized Editor Configuration
 *
 * Single source of truth for all JSON editor settings across the application.
 * This replaces scattered configuration values from:
 * - components/features/editor/json-editor.tsx
 * - hooks/use-monaco-editor.ts
 *
 * @module lib/config/editor-config
 */

export const EDITOR_CONFIG = {
  /**
   * Performance thresholds for editor optimization
   */
  performance: {
    /**
     * File size threshold in bytes for "large file" optimization
     * Files larger than this trigger debounced updates and progressive loading
     * @default 100000 (100KB)
     */
    largeFileThreshold: 100000,

    /**
     * Debounce delays in milliseconds for different file sizes
     */
    debounceMs: {
      /**
       * Debounce delay for small files (< 100KB)
       * Shorter delay for responsive editing experience
       * @default 100
       */
      small: 100,

      /**
       * Debounce delay for large files (>= 100KB)
       * Longer delay to prevent performance issues during typing
       * @default 500
       */
      large: 500,
    },

    /**
     * File size threshold in bytes for progressive loading
     * Files larger than this are loaded in chunks to prevent UI blocking
     * @default 500000 (500KB)
     */
    progressiveLoadThreshold: 500000,
  },

  /**
   * Monaco editor default configuration
   * These are the base settings applied to all editor instances
   */
  monaco: {
    /**
     * Base font size in pixels
     * @default 14
     */
    fontSize: 14,

    /**
     * Line height in pixels
     * @default 20
     */
    lineHeight: 20,

    /**
     * Minimap (code overview) configuration
     */
    minimap: {
      /**
       * Enable minimap by default
       * Provides code overview and quick navigation
       * @default true
       */
      enabled: true,

      /**
       * Maximum column width to show in minimap
       * @default 120
       */
      maxColumn: 120,
    },

    /**
     * Word wrap setting
     * 'on' - wrap at viewport width
     * 'off' - no wrapping
     * 'wordWrapColumn' - wrap at specific column
     * 'bounded' - wrap at min of viewport and wordWrapColumn
     * @default 'on'
     */
    wordWrap: 'on' as const,

    /**
     * Automatically format content when pasting
     * @default true
     */
    formatOnPaste: true,

    /**
     * Format code as user types
     * Disabled by default to avoid interference while editing
     * @default false
     */
    formatOnType: false,

    /**
     * Show line numbers
     * @default true
     */
    lineNumbers: 'on' as const,

    /**
     * Enable code folding controls
     * @default true
     */
    folding: true,

    /**
     * Highlight matching brackets
     * @default 'always'
     */
    matchBrackets: 'always' as const,

    /**
     * Automatically close brackets and quotes
     * @default true
     */
    autoClosingBrackets: 'always' as const,

    /**
     * Automatically close quotes
     * @default true
     */
    autoClosingQuotes: 'always' as const,

    /**
     * Highlight current line
     * @default true
     */
    renderLineHighlight: 'all' as const,

    /**
     * Enable smooth scrolling animation
     * @default true
     */
    smoothScrolling: true,

    /**
     * Cursor blinking style
     * @default 'blink'
     */
    cursorBlinking: 'blink' as const,

    /**
     * Number of spaces for a tab
     * @default 2
     */
    tabSize: 2,

    /**
     * Use spaces instead of tabs
     * @default true
     */
    insertSpaces: true,

    /**
     * Enable suggestions (autocomplete)
     * @default true
     */
    suggestOnTriggerCharacters: true,

    /**
     * Show quick suggestions while typing
     * @default true
     */
    quickSuggestions: true,

    /**
     * Enable parameter hints
     * @default true
     */
    parameterHints: {
      enabled: true,
    },

    /**
     * Render whitespace characters
     * @default 'selection' - only in selection
     */
    renderWhitespace: 'selection' as const,

    /**
     * Enable find widget resize
     * @default true
     */
    find: {
      addExtraSpaceOnTop: false,
      autoFindInSelection: 'never' as const,
      seedSearchStringFromSelection: 'always' as const,
    },
  },
} as const;

/**
 * Type definition for editor configuration
 * Provides type safety when accessing configuration values
 */
export type EditorConfig = typeof EDITOR_CONFIG;

/**
 * Monaco editor theme names
 */
export const EDITOR_THEMES = {
  light: 'json-viewer-light',
  dark: 'json-viewer-dark',
} as const;

/**
 * Determines if a file should use performance optimizations
 *
 * @param fileSize - File size in bytes
 * @returns True if file is considered "large" and needs optimization
 */
export function isLargeFile(fileSize: number): boolean {
  return fileSize > EDITOR_CONFIG.performance.largeFileThreshold;
}

/**
 * Gets the appropriate debounce delay based on file size
 *
 * @param fileSize - File size in bytes
 * @returns Debounce delay in milliseconds
 */
export function getDebounceDelay(fileSize: number): number {
  return isLargeFile(fileSize)
    ? EDITOR_CONFIG.performance.debounceMs.large
    : EDITOR_CONFIG.performance.debounceMs.small;
}

/**
 * Determines if progressive loading should be used
 *
 * @param fileSize - File size in bytes
 * @returns True if progressive loading should be enabled
 */
export function shouldUseProgressiveLoad(fileSize: number): boolean {
  return fileSize > EDITOR_CONFIG.performance.progressiveLoadThreshold;
}

/**
 * Gets Monaco editor options with performance adjustments for file size
 *
 * @param fileSize - File size in bytes
 * @returns Monaco editor options object
 */
export function getEditorOptions(fileSize: number) {
  const baseOptions = EDITOR_CONFIG.monaco;

  // Disable expensive features for very large files
  if (fileSize > 1000000) {
    // 1MB+ - minimal features
    return {
      ...baseOptions,
      minimap: { enabled: false },
      folding: false,
      renderWhitespace: 'none' as const,
      quickSuggestions: false,
      suggestOnTriggerCharacters: false,
    };
  }

  if (fileSize > EDITOR_CONFIG.performance.largeFileThreshold) {
    // 100KB+ - reduced features
    return {
      ...baseOptions,
      minimap: { ...baseOptions.minimap, enabled: false },
    };
  }

  // Small files - all features enabled
  return baseOptions;
}
