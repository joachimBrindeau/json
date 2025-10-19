'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useBackendStore } from '@/lib/store/backend';
import { ViewerActions } from '@/components/features/viewer';
import { EditorPane } from '@/components/features/editor/EditorPane';
import { useMonacoEditor } from '@/hooks/use-monaco-editor';
import { defineMonacoThemes } from '@/lib/editor/themes';
import { validateJson } from '@/lib/utils/json-validators';
import { toastPatterns } from '@/lib/utils/toast-helpers';
import { useClipboard } from '@/hooks/use-clipboard';
import { useDownload } from '@/hooks/use-download';
import type { EditorAction } from '@/types/editor-actions';
import { createResetAction, createUndoAction, createRedoAction } from '@/lib/editor/action-factories';
import { Minimize2 } from 'lucide-react';

export default function MinifyPage() {
  const { currentJson, setCurrentJson } = useBackendStore();
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  // Use Monaco editor hook for both editors
  const inputEditor = useMonacoEditor(input.length);
  const outputEditor = useMonacoEditor(output.length, { readOnly: true });

  // Clipboard and download hooks
  const { copy, copied } = useClipboard({
    successMessage: 'Copied!',
    successDescription: 'Minified JSON copied to clipboard',
  });
  const { download } = useDownload({
    successMessage: 'Downloaded!',
    successDescription: 'File downloaded successfully',
  });

  // Initialize input from currentJson when page loads
  useEffect(() => {
    if (currentJson && currentJson.trim()) {
      setInput(currentJson);
    }
  }, [currentJson]);

  const hasValidInput = validateJson(input);

  // Auto-minify when input changes and is valid
  useEffect(() => {
    if (input.trim() && hasValidInput) {
      try {
        const parsed = JSON.parse(input);
        const minified = JSON.stringify(parsed);
        setOutput(minified);
      } catch {
        setOutput('');
      }
    } else {
      setOutput('');
    }
  }, [input, hasValidInput]);

  const handleMinify = useCallback(() => {
    if (!input.trim()) {
      toastPatterns.validation.noJson('minify');
      return;
    }

    try {
      const parsed = JSON.parse(input);
      const minified = JSON.stringify(parsed);
      setOutput(minified);
      toast({
        title: 'Minified!',
        description: 'JSON has been minified successfully',
      });
    } catch (e) {
      toast({
        title: 'Invalid JSON',
        description: (e as Error).message,
        variant: 'destructive',
      });
    }
  }, [input, toast]);

  // Define input pane actions - Undo, Redo, Clear (Copy/Download/Share/Format/Minify provided by ViewerActions)
  const inputActions: EditorAction[] = useMemo(() => [
    createUndoAction({
      editor: inputEditor.editorRef,
      position: 'right',
    }),
    createRedoAction({
      editor: inputEditor.editorRef,
      position: 'right',
    }),
    createResetAction({
      onReset: () => setInput(''),
      hasData: !!input,
      id: 'reset-input',
      position: 'right',
      showText: false,
      tooltip: 'Clear input',
    }),
  ], [input, inputEditor.editorRef]);

  // Define output pane actions - only Reset (Copy/Download/Share provided by ViewerActions)
  const outputActions: EditorAction[] = useMemo(() => [
    createResetAction({
      onReset: () => setOutput(''),
      hasData: !!output,
      id: 'reset-output',
      position: 'right',
      showText: false,
      tooltip: 'Clear output',
    }),
  ], [output]);

  return (
    <MainLayout>
      <div className="h-full flex flex-col lg:flex-row overflow-hidden">
        <EditorPane
          title="Input JSON"
          value={input}
          onChange={(value) => {
            const newValue = value || '';
            setInput(newValue);
            setCurrentJson(newValue);
          }}
          actions={inputActions}
          customActions={
            <ViewerActions
              value={input}
              onChange={setInput}
            />
          }
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          validationBadge={
            hasValidInput ? (
              <Button
                variant="green"
                size="sm"
                onClick={handleMinify}
                className="h-6 text-xs"
              >
                <Minimize2 className="h-3 w-3 mr-1" />
                Minify JSON
              </Button>
            ) : null
          }
          theme={inputEditor.theme}
          onMount={inputEditor.handleEditorDidMount}
          beforeMount={(monaco) => defineMonacoThemes(monaco)}
          options={inputEditor.editorOptions}
          className="border-r"
        />

        <EditorPane
          title="Minified Output"
          value={output}
          readOnly
          actions={outputActions}
          customActions={
            <ViewerActions
              value={output}
              onChange={setOutput}
            />
          }
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          theme={outputEditor.theme}
          onMount={outputEditor.handleEditorDidMount}
          beforeMount={(monaco) => defineMonacoThemes(monaco)}
          options={outputEditor.editorOptions}
        />
      </div>
    </MainLayout>
  );
}

