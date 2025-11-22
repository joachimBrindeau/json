'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { OnMount, Monaco } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { defineMonacoThemes } from '@/lib/editor/themes';
import { getOptimizedMonacoOptions } from '@/lib/editor/optimizations';
import { configureMonacoLoader, waitForMonacoReady } from '@/lib/editor/monaco-loader';
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
  const [isMonacoReady, setIsMonacoReady] = useState(false);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const initializationRetryCount = useRef(0);
  const maxRetries = 3;

  // Configure Monaco loader on mount
  useEffect(() => {
    let isMounted = true;

    const initializeMonaco = async () => {
      try {
        await configureMonacoLoader();
        await waitForMonacoReady();
        if (isMounted) {
          setIsMonacoReady(true);
          setEditorError(null);
          initializationRetryCount.current = 0;
        }
      } catch (error) {
        if (isMounted) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to initialize Monaco loader';
          logger.error({ err: error, retryCount: initializationRetryCount.current }, 'Monaco loader initialization error');
          
          // Retry initialization
          if (initializationRetryCount.current < maxRetries) {
            initializationRetryCount.current += 1;
            setTimeout(() => {
              if (isMounted) {
                initializeMonaco();
              }
            }, 1000 * initializationRetryCount.current); // Exponential backoff
          } else {
            setEditorError(errorMessage);
            setIsMonacoReady(false);
          }
        }
      }
    };

    initializeMonaco();

    return () => {
      isMounted = false;
    };
  }, []);

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
    if (monacoRef.current?.editor && typeof monacoRef.current.editor.setTheme === 'function' && editorRef.current) {
      const theme = isDarkMode ? 'shadcn-dark' : 'shadcn-light';
      monacoRef.current.editor.setTheme(theme);
    }
  }, [isDarkMode]);

  // Handle editor mount
  const handleEditorDidMount: OnMount = useCallback(
    async (editor, monaco) => {
      // Guard: Ensure monaco is fully initialized
      if (!monaco || !monaco.editor) {
        // Wait a bit and retry if Monaco isn't ready yet
        if (!isMonacoReady) {
          logger.warn('Monaco not ready on mount, waiting...');
          try {
            await waitForMonacoReady();
            // Monaco should be ready now, but we need to check again
            if (!monaco || !monaco.editor) {
              setEditorError('Monaco editor not fully initialized after wait');
              logger.error({ monaco }, 'Monaco instance still undefined after wait');
              return;
            }
          } catch (error) {
            setEditorError('Monaco editor failed to initialize');
            logger.error({ err: error }, 'Monaco initialization failed');
            return;
          }
        } else {
          setEditorError('Monaco editor not fully initialized');
          logger.error({ monaco }, 'Monaco instance is undefined or incomplete');
          return;
        }
      }

      editorRef.current = editor;
      monacoRef.current = monaco;

      // Expose editor instance for E2E/tests convenience (no-op in SSR)
      try {
        if (typeof window !== 'undefined') {
          (window as any).monacoEditorInstance = editor;
          // Also ensure a minimal global monaco API reference for test helpers
          const w = window as any;
          // Only set if monaco is fully initialized
          if (monaco && monaco.editor) {
            w.monaco = monaco;
          }

          // Maintain a global registry of editors to facilitate E2E tests and utilities
          w.__monacoEditors = w.__monacoEditors || [];
          // Avoid duplicates if the same instance is mounted twice
          if (!w.__monacoEditors.includes(editor)) {
            w.__monacoEditors.push(editor);
          }
          // Provide a stable getter for tests: window.getMonacoEditors()
          w.getMonacoEditors = w.getMonacoEditors || (() => w.__monacoEditors);
          // Also expose under monaco.editor.getEditors if not present (testing convenience only)
          if (w.monaco?.editor && typeof w.monaco.editor.getEditors !== 'function') {
            w.monaco.editor.getEditors = () => w.__monacoEditors;
          }
        }
      } catch (error) {
        logger.warn({ err: error }, 'Error exposing Monaco editor for tests');
      }

      try {
        // Ensure Monaco is fully ready before proceeding
        await waitForMonacoReady();

        // Define custom themes immediately - guard against undefined monaco
        if (monaco && monaco.editor) {
          const themesDefined = defineMonacoThemes(monaco);
          if (!themesDefined) {
            logger.warn('Failed to define Monaco themes, retrying...');
            // Retry theme definition after a short delay
            setTimeout(() => {
              if (monaco && monaco.editor) {
                defineMonacoThemes(monaco);
              }
            }, 100);
          }

          // Set the correct theme based on current dark mode state
          const currentTheme = isDarkMode ? 'shadcn-dark' : 'shadcn-light';
          try {
            monaco.editor.setTheme(currentTheme);
          } catch (themeError) {
            logger.warn({ err: themeError }, 'Failed to set theme, will retry');
            // Retry theme setting after themes are defined
            setTimeout(() => {
              if (monaco && monaco.editor) {
                try {
                  monaco.editor.setTheme(currentTheme);
                } catch (e) {
                  logger.error({ err: e }, 'Failed to set theme on retry');
                }
              }
            }, 200);
          }

          // Use optimized options based on content size
          const optimizedOptions = getOptimizedMonacoOptions(contentLength);
          editor.updateOptions(optimizedOptions);

          setEditorError(null);
          setIsMonacoReady(true);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to initialize editor';
        setEditorError(errorMessage);
        logger.error({ err: error }, 'Monaco editor initialization error');
      }
    },
    [contentLength, isDarkMode, isMonacoReady]
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
