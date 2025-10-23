'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { OnMount, Monaco } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { defineMonacoThemes } from '@/lib/editor/themes';
import { getOptimizedMonacoOptions } from '@/lib/editor/optimizations';
import { logger } from '@/lib/logger';

/**
 * Monaco editor options configuration
 */
export interface MonacoEditorOptions {
  /** Whether to enable minimap (default: false) */
  minimap?: boolean;
  /** Font size in pixels (default: 14) */
  fontSize?: number;
  /** Tab size for indentation (default: 2) */
  tabSize?: number;
  /** Whether to enable line numbers (default: 'on') */
  lineNumbers?: 'on' | 'off' | 'relative' | 'interval';
  /** Word wrap configuration (default: 'on') */
  wordWrap?: 'off' | 'on' | 'wordWrapColumn' | 'bounded';
  /** Whether the editor is read-only (default: false) */
  readOnly?: boolean;
}

/**
 * Return type for the Monaco editor hook
 */
export interface UseMonacoEditorReturn {
  /** Reference to the Monaco editor instance */
  editorRef: React.MutableRefObject<editor.IStandaloneCodeEditor | null>;
  /** Reference to the Monaco API instance */
  monacoRef: React.MutableRefObject<Monaco | null>;
  /** Handler for editor mount event */
  handleEditorDidMount: OnMount;
  /** Computed editor options based on configuration and dark mode */
  editorOptions: editor.IStandaloneEditorConstructionOptions;
  /** Current dark mode state */
  isDarkMode: boolean;
  /** Current theme name for Monaco */
  theme: string;
  /** Editor initialization error, if any */
  editorError: string | null;
}

/**
 * Hook for Monaco editor initialization and configuration
 *
 * Provides:
 * - Dark mode detection and theme switching
 * - Optimized editor options based on content size
 * - Custom theme registration (shadcn-dark, shadcn-light)
 * - Editor and Monaco API references
 * - Error handling for editor initialization
 *
 * @param contentLength - Length of content to optimize editor performance
 * @param options - Optional editor configuration overrides
 * @returns Monaco editor configuration and utilities
 *
 * @example
 * ```tsx
 * const { editorRef, handleEditorDidMount, editorOptions, theme } = useMonacoEditor(
 *   content.length,
 *   { minimap: true, fontSize: 16 }
 * );
 *
 * <MonacoEditor
 *   theme={theme}
 *   options={editorOptions}
 *   onMount={handleEditorDidMount}
 * />
 * ```
 */
export function useMonacoEditor(
  contentLength: number = 0,
  options: MonacoEditorOptions = {}
): UseMonacoEditorReturn {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);

  // Detect dark mode and watch for changes
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    };

    checkDarkMode();

    // Listen for dark mode changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  // Update Monaco theme when dark mode changes
  useEffect(() => {
    if (monacoRef.current && editorRef.current) {
      const theme = isDarkMode ? 'shadcn-dark' : 'shadcn-light';
      monacoRef.current.editor.setTheme(theme);
    }
  }, [isDarkMode]);

  // Handle editor mount
  const handleEditorDidMount: OnMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor;
      monacoRef.current = monaco;

      // Expose editor instance for E2E/tests convenience (no-op in SSR)
      try {
        if (typeof window !== 'undefined') {
          (window as any).monacoEditorInstance = editor;
          // Also ensure a minimal global monaco API reference for test helpers
          const w = window as any;
          w.monaco = w.monaco || monaco;
        }
      } catch {}

      try {
        // Define custom themes immediately
        defineMonacoThemes(monaco);

        // Set the correct theme based on current dark mode state
        const currentTheme = isDarkMode ? 'shadcn-dark' : 'shadcn-light';
        monaco.editor.setTheme(currentTheme);

        // Use optimized options based on content size
        const optimizedOptions = getOptimizedMonacoOptions(contentLength);
        editor.updateOptions(optimizedOptions);

        setEditorError(null);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to initialize editor';
        setEditorError(errorMessage);
        logger.error({ err: error }, 'Monaco editor initialization error');
      }
    },
    [contentLength, isDarkMode]
  );

  // Compute editor options
  const editorOptions = useMemo<editor.IStandaloneEditorConstructionOptions>(() => {
    const baseOptions: editor.IStandaloneEditorConstructionOptions = {
      automaticLayout: true,
      scrollBeyondLastLine: false,
      wordWrap: options.wordWrap || 'on',
      minimap: { enabled: options.minimap ?? false },
      fontSize: options.fontSize || 14,
      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", monospace',
      tabSize: options.tabSize || 2,
      insertSpaces: true,
      formatOnPaste: true,
      formatOnType: false,
      lineNumbers: options.lineNumbers || 'on',
      renderLineHighlight: 'line',
      scrollbar: {
        vertical: 'visible',
        horizontal: 'visible',
      },
      contextmenu: true,
      selectOnLineNumbers: true,
      roundedSelection: false,
      readOnly: options.readOnly ?? false,
      cursorStyle: 'line',
      suggestOnTriggerCharacters: true,
      acceptSuggestionOnEnter: 'on',
      autoClosingBrackets: 'always',
      autoClosingQuotes: 'always',
      folding: true,
      foldingStrategy: 'indentation',
      showFoldingControls: 'always',
      renderWhitespace: 'none',
      dragAndDrop: true,
      links: true,
      colorDecorators: true,
    };

    return baseOptions;
  }, [options]);

  const theme = isDarkMode ? 'shadcn-dark' : 'shadcn-light';

  return {
    editorRef,
    monacoRef,
    handleEditorDidMount,
    editorOptions,
    isDarkMode,
    theme,
    editorError,
  };
}
