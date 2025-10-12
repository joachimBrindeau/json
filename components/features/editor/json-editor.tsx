'use client';

import { useEffect, useState, useCallback, useRef, memo, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useBackendStore } from '@/lib/store/backend';
import { validateJson } from '@/lib/json';
import { Search, Zap, AlertTriangle } from 'lucide-react';
import { ViewerActions } from '@/components/features/viewer';
import dynamic from 'next/dynamic';
import type { OnMount, Monaco } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { defineMonacoThemes } from '@/lib/editor/themes';
import { 
  getOptimizedMonacoOptions, 
  formatJsonWithWorker, 
  loadJsonProgressive,
  debounce 
} from '@/lib/editor/optimizations';

// Monaco editor with enhanced loading state
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  loading: () => (
    <div className="h-full flex items-center justify-center bg-background border">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Loading Code Editor...</p>
      </div>
    </div>
  ),
  ssr: false,
});

function JsonEditorComponent() {
  const { toast } = useToast();
  const { currentJson, setCurrentJson } = useBackendStore();
  const [localContent, setLocalContent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const decorationsRef = useRef<string[]>([]);
  const isLargeFile = currentJson.length > 100000; // 100KB threshold

  // Initialize local content on mount and check dark mode
  useEffect(() => {
    setLocalContent(currentJson);
    // Check if dark mode is active
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    };
    
    checkDarkMode();
    
    // Listen for dark mode changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
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

  // Update Monaco theme when dark mode changes
  useEffect(() => {
    if (monacoRef.current && editorRef.current) {
      const theme = isDarkMode ? 'shadcn-dark' : 'shadcn-light';
      monacoRef.current.editor.setTheme(theme);
    }
  }, [isDarkMode]);

  const formatJson = useCallback(async () => {
    if (editorRef.current) {
      const content = editorRef.current.getValue();
      setIsLoading(true);
      try {
        // Use Web Worker for large files
        const formatted = await formatJsonWithWorker(content);
        
        // For very large files, load progressively
        if (formatted.length > 500000) {
          await loadJsonProgressive(editorRef.current, formatted, (loaded, total) => {
            setLoadingProgress(Math.round((loaded / total) * 100));
          });
        } else {
          editorRef.current.setValue(formatted);
        }
        
        setLocalContent(formatted);
        setCurrentJson(formatted);
        setLoadingProgress(0);
        toast({
          title: 'JSON formatted successfully',
          description: 'Your JSON has been properly formatted.',
        });
      } catch (error) {
        toast({
          title: 'Format failed',
          description: 'Cannot format invalid JSON',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
        setLoadingProgress(0);
      }
    }
  }, [setCurrentJson, toast]);

  const handleEditorMount: OnMount = useCallback((editor, monaco) => {
    setIsLoading(false);
    editorRef.current = editor;
    monacoRef.current = monaco;

    try {
      // Define custom themes immediately
      defineMonacoThemes(monaco);
      
      // Set the correct theme based on current dark mode state
      const currentTheme = isDarkMode ? 'shadcn-dark' : 'shadcn-light';
      monaco.editor.setTheme(currentTheme);
      
      // Use optimized options based on content size
      const optimizedOptions = getOptimizedMonacoOptions(localContent.length);
      editor.updateOptions(optimizedOptions);

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

      setEditorError(null);
    } catch (error) {
      setEditorError(error instanceof Error ? error.message : 'Failed to initialize editor');
      console.error('Monaco editor initialization error:', error);
    }
  }, [formatJson, isDarkMode]);


  // Debounced change handler for better performance
  const debouncedSetCurrentJson = useMemo(
    () => debounce(setCurrentJson, isLargeFile ? 500 : 100),
    [setCurrentJson, isLargeFile]
  );

  const handleMonacoChange = useCallback(
    (value: string | undefined) => {
      const newValue = value || '';
      setLocalContent(newValue);
      // Use debounced update for large files
      if (isLargeFile) {
        debouncedSetCurrentJson(newValue);
      } else {
        setCurrentJson(newValue);
      }
    },
    [setCurrentJson, debouncedSetCurrentJson, isLargeFile]
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

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Action buttons header - consistent with other views */}
      <div className="flex items-center justify-between gap-2 p-2 border-b bg-muted/50">
        {/* Search bar */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
          <Input
            placeholder="Search JSON keys and values..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              handleSearch(e.target.value);
            }}
            className="h-7 pl-7 text-sm"
            data-testid="search-input"
          />
        </div>
        
        {/* Action buttons with Format first */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={formatJson}
            disabled={charCount === 0 || !isValid}
            className="h-7 px-2 text-xs"
            title="Format JSON"
          >
            <Zap className="h-3 w-3 mr-1" />
            Format
          </Button>
          <ViewerActions />
        </div>
      </div>

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
      
      {/* Full-height Monaco editor */}
      <div className="flex-1 overflow-hidden" data-testid="json-textarea">
        <MonacoEditor
          height="100%"
          language="json"
          theme={isDarkMode ? "shadcn-dark" : "shadcn-light"}
          value={localContent}
          onChange={handleMonacoChange}
          onMount={handleEditorMount}
          beforeMount={(monaco) => {
            // Define themes before mount to ensure they're available
            defineMonacoThemes(monaco);
          }}
          options={{
            automaticLayout: true,
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", monospace',
            tabSize: 2,
            insertSpaces: true,
            formatOnPaste: true,
            formatOnType: false,
            lineNumbers: 'on',
            renderLineHighlight: 'line',
            scrollbar: {
              vertical: 'visible',
              horizontal: 'visible',
            },
            contextmenu: true,
            selectOnLineNumbers: true,
            roundedSelection: false,
            readOnly: false,
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
          }}
        />
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
