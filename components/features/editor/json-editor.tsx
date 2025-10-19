'use client';

import { useEffect, useState, useCallback, useRef, memo, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { toastPatterns } from '@/lib/utils/toast-helpers';
import { useBackendStore } from '@/lib/store/backend';
import { validateJson } from '@/lib/json';
import { AlertTriangle } from 'lucide-react';
import { ViewerActions } from '@/components/features/viewer';
import { EditorPane } from '@/components/features/editor/EditorPane';
import type { Monaco } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { defineMonacoThemes } from '@/lib/editor/themes';
import {
  formatJsonWithWorker,
  loadJsonProgressive,
  debounce
} from '@/lib/editor/optimizations';
import { ErrorBoundary } from '@/components/shared/error-boundary';
import { useMonacoEditor } from '@/hooks/use-monaco-editor';
import { useSearch } from '@/hooks/use-search';
import {
  isLargeFile,
  getDebounceDelay,
  shouldUseProgressiveLoad
} from '@/lib/config/editor-config';
import type { EditorAction } from '@/types/editor-actions';

function JsonEditorComponent() {
  const { currentJson, setCurrentJson } = useBackendStore();
  const [localContent, setLocalContent] = useState('');
  const { searchTerm, setSearchTerm } = useSearch();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const decorationsRef = useRef<string[]>([]);
  const isLargeFileFlag = isLargeFile(currentJson.length);

  // Use Monaco editor hook
  const {
    editorRef,
    monacoRef,
    handleEditorDidMount,
    editorOptions,
    theme,
    editorError
  } = useMonacoEditor(localContent.length);

  // Initialize local content on mount
  useEffect(() => {
    setLocalContent(currentJson);
  }, []);

  // Sync with global state when it changes
  useEffect(() => {
    setLocalContent(currentJson);
    if (editorRef.current) {
      const currentEditorValue = editorRef.current.getValue();
      if (currentEditorValue !== currentJson) {
        // Use setValue to properly replace all content
        editorRef.current.setValue(currentJson);
        // Set cursor to end
        const model = editorRef.current.getModel();
        if (model) {
          const lineCount = model.getLineCount();
          const lastLineLength = model.getLineLength(lineCount);
          editorRef.current.setPosition({ lineNumber: lineCount, column: lastLineLength + 1 });
        }
      }
    }
  }, [currentJson]);

  const formatJson = useCallback(async () => {
    if (editorRef.current) {
      const content = editorRef.current.getValue();
      setIsLoading(true);
      try {
        // Use Web Worker for large files
        const formatted = await formatJsonWithWorker(content);

        // For very large files, load progressively
        if (shouldUseProgressiveLoad(formatted.length)) {
          await loadJsonProgressive(editorRef.current, formatted, (loaded, total) => {
            setLoadingProgress(Math.round((loaded / total) * 100));
          });
        } else {
          editorRef.current.setValue(formatted);
        }
        
        setLocalContent(formatted);
        setCurrentJson(formatted);
        setLoadingProgress(0);
        toastPatterns.success.formatted('JSON');
      } catch (error) {
        toastPatterns.error.format();
      } finally {
        setIsLoading(false);
        setLoadingProgress(0);
      }
    }
  }, [setCurrentJson]);

  // Custom editor mount handler to add commands and validation
  const handleCustomEditorMount = useCallback((editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
    setIsLoading(false);

    // Call the base mount handler from the hook
    handleEditorDidMount(editor, monaco);

    // Add format command
    editor.addAction({
      id: 'format-json',
      label: 'Format JSON',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.KeyF],
      run: formatJson,
    });

    // Add search command
    editor.addAction({
      id: 'search-json',
      label: 'Search JSON',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF],
      run: () => {
        editor.getAction('actions.find')?.run();
      },
    });

    // Add validation on model change
    const model = editor.getModel();
    if (model) {
      model.onDidChangeContent(() => {
        const content = model.getValue();
        updateValidationDecorations(editor, monaco, content);
      });

      // Initial validation
      updateValidationDecorations(editor, monaco, model.getValue());
    }
  }, [formatJson, handleEditorDidMount]);


  // Debounced change handler for better performance
  const debouncedSetCurrentJson = useMemo(
    () => debounce(setCurrentJson as (...args: unknown[]) => unknown, getDebounceDelay(currentJson.length)) as (value: string) => void,
    [setCurrentJson, currentJson.length]
  );

  const handleMonacoChange = useCallback(
    (value: string | undefined) => {
      const newValue = value || '';
      setLocalContent(newValue);
      // Use debounced update for large files
      if (isLargeFileFlag) {
        debouncedSetCurrentJson(newValue);
      } else {
        setCurrentJson(newValue);
      }
    },
    [setCurrentJson, debouncedSetCurrentJson, isLargeFileFlag]
  );

  // Search functionality
  const handleSearch = useCallback((term: string) => {
    if (!editorRef.current || !monacoRef.current) return;
    
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    
    if (term) {
      const model = editor.getModel();
      if (model) {
        const matches = model.findMatches(
          term,
          false,
          false,
          false,
          null,
          false
        );
        
        if (matches.length > 0) {
          editor.setSelection(matches[0].range);
          editor.revealRangeInCenter(matches[0].range);
          
          // Highlight all matches
          const newDecorations = matches.map(match => ({
            range: match.range,
            options: {
              className: 'monaco-find-match',
              backgroundColor: 'rgba(255, 255, 0, 0.3)',
            }
          }));
          
          decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations);
        }
      }
    } else {
      // Clear highlights
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);
    }
  }, []);

  // Validation decorations
  const updateValidationDecorations = useCallback((editor: editor.IStandaloneCodeEditor, monaco: Monaco, content: string) => {
    const model = editor.getModel();
    if (!model) return;

    try {
      JSON.parse(content);
      // Clear error markers
      monaco.editor.setModelMarkers(model, 'json', []);
    } catch (error) {
      if (content.trim() && error instanceof Error) {
        // Add error marker
        const lines = content.split('\n');
        let line = 1;
        let column = 1;
        
        // Try to extract line/column from error message
        const match = error.message.match(/at line (\d+) column (\d+)/);
        if (match) {
          line = parseInt(match[1]);
          column = parseInt(match[2]);
        }
        
        monaco.editor.setModelMarkers(model, 'json', [{
          severity: monaco.MarkerSeverity.Error,
          message: error.message,
          startLineNumber: line,
          startColumn: column,
          endLineNumber: line,
          endColumn: column + 1
        }]);
      }
    }
  }, []);

  const isValid = localContent ? validateJson(localContent) : false;
  const charCount = localContent ? localContent.length : 0;
  const wordCount = localContent ? localContent.trim().split(/\s+/).filter(word => word.length > 0).length : 0;
  const lineCount = localContent ? localContent.split('\n').length : 1;

  // Define actions - empty array, all actions provided by ViewerActions
  const editorActions: EditorAction[] = useMemo(() => [], []);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Loading progress for large files */}
      {loadingProgress > 0 && (
        <div className="px-2 py-1 bg-blue-50 dark:bg-blue-950 border-b">
          <div className="flex items-center gap-2">
            <span className="text-xs text-blue-600 dark:text-blue-400">Loading JSON:</span>
            <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            <span className="text-xs text-blue-600 dark:text-blue-400">{loadingProgress}%</span>
          </div>
        </div>
      )}

      {/* Full-height Monaco editor with EditorPane */}
      <div className="flex-1 min-h-0 overflow-hidden" data-testid="json-textarea">
        <ErrorBoundary
          level="component"
          fallback={
            <div className="flex items-center justify-center h-full border">
              <p className="text-sm text-muted-foreground">Failed to load code editor</p>
            </div>
          }
          enableRetry
          maxRetries={2}
        >
          <EditorPane
            title="JSON Editor"
            value={localContent}
            onChange={handleMonacoChange}
            actions={editorActions}
            customActions={<ViewerActions value={localContent} onChange={setLocalContent} />}
            searchValue={searchTerm}
            onSearchChange={(value) => {
              setSearchTerm(value);
              handleSearch(value);
            }}
            theme={theme}
            onMount={handleCustomEditorMount}
            beforeMount={(monaco) => defineMonacoThemes(monaco)}
            options={editorOptions}
          />
        </ErrorBoundary>
      </div>

      {/* Status bar - moved to bottom */}
      <div className="flex-none flex items-center justify-between px-3 py-1 bg-muted border-t text-xs">
        <div className="flex items-center gap-4 text-muted-foreground">
          <span>Lines: {lineCount.toLocaleString()}</span>
          <span>Characters: {charCount.toLocaleString()}</span>
          <span>Words: {wordCount.toLocaleString()}</span>
        </div>
        
        <div className="flex items-center gap-2">
          {editorError && (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Editor Error
            </Badge>
          )}
          <Badge
            variant={isValid ? 'default' : charCount > 0 ? 'destructive' : 'secondary'}
            className="text-xs"
          >
            {isValid ? '✓ Valid JSON' : charCount > 0 ? '✗ Invalid JSON' : 'Enter JSON...'}
          </Badge>
        </div>
      </div>
    </div>
  );
}

// Export memoized component
export const JsonEditor = memo(JsonEditorComponent);
JsonEditor.displayName = 'JsonEditor';
