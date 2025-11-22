'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toastPatterns, showSuccessToast, showErrorToast } from '@/lib/utils/toast-helpers';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/ScrollArea';
import {
  GitCompare,
  Plus,
  Minus,
  Edit,
  Download,
  AlertTriangle,
  Link,
  Unlink,
} from 'lucide-react';
import {
  compareJson,
  DiffResult,
  DiffOperation,
  generateDiffSummary,
} from '@/lib/json/json-diff';
import { useBackendStore } from '@/lib/store/backend';
import { EditorPane } from '@/components/features/editor/EditorPane';
import { useMonacoEditor } from '@/hooks/use-monaco-editor';
import { validateJson, downloadJson } from '@/lib/json/json-utils';
import { defineMonacoThemes } from '@/lib/editor/themes';
import { logger } from '@/lib/logger';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import type { EditorAction } from '@/types/editor-actions';
import { ViewerActions } from '@/components/features/viewer/ViewerActions';

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
  onViewChange,
}: JsonCompareProps) {
  const setCurrentJson = useBackendStore((s) => s.setCurrentJson);
  const [json1, setJson1] = useState(initialJson1);
  const [json2, setJson2] = useState(initialJson2);
  const [syncScroll, setSyncScroll] = useState(true);

  // Use Monaco editor hook for both editors
  const editor1 = useMonacoEditor(json1.length);
  const editor2 = useMonacoEditor(json2.length);


  // Scroll sync disposables and updater
  const scrollDisposable1Ref = useRef<any>(null);
  const scrollDisposable2Ref = useRef<any>(null);

  const updateScrollSync = useCallback(() => {
    const e1 = editor1.editorRef.current as any;
    const e2 = editor2.editorRef.current as any;

    // Clean up previous listeners
    if (scrollDisposable1Ref.current) {
      try { scrollDisposable1Ref.current.dispose?.(); } catch {}
      scrollDisposable1Ref.current = null;
    }
    if (scrollDisposable2Ref.current) {
      try { scrollDisposable2Ref.current.dispose?.(); } catch {}
      scrollDisposable2Ref.current = null;
    }

    if (!e1 || !e2 || !syncScroll) return;

    // Attach listeners that respect current syncScroll state
    scrollDisposable1Ref.current = e1.onDidScrollChange((ev: any) => {
      if (!(e1 as any)._syncingScroll && syncScroll) {
        (e2 as any)._syncingScroll = true;
        e2.setScrollPosition({ scrollTop: ev.scrollTop, scrollLeft: ev.scrollLeft });
        setTimeout(() => { (e2 as any)._syncingScroll = false; }, 10);
      }
    });

    scrollDisposable2Ref.current = e2.onDidScrollChange((ev: any) => {
      if (!(e2 as any)._syncingScroll && syncScroll) {
        (e1 as any)._syncingScroll = true;
        e1.setScrollPosition({ scrollTop: ev.scrollTop, scrollLeft: ev.scrollLeft });
        setTimeout(() => { (e1 as any)._syncingScroll = false; }, 10);
      }
    });
  }, [syncScroll, editor1.editorRef, editor2.editorRef]);

  // Re-apply listeners when toggle changes
  useEffect(() => {
    updateScrollSync();
    return () => {
      try { scrollDisposable1Ref.current?.dispose?.(); } catch {}
      try { scrollDisposable2Ref.current?.dispose?.(); } catch {}
      scrollDisposable1Ref.current = null;
      scrollDisposable2Ref.current = null;
    };
  }, [updateScrollSync]);

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
      logger.error({ err: error }, 'Diff generation failed in ViewerCompare');
      return null;
    }
  }, [parsedJson1, parsedJson2]);

  const canCompare = parsedJson1 && parsedJson2;

  const hasValidJson1 = validateJson(json1);
  const hasValidJson2 = validateJson(json2);

  const handleCompare = useCallback(() => {
    if (!canCompare) {
      toastPatterns.validation.invalid('JSON', 'Please provide valid JSON in both inputs');
      return;
    }

    if (onViewChange) {
      onViewChange('results');
    }

    if (diffResult) {
      showSuccessToast('Comparison complete', { description: generateDiffSummary(diffResult) });
    }
  }, [canCompare, diffResult, onViewChange]);



  const handleDownloadDiff = useCallback(() => {
    if (!diffResult) return;

    const diffReport = {
      timestamp: new Date().toISOString(),
      summary: generateDiffSummary(diffResult),
      operations: diffResult.operations.map((op) => ({
        operation: op.op,
        path: op.path,
        oldValue: op.oldValue,
        newValue: op.value,
      })),
    };

    downloadJson(
      JSON.stringify(diffReport, null, 2),
      'json-diff-report.json',
      (title, desc, variant) => {
        if (variant === 'destructive') {
          showErrorToast(desc || 'Failed to download', title);
        } else {
          showSuccessToast(title, { description: desc });
        }
      }
    );
  }, [diffResult]);

  // Handle synchronized scrolling - improved logic with dynamic listeners
  const handleEditor1Mount = useCallback(
    (editorInstance: any, monaco?: any) => {
      // Base mount handler
      editor1.handleEditorDidMount(editorInstance, monaco);
      // (Re)apply listeners when editor becomes available
      updateScrollSync();
    },
    [editor1, updateScrollSync]
  );

  const handleEditor2Mount = useCallback(
    (editorInstance: any, monaco?: any) => {
      // Base mount handler
      editor2.handleEditorDidMount(editorInstance, monaco);
      // (Re)apply listeners when editor becomes available
      updateScrollSync();
    },
    [editor2, updateScrollSync]
  );

  const renderDiffOperation = (op: DiffOperation, index: number) => {
    const typeColors: Record<'add' | 'remove' | 'modify', string> = {
      add: 'border-green-300 bg-green-50',
      remove: 'border-red-300 bg-red-50',
      modify: 'border-amber-300 bg-amber-50',
    };

    const typeIcons: Record<'add' | 'remove' | 'modify', React.ReactNode> = {
      add: <Plus className="h-5 w-5 text-green-600" />,
      remove: <Minus className="h-5 w-5 text-red-600" />,
      modify: <Edit className="h-5 w-5 text-amber-600" />,
    };

    const typeLabels: Record<'add' | 'remove' | 'modify', string> = {
      add: 'Added',
      remove: 'Removed',
      modify: 'Modified',
    };

    // Map operation type to display type
    const displayType: 'add' | 'remove' | 'modify' =
      op.op === 'replace'
        ? 'modify'
        : op.op === 'add'
          ? 'add'
          : op.op === 'remove'
            ? 'remove'
            : 'modify';

    return (
      <div key={index} className={`p-4 mb-3 rounded-lg border-2 ${typeColors[displayType]}`}>
        <div className="flex items-start gap-3">
          <div className="flex-none mt-0.5">{typeIcons[displayType]}</div>
          <div className="flex-1 min-w-0">
            {/* Path and type badge */}
            <div className="flex items-center gap-2 mb-2">
              <code className="font-mono text-sm font-semibold text-foreground bg-background px-2 py-1 rounded border">
                {op.path || '/'}
              </code>
              <Badge
                variant={
                  op.op === 'add' ? 'default' : op.op === 'remove' ? 'destructive' : 'secondary'
                }
                className="text-xs"
              >
                {typeLabels[displayType]}
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

  // No custom actions needed - Format/Minify/Copy/Download/Share all provided by ViewerActions
  const json1Actions: EditorAction[] = useMemo(() => [], []);
  const json2Actions: EditorAction[] = useMemo(() => [], []);

  if (activeView === 'input') {
    return (
      <div className={`h-full flex flex-col md:flex-row overflow-hidden ${className}`}>
        <EditorPane
          title="JSON 1 (Original)"
          value={json1}
          onChange={(value) => {
            const newValue = value || '';
            setJson1(newValue);
            setCurrentJson(newValue);
          }}
          actions={json1Actions}
          customActions={<ViewerActions value={json1} onChange={setJson1} />}
          validationBadge={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSyncScroll(!syncScroll)}
                className={`h-6 text-xs ${syncScroll ? 'bg-blue-50 border-blue-300' : ''}`}
                data-testid="sync-scroll-toggle"
                aria-pressed={syncScroll}
                title={syncScroll ? 'Disable synchronized scrolling' : 'Enable synchronized scrolling'}
              >
                {syncScroll ? (
                  <Link className="h-3 w-3 mr-1" />
                ) : (
                  <Unlink className="h-3 w-3 mr-1" />
                )}
                {syncScroll ? 'Sync On' : 'Sync Off'}
              </Button>
              <Button
                variant="green"
                size="sm"
                onClick={handleCompare}
                disabled={!hasValidJson1 || !hasValidJson2}
                className="h-6 text-xs"
              >
                <GitCompare className="h-3 w-3 mr-1" />
                Compare JSON
              </Button>
            </div>
          }
          theme={editor1.theme}
          onMount={handleEditor1Mount}
          beforeMount={(monaco) => {
            if (monaco && monaco.editor && typeof monaco.editor.defineTheme === 'function') {
              try {
                defineMonacoThemes(monaco);
              } catch (error) {
                // Theme definition will be retried in onMount if it fails here
              }
            }
          }}
          options={editor1.editorOptions}
          className="border-r"
        />

        <EditorPane
          title="JSON 2 (Modified)"
          value={json2}
          onChange={(value) => setJson2(value || '')}
          actions={json2Actions}
          customActions={<ViewerActions value={json2} onChange={setJson2} />}
          validationBadge={null}
          theme={editor2.theme}
          onMount={handleEditor2Mount}
          beforeMount={(monaco) => {
            if (monaco && monaco.editor && typeof monaco.editor.defineTheme === 'function') {
              try {
                defineMonacoThemes(monaco);
              } catch (error) {
                // Theme definition will be retried in onMount if it fails here
              }
            }
          }}
          options={editor2.editorOptions}
        />
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
                  {diffResult.operations.filter((op) => op.op === 'add').length} Added
                </Badge>
                <Badge variant="destructive" className="text-xs">
                  {diffResult.operations.filter((op) => op.op === 'remove').length} Removed
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {diffResult.operations.filter((op) => op.op === 'replace').length} Modified
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
      <ErrorBoundary
        level="component"
        fallback={
          <div className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Failed to render comparison results</p>
          </div>
        }
        enableRetry
      >
        <div className="flex-1 overflow-hidden p-4">
          {!diffResult ? (
            <Alert className="max-w-2xl mx-auto">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No comparison results available. Please provide valid JSON in both inputs and click
                Compare.
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
      </ErrorBoundary>
    </div>
  );
}
