'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  GitCompare, 
  Plus, 
  Minus, 
  Edit, 
  RotateCcw,
  Download,
  Zap,
  Copy,
  AlertTriangle,
  Link,
  Unlink
} from 'lucide-react';
import { 
  compareJson, 
  DiffResult, 
  DiffOperation,
  generateDiffSummary,
  formatDiffOperation
} from '@/lib/json';
import { useToast } from '@/hooks/use-toast';
import { useBackendStore } from '@/lib/store/backend';
import dynamic from 'next/dynamic';
import type { OnMount, Monaco } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { validateJson, copyJsonToClipboard, downloadJson } from '@/lib/json';
import { defineMonacoThemes } from '@/lib/editor/themes';

// Monaco editor with loading state
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

interface JsonCompareProps {
  initialJson1?: string;
  initialJson2?: string;
  className?: string;
  activeView?: string;
  onViewChange?: (view: string) => void;
}

export function ViewerCompare({
  initialJson1 = '', 
  initialJson2 = '', 
  className = '',
  activeView = 'input',
  onViewChange
}: JsonCompareProps) {
  const { setCurrentJson } = useBackendStore();
  const [json1, setJson1] = useState(initialJson1);
  const [json2, setJson2] = useState(initialJson2);
  const [syncScroll, setSyncScroll] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const editor1Ref = useRef<any>(null);
  const editor2Ref = useRef<any>(null);
  const { toast } = useToast();

  // Update local state when initialJson1 changes (from store)
  useEffect(() => {
    if (initialJson1 !== json1) {
      setJson1(initialJson1);
    }
  }, [initialJson1]); // Only depend on initialJson1, not json1 to avoid loops

  // Parse JSON and handle errors
  const parsedJson1 = useMemo(() => {
    try {
      return json1.trim() ? JSON.parse(json1) : null;
    } catch {
      return null;
    }
  }, [json1]);

  const parsedJson2 = useMemo(() => {
    try {
      return json2.trim() ? JSON.parse(json2) : null;
    } catch {
      return null;
    }
  }, [json2]);

  // Generate diff
  const diffResult = useMemo((): DiffResult | null => {
    if (!parsedJson1 || !parsedJson2) return null;
    
    try {
      return compareJson(parsedJson1, parsedJson2);
    } catch (error) {
      console.error('Diff generation failed:', error);
      return null;
    }
  }, [parsedJson1, parsedJson2]);

  const canCompare = parsedJson1 && parsedJson2;

  // Check for dark mode on mount and listen for changes
  React.useEffect(() => {
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

  // Update Monaco themes when dark mode changes
  React.useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).monaco) {
      const monaco = (window as any).monaco;
      const theme = isDarkMode ? 'shadcn-dark' : 'shadcn-light';
      monaco.editor.setTheme(theme);
    }
  }, [isDarkMode]);

  const hasValidJson1 = validateJson(json1);
  const hasValidJson2 = validateJson(json2);

  const handleCompare = useCallback(() => {
    if (!canCompare) {
      toast({
        title: 'Cannot compare',
        description: 'Please provide valid JSON in both inputs',
        variant: 'destructive',
      });
      return;
    }

    if (onViewChange) {
      onViewChange('results');
    }
    
    if (diffResult) {
      toast({
        title: 'Comparison complete',
        description: generateDiffSummary(diffResult),
      });
    }
  }, [canCompare, diffResult, onViewChange, toast]);

  const handleReset = useCallback(() => {
    setJson1('');
    setJson2('');
    if (onViewChange) {
      onViewChange('input');
    }
  }, [onViewChange]);

  const formatJson1 = useCallback(() => {
    if (!hasValidJson1) return;
    try {
      const parsed = JSON.parse(json1);
      setJson1(JSON.stringify(parsed, null, 2));
      toast({ title: 'JSON 1 formatted successfully' });
    } catch {
      toast({ title: 'Cannot format invalid JSON', variant: 'destructive' });
    }
  }, [hasValidJson1, json1, toast]);

  const formatJson2 = useCallback(() => {
    if (!hasValidJson2) return;
    try {
      const parsed = JSON.parse(json2);
      setJson2(JSON.stringify(parsed, null, 2));
      toast({ title: 'JSON 2 formatted successfully' });
    } catch {
      toast({ title: 'Cannot format invalid JSON', variant: 'destructive' });
    }
  }, [hasValidJson2, json2, toast]);

  const handleCopyJson1 = useCallback(() => {
    if (!json1) {
      toast({ title: 'No JSON', description: 'Please enter some JSON first', variant: 'destructive' });
      return;
    }
    copyJsonToClipboard(json1, (title, desc, variant) => 
      toast({ title, description: desc, variant: variant as any })
    );
  }, [json1, toast]);

  const handleCopyJson2 = useCallback(() => {
    if (!json2) {
      toast({ title: 'No JSON', description: 'Please enter some JSON first', variant: 'destructive' });
      return;
    }
    copyJsonToClipboard(json2, (title, desc, variant) => 
      toast({ title, description: desc, variant: variant as any })
    );
  }, [json2, toast]);

  const handleDownloadDiff = useCallback(() => {
    if (!diffResult) return;
    
    const diffReport = {
      timestamp: new Date().toISOString(),
      summary: generateDiffSummary(diffResult),
      operations: diffResult.operations.map(op => ({
        operation: op.op,
        path: op.path,
        oldValue: op.oldValue,
        newValue: op.value
      }))
    };
    
    downloadJson(JSON.stringify(diffReport, null, 2), 'json-diff-report.json', 
      (title, desc, variant) => toast({ title, description: desc, variant: variant as any })
    );
  }, [diffResult, toast]);

  // Handle synchronized scrolling - improved sync logic
  const handleEditor1Mount = useCallback((editor: any, monaco?: any) => {
    editor1Ref.current = editor;
    // Define custom themes and set the current theme
    if (monaco) {
      defineMonacoThemes(monaco);
      const currentTheme = isDarkMode ? 'shadcn-dark' : 'shadcn-light';
      monaco.editor.setTheme(currentTheme);
    }
    
    // Set up scroll synchronization
    const scrollDisposable = editor.onDidScrollChange((e: any) => {
      if (editor2Ref.current && syncScroll) {
        // Prevent infinite loops by checking if this scroll was triggered by sync
        if (!editor._syncingScroll) {
          editor2Ref.current._syncingScroll = true;
          editor2Ref.current.setScrollPosition({
            scrollTop: e.scrollTop,
            scrollLeft: e.scrollLeft
          });
          // Reset sync flag after a brief delay
          setTimeout(() => {
            if (editor2Ref.current) {
              editor2Ref.current._syncingScroll = false;
            }
          }, 10);
        }
      }
    });
    
    return scrollDisposable;
  }, [syncScroll, isDarkMode]);

  const handleEditor2Mount = useCallback((editor: any, monaco?: any) => {
    editor2Ref.current = editor;
    // Define custom themes and set the current theme
    if (monaco) {
      defineMonacoThemes(monaco);
      const currentTheme = isDarkMode ? 'shadcn-dark' : 'shadcn-light';
      monaco.editor.setTheme(currentTheme);
    }
    
    // Set up scroll synchronization
    const scrollDisposable = editor.onDidScrollChange((e: any) => {
      if (editor1Ref.current && syncScroll) {
        // Prevent infinite loops by checking if this scroll was triggered by sync
        if (!editor._syncingScroll) {
          editor1Ref.current._syncingScroll = true;
          editor1Ref.current.setScrollPosition({
            scrollTop: e.scrollTop,
            scrollLeft: e.scrollLeft
          });
          // Reset sync flag after a brief delay
          setTimeout(() => {
            if (editor1Ref.current) {
              editor1Ref.current._syncingScroll = false;
            }
          }, 10);
        }
      }
    });
    
    return scrollDisposable;
  }, [syncScroll, isDarkMode]);

  const renderDiffOperation = (op: DiffOperation, index: number) => {
    const typeColors = {
      add: 'border-green-300 bg-green-50',
      remove: 'border-red-300 bg-red-50', 
      modify: 'border-amber-300 bg-amber-50'
    };

    const typeIcons = {
      add: <Plus className="h-5 w-5 text-green-600" />,
      remove: <Minus className="h-5 w-5 text-red-600" />,
      modify: <Edit className="h-5 w-5 text-amber-600" />
    };

    const typeLabels = {
      add: 'Added',
      remove: 'Removed',
      modify: 'Modified'
    };

    return (
      <div key={index} className={`p-4 mb-3 rounded-lg border-2 ${typeColors[op.op === 'replace' ? 'modify' : op.op]}`}>
        <div className="flex items-start gap-3">
          <div className="flex-none mt-0.5">{typeIcons[op.op === 'replace' ? 'modify' : op.op]}</div>
          <div className="flex-1 min-w-0">
            {/* Path and type badge */}
            <div className="flex items-center gap-2 mb-2">
              <code className="font-mono text-sm font-semibold text-foreground bg-background px-2 py-1 rounded border">
                {op.path || '/'}
              </code>
              <Badge 
                variant={op.op === 'add' ? 'default' : op.op === 'remove' ? 'destructive' : 'secondary'}
                className="text-xs"
              >
                {typeLabels[op.op === 'replace' ? 'modify' : op.op]}
              </Badge>
            </div>
            
            {/* Value display */}
            <div className="space-y-2">
              {op.op === 'remove' && (
                <div className="bg-background rounded-md p-3 border border-red-200 dark:border-red-900">
                  <div className="text-xs font-medium text-red-700 mb-1">Removed value:</div>
                  <pre className="text-sm text-foreground overflow-x-auto">
                    <code>{JSON.stringify(op.oldValue, null, 2)}</code>
                  </pre>
                </div>
              )}
              
              {op.op === 'add' && (
                <div className="bg-background rounded-md p-3 border border-green-200 dark:border-green-900">
                  <div className="text-xs font-medium text-green-700 mb-1">Added value:</div>
                  <pre className="text-sm text-foreground overflow-x-auto">
                    <code>{JSON.stringify(op.value, null, 2)}</code>
                  </pre>
                </div>
              )}
              
              {op.op === 'replace' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                  <div className="bg-background rounded-md p-3 border border-red-200 dark:border-red-900">
                    <div className="text-xs font-medium text-red-700 mb-1">Old value:</div>
                    <pre className="text-sm text-foreground overflow-x-auto">
                      <code>{JSON.stringify(op.oldValue, null, 2)}</code>
                    </pre>
                  </div>
                  <div className="bg-background rounded-md p-3 border border-green-200 dark:border-green-900">
                    <div className="text-xs font-medium text-green-700 mb-1">New value:</div>
                    <pre className="text-sm text-foreground overflow-x-auto">
                      <code>{JSON.stringify(op.value, null, 2)}</code>
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (activeView === 'input') {
    return (
      <div className={`h-full flex flex-col ${className}`}>
        {/* Editors container with more padding - responsive */}
        <div className="flex-1 flex flex-col md:flex-row gap-4 p-2 md:p-4 overflow-hidden">
          {/* Left editor with its own action bar */}
          <div className="flex-1 min-h-[250px] sm:min-h-[300px] flex flex-col bg-card rounded-lg border">
            <div className="px-2 py-1 bg-muted border-b text-xs font-medium text-muted-foreground flex items-center justify-between">
              <span>JSON 1 (Original)</span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={formatJson1}
                  disabled={!json1 || !hasValidJson1}
                  className="h-6 px-2 text-xs"
                >
                  <Zap className="h-3 w-3 mr-1" />
                  Format
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyJson1}
                  disabled={!json1}
                  className="h-6 px-2 text-xs"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <MonacoEditor
                height="100%"
                language="json"
                theme={isDarkMode ? "shadcn-dark" : "shadcn-light"}
                value={json1}
                onChange={(value) => {
                  const newValue = value || '';
                  setJson1(newValue);
                  // Sync changes back to the store for json1
                  setCurrentJson(newValue);
                }}
                onMount={handleEditor1Mount}
                beforeMount={(monaco) => {
                  // Define themes before mount
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
                  lineNumbers: 'on',
                }}
              />
            </div>
            <div className="px-2 py-1 bg-muted/50 border-t text-xs text-muted-foreground">
              <Badge variant={hasValidJson1 ? 'default' : json1 ? 'destructive' : 'secondary'} className="text-xs">
                {hasValidJson1 ? '✓ Valid' : json1 ? '✗ Invalid' : 'Empty'}
              </Badge>
            </div>
          </div>

          {/* Right editor with its own action bar */}
          <div className="flex-1 min-h-[250px] sm:min-h-[300px] flex flex-col bg-card rounded-lg border">
            <div className="px-2 py-1 bg-muted border-b text-xs font-medium text-muted-foreground flex items-center justify-between">
              <span>JSON 2 (Modified)</span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={formatJson2}
                  disabled={!json2 || !hasValidJson2}
                  className="h-6 px-2 text-xs"
                >
                  <Zap className="h-3 w-3 mr-1" />
                  Format
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyJson2}
                  disabled={!json2}
                  className="h-6 px-2 text-xs"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <MonacoEditor
                height="100%"
                language="json"
                theme={isDarkMode ? "shadcn-dark" : "shadcn-light"}
                value={json2}
                onChange={(value) => setJson2(value || '')}
                onMount={handleEditor2Mount}
                beforeMount={(monaco) => {
                  // Define themes before mount
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
                  lineNumbers: 'on',
                }}
              />
            </div>
            <div className="px-2 py-1 bg-muted/50 border-t text-xs text-muted-foreground">
              <Badge variant={hasValidJson2 ? 'default' : json2 ? 'destructive' : 'secondary'} className="text-xs">
                {hasValidJson2 ? '✓ Valid' : json2 ? '✗ Invalid' : 'Empty'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Action buttons bar below editors */}
        <div className="flex-none px-2 sm:px-3 py-2 bg-muted border-t">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSyncScroll(!syncScroll)}
              className={`h-7 px-3 text-xs ${syncScroll ? 'bg-blue-50 border-blue-300' : ''}`}
            >
              {syncScroll ? <Link className="h-3 w-3 mr-1" /> : <Unlink className="h-3 w-3 mr-1" />}
              Sync Scroll
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="h-7 px-3 text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>
            <Button
              size="sm"
              onClick={handleCompare}
              disabled={!canCompare}
              className="h-7 px-4 text-xs bg-blue-600 hover:bg-blue-700 text-white"
            >
              <GitCompare className="h-3 w-3 mr-1" />
              Compare
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Results view
  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Action bar for results */}
      <div className="flex-none px-3 py-2 bg-muted border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {diffResult && (
              <>
                <Badge variant="default" className="text-xs">
                  {diffResult.operations.filter(op => op.op === 'add').length} Added
                </Badge>
                <Badge variant="destructive" className="text-xs">
                  {diffResult.operations.filter(op => op.op === 'remove').length} Removed
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {diffResult.operations.filter(op => op.op === 'replace').length} Modified
                </Badge>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadDiff}
              disabled={!diffResult}
              className="h-7 px-2 text-xs"
            >
              <Download className="h-3 w-3 mr-1" />
              Export Report
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewChange?.('input')}
              className="h-7 px-2 text-xs"
            >
              Back to Input
            </Button>
          </div>
        </div>
      </div>

      {/* Results content */}
      <div className="flex-1 overflow-hidden p-4">
        {!diffResult ? (
          <Alert className="max-w-2xl mx-auto">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No comparison results available. Please provide valid JSON in both inputs and click Compare.
            </AlertDescription>
          </Alert>
        ) : diffResult.operations.length === 0 ? (
          <Alert className="max-w-2xl mx-auto">
            <AlertDescription>
              The JSON documents are identical. No differences found.
            </AlertDescription>
          </Alert>
        ) : (
          <ScrollArea className="h-full">
            <div className="max-w-4xl mx-auto">
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Comparison Results</h3>
                <p className="text-sm text-muted-foreground">{generateDiffSummary(diffResult)}</p>
              </div>
              
              <div className="space-y-2">
                {diffResult.operations.map((op, idx) => renderDiffOperation(op, idx))}
              </div>
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}