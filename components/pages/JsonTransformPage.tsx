'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useBackendStore } from '@/lib/store/backend';
import { ViewerActions } from '@/components/features/viewer';
import { EditorPane } from '@/components/features/editor/EditorPane';
import { useMonacoEditor } from '@/hooks/use-monaco-editor';
import { defineMonacoThemes } from '@/lib/editor/themes';
import { validateJson } from '@/lib/utils/json-validators';
import { toastPatterns } from '@/lib/utils/toast-helpers';
import type { EditorAction } from '@/types/editor-actions';
import {
  createResetAction,
  createUndoAction,
  createRedoAction,
} from '@/lib/editor/action-factories';

export type JsonTransformPageProps = {
  actionVerb: 'Format' | 'Minify';
  outputTitle: string;
  buttonIcon: React.ReactNode;
  transform: (obj: unknown) => string; // e.g., JSON.stringify(obj, null, 2) or JSON.stringify(obj)
  copySuccessDescription: string;
};

export function JsonTransformPage({
  actionVerb,
  outputTitle,
  buttonIcon,
  transform,
  copySuccessDescription,
}: JsonTransformPageProps) {
  const currentJson = useBackendStore((s) => s.currentJson);
  const setCurrentJson = useBackendStore((s) => s.setCurrentJson);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  // Use Monaco editor hook for both editors
  const inputEditor = useMonacoEditor(input.length);
  const outputEditor = useMonacoEditor(output.length, { readOnly: true });

  // Initialize input from currentJson when page loads
  useEffect(() => {
    if (currentJson && currentJson.trim()) {
      setInput(currentJson);
    }
  }, [currentJson]);

  const hasValidInput = validateJson(input);

  // Auto-transform when input changes and is valid
  useEffect(() => {
    if (input.trim() && hasValidInput) {
      try {
        const parsed = JSON.parse(input);
        const result = transform(parsed);
        setOutput(result);
      } catch {
        setOutput('');
      }
    } else {
      setOutput('');
    }
  }, [input, hasValidInput, transform]);

  const handleTransform = useCallback(() => {
    if (!input.trim()) {
      toastPatterns.validation.noJson(actionVerb.toLowerCase());
      return;
    }

    try {
      const parsed = JSON.parse(input);
      const result = transform(parsed);
      setOutput(result);
      toast({
        title: `${actionVerb}ed!`,
        description: `JSON has been ${actionVerb.toLowerCase()}ed successfully`,
      });
    } catch (e) {
      toast({
        title: 'Invalid JSON',
        description: (e as Error).message,
        variant: 'destructive',
      });
    }
  }, [input, transform, actionVerb, toast]);

  // Define input pane actions - Undo, Redo, Clear
  const inputActions: EditorAction[] = useMemo(
    () => [
      createUndoAction({ editor: inputEditor.editorRef, position: 'right' }),
      createRedoAction({ editor: inputEditor.editorRef, position: 'right' }),
      createResetAction({
        onReset: () => setInput(''),
        hasData: !!input,
        id: 'reset-input',
        position: 'right',
        showText: false,
        tooltip: 'Clear input',
      }),
    ],
    [input, inputEditor.editorRef]
  );

  // Define output pane actions - only Reset
  const outputActions: EditorAction[] = useMemo(
    () => [
      createResetAction({
        onReset: () => setOutput(''),
        hasData: !!output,
        id: 'reset-output',
        position: 'right',
        showText: false,
        tooltip: 'Clear output',
      }),
    ],
    [output]
  );

  return (
    <MainLayout>
      <div className="h-full min-h-0 flex flex-col lg:flex-row overflow-hidden">
        <EditorPane
          title="Input JSON"
          value={input}
          onChange={(value) => {
            const newValue = value || '';
            setInput(newValue);
            setCurrentJson(newValue);
          }}
          actions={inputActions}
          customActions={<ViewerActions value={input} onChange={setInput} />}
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          validationBadge={
            hasValidInput ? (
              <Button variant="green" size="sm" onClick={handleTransform} className="h-6 text-xs">
                {buttonIcon}
                {actionVerb} JSON
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
          title={outputTitle}
          value={output}
          readOnly
          actions={outputActions}
          customActions={<ViewerActions value={output} onChange={setOutput} />}
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
