'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { UnifiedButton } from '@/components/ui/unified-button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useDarkMode } from '@/hooks/use-dark-mode';
import { useBackendStore } from '@/lib/store/backend';
import {
  Minimize2,
  Zap,
  RotateCcw,
  Search
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ViewerActions } from '@/components/features/viewer';
import { EditorActions } from '@/components/features/editor/EditorActions';
import { MonacoEditor } from '@/components/features/editor/MonacoEditorWithLoading';
import { useMonacoEditor } from '@/hooks/use-monaco-editor';
import { defineMonacoThemes } from '@/lib/editor/themes';
import { validateJson } from '@/lib/utils/json-validators';
import { toastPatterns } from '@/lib/utils/toast-helpers';

export default function FormatPage() {
  const { currentJson, setCurrentJson } = useBackendStore();
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

  const formatJson = useCallback((minify = false) => {
    if (!input.trim()) {
      toastPatterns.validation.noJson('format');
      return;
    }

    try {
      const parsed = JSON.parse(input);
      const formatted = JSON.stringify(parsed, null, minify ? 0 : 2);
      setOutput(formatted);
      toast({
        title: minify ? 'Minified!' : 'Formatted!',
        description: `JSON has been ${minify ? 'minified' : 'formatted'} successfully`,
      });
    } catch (e) {
      toast({
        title: 'Invalid JSON',
        description: (e as Error).message,
        variant: 'destructive',
      });
    }
  }, [input, toast]);

  const handleFormat = () => formatJson(false);
  const handleMinify = () => formatJson(true);

  const handleSample = useCallback(() => {
    const sample = JSON.stringify({
      name: "John Doe",
      age: 30,
      email: "john@example.com",
      address: {
        street: "123 Main St",
        city: "New York",
        country: "USA"
      },
      hobbies: ["reading", "coding", "gaming"],
      metadata: {
        created: "2024-01-01T00:00:00Z",
        updated: "2024-01-15T12:30:00Z"
      }
    }, null, 2);
    setInput(sample);
    setOutput('');
  }, []);

  const handleReset = useCallback(() => {
    setInput('');
    setOutput('');
    toast({
      title: 'Reset',
      description: 'Cleared input and output',
    });
  }, [toast]);


  return (
    <MainLayout>
      <div className="h-full flex flex-col">
        {/* Action buttons header - consistent with editor */}
        <div className="flex items-center justify-between gap-2 p-2 border-b bg-muted/50">
          {/* Search bar */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
            <Input
              placeholder="Search JSON content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-7 pl-7 text-sm"
            />
          </div>
          
          {/* Action buttons with Format first, then standard actions */}
          <div className="flex items-center gap-1">
            <UnifiedButton
              variant="blue"
              size="xs"
              icon={Zap}
              text="Format"
              onClick={handleFormat}
              disabled={!input || !hasValidInput}
              title="Format JSON"
            />
            <UnifiedButton
              variant="outline"
              size="xs"
              icon={Minimize2}
              text="Minify"
              onClick={handleMinify}
              disabled={!input || !hasValidInput}
              title="Minify JSON"
            />
            <EditorActions
              output={output}
              hasContent={!!(input || output)}
              onSample={handleSample}
              onReset={handleReset}
              filename="formatted"
              outputLabel="formatted JSON"
            />
            <ViewerActions />
          </div>
        </div>

        {/* Editors container */}
        <div className="flex-1 flex flex-col lg:flex-row gap-2 sm:gap-4 p-2 sm:p-4 overflow-hidden">
          {/* Input editor */}
          <div className="flex-1 min-h-[200px] lg:min-h-[300px] flex flex-col bg-card rounded-lg border">
            <div className="px-2 py-1 bg-muted border-b text-xs font-medium text-muted-foreground flex items-center justify-between">
              <span>Input JSON</span>
            </div>
            <div className="flex-1 min-h-0">
              <MonacoEditor
                height="100%"
                language="json"
                value={input}
                onChange={(value) => {
                  const newValue = value || '';
                  setInput(newValue);
                  // Sync changes back to the store
                  setCurrentJson(newValue);
                }}
                theme={inputEditor.theme}
                onMount={inputEditor.handleEditorDidMount}
                beforeMount={(monaco) => defineMonacoThemes(monaco)}
                options={inputEditor.editorOptions}
              />
            </div>
          </div>

          {/* Output editor */}
          <div className="flex-1 min-h-[200px] lg:min-h-[300px] flex flex-col bg-card rounded-lg border">
            <div className="px-2 py-1 bg-muted border-b text-xs font-medium text-muted-foreground">
              <span>Formatted Output</span>
            </div>
            <div className="flex-1 min-h-0">
              <MonacoEditor
                height="100%"
                language="json"
                value={output}
                theme={outputEditor.theme}
                onMount={outputEditor.handleEditorDidMount}
                beforeMount={(monaco) => defineMonacoThemes(monaco)}
                options={outputEditor.editorOptions}
              />
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}