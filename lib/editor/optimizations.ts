import type { editor } from 'monaco-editor';
import { isLargeFile } from '@/lib/config/editor-config';

// Performance-optimized Monaco configuration
export const OPTIMIZED_MONACO_OPTIONS: editor.IStandaloneEditorConstructionOptions = {
  // Core performance settings
  automaticLayout: true,
  scrollBeyondLastLine: false,

  // Disable expensive features for large files
  minimap: { enabled: false },
  renderLineHighlight: 'none', // Reduce rendering overhead
  renderWhitespace: 'none',
  renderControlCharacters: false,

  // Optimize scrolling and rendering
  scrollbar: {
    vertical: 'visible',
    horizontal: 'visible',
    useShadows: false, // Reduce rendering overhead
    verticalScrollbarSize: 10,
    horizontalScrollbarSize: 10,
  },

  // Font and layout
  fontSize: 14,
  fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", monospace',
  lineHeight: 20,
  letterSpacing: 0,

  // Editor behavior
  wordWrap: 'off', // Start with wrap off for better performance
  tabSize: 2,
  insertSpaces: true,
  formatOnPaste: false, // Disable auto-format for performance
  formatOnType: false,

  // Line numbers and folding
  lineNumbers: 'on',
  folding: true,
  foldingStrategy: 'indentation',
  showFoldingControls: 'mouseover', // Only show on hover

  // Disable expensive features
  suggestOnTriggerCharacters: false,
  quickSuggestions: false,
  parameterHints: { enabled: false },
  hover: { enabled: false },

  // Bracket matching
  autoClosingBrackets: 'always',
  autoClosingQuotes: 'always',
  bracketPairColorization: { enabled: false }, // Disable for performance

  // Other optimizations
  dragAndDrop: false,
  links: false,
  contextmenu: true,
  selectOnLineNumbers: true,
  roundedSelection: false,
  readOnly: false,
  cursorStyle: 'line',
  cursorBlinking: 'solid', // Reduce animation
  smoothScrolling: false, // Disable smooth scrolling for performance
  mouseWheelZoom: false,

  // Accessibility (can be disabled for performance)
  accessibilitySupport: 'off',
  accessibilityPageSize: 10,
};

// Options for small files (< 100KB)
export const SMALL_FILE_OPTIONS: Partial<editor.IStandaloneEditorConstructionOptions> = {
  ...OPTIMIZED_MONACO_OPTIONS,
  wordWrap: 'on',
  renderLineHighlight: 'line',
  bracketPairColorization: { enabled: true },
  formatOnPaste: true,
  suggestOnTriggerCharacters: true,
  quickSuggestions: true,
  hover: { enabled: true },
  smoothScrolling: true,
};

// Options for large files (> 1MB)
export const LARGE_FILE_OPTIONS: Partial<editor.IStandaloneEditorConstructionOptions> = {
  ...OPTIMIZED_MONACO_OPTIONS,
  lineNumbers: 'off', // Disable line numbers for very large files
  folding: false, // Disable folding
  wordWrap: 'off',
  links: false,
  contextmenu: false,
  selectOnLineNumbers: false,
};

// Get optimized options based on content size
export function getOptimizedMonacoOptions(
  contentSize: number
): editor.IStandaloneEditorConstructionOptions {
  const sizeInKB = contentSize / 1024;

  if (sizeInKB < 100) {
    // Small file: enable all features
    return SMALL_FILE_OPTIONS as editor.IStandaloneEditorConstructionOptions;
  } else if (sizeInKB < 1024) {
    // Medium file: balanced settings
    return OPTIMIZED_MONACO_OPTIONS;
  } else {
    // Large file: maximum performance
    return LARGE_FILE_OPTIONS as editor.IStandaloneEditorConstructionOptions;
  }
}

// Debounce function for change handlers
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Chunk large JSON for progressive loading
export function chunkJson(json: string, chunkSize: number = 50000): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < json.length; i += chunkSize) {
    chunks.push(json.slice(i, i + chunkSize));
  }
  return chunks;
}

// Progressive JSON loader
export async function loadJsonProgressive(
  editor: editor.IStandaloneCodeEditor,
  json: string,
  onProgress?: (loaded: number, total: number) => void
): Promise<void> {
  const chunks = chunkJson(json);
  const model = editor.getModel();

  if (!model) return;

  // Clear editor first
  editor.setValue('');

  let loaded = '';
  for (let i = 0; i < chunks.length; i++) {
    loaded += chunks[i];

    // Use requestAnimationFrame for smooth updates
    await new Promise((resolve) => requestAnimationFrame(resolve));

    // Update editor
    editor.setValue(loaded);

    // Report progress
    if (onProgress) {
      onProgress(loaded.length, json.length);
    }

    // Allow UI to breathe
    if (i % 5 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }
}

// Format JSON with Web Worker for large files
export async function formatJsonWithWorker(json: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // For small JSON, format inline
    if (!isLargeFile(json.length)) {
      try {
        const parsed = JSON.parse(json);
        resolve(JSON.stringify(parsed, null, 2));
      } catch (error) {
        reject(error);
      }
      return;
    }

    // For large JSON, use Web Worker
    const workerCode = `
      self.onmessage = function(e) {
        try {
          const parsed = JSON.parse(e.data);
          const formatted = JSON.stringify(parsed, null, 2);
          self.postMessage({ success: true, data: formatted });
        } catch (error) {
          self.postMessage({ success: false, error: error.message });
        }
      };
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));

    worker.onmessage = (e) => {
      if (e.data.success) {
        resolve(e.data.data);
      } else {
        reject(new Error(e.data.error));
      }
      worker.terminate();
    };

    worker.onerror = (error) => {
      reject(error);
      worker.terminate();
    };

    worker.postMessage(json);
  });
}
