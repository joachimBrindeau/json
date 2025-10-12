'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { UnifiedButton } from '@/components/ui/unified-button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useBackendStore } from '@/lib/store/backend';
import { 
  Maximize2, 
  Minimize2, 
  Copy, 
  Download, 
  FileJson,
  Zap,
  RotateCcw,
  Check,
  Search
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { JsonActionButtons } from '@/components/features/viewer/json-action-buttons';
import dynamic from 'next/dynamic';
import type { OnMount, Monaco } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
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

export default function FormatPage() {
  const { currentJson, setCurrentJson } = useBackendStore();
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const inputEditorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const outputEditorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  // Initialize input from currentJson when page loads
  useEffect(() => {
    if (currentJson && currentJson.trim()) {
      setInput(currentJson);
    }
  }, [currentJson]);

  // Check for dark mode on mount and listen for changes
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
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  // Update Monaco themes when dark mode changes
  useEffect(() => {
    if (typeof window !== 'undefined' && 'monaco' in window) {
      const monaco = (window as { monaco: Monaco }).monaco;
      const theme = isDarkMode ? 'shadcn-dark' : 'shadcn-light';
      monaco.editor.setTheme(theme);
    }
  }, [isDarkMode]);

  const validateJson = (json: string): boolean => {
    if (!json.trim()) return false;
    try {
      JSON.parse(json);
      return true;
    } catch {
      return false;
    }
  };

  const hasValidInput = validateJson(input);

  const formatJson = useCallback((minify = false) => {
    if (!input.trim()) {
      toast({
        title: 'No input',
        description: 'Please enter some JSON to format',
        variant: 'destructive',
      });
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

  const handleCopy = useCallback(async () => {
    if (!output) {
      toast({
        title: 'No output',
        description: 'Format your JSON first',
        variant: 'destructive',
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: 'Copied!',
        description: 'JSON copied to clipboard',
      });
    } catch {
      toast({
        title: 'Failed to copy',
        description: 'Could not copy to clipboard',
        variant: 'destructive',
      });
    }
  }, [output, toast]);

  const handleDownload = useCallback(() => {
    if (!output) {
      toast({
        title: 'No output',
        description: 'Format your JSON first',
        variant: 'destructive',
      });
      return;
    }

    const blob = new Blob([output], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'formatted.json';
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Downloaded!',
      description: 'JSON file downloaded successfully',
    });
  }, [output, toast]);

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

  const handleInputEditorMount: OnMount = useCallback((editor, monaco) => {
    inputEditorRef.current = editor;
    if (monaco) {
      defineMonacoThemes(monaco);
      const currentTheme = isDarkMode ? 'shadcn-dark' : 'shadcn-light';
      monaco.editor.setTheme(currentTheme);
    }
  }, [isDarkMode]);

  const handleOutputEditorMount: OnMount = useCallback((editor, monaco) => {
    outputEditorRef.current = editor;
    if (monaco) {
      defineMonacoThemes(monaco);
      const currentTheme = isDarkMode ? 'shadcn-dark' : 'shadcn-light';
      monaco.editor.setTheme(currentTheme);
    }
  }, [isDarkMode]);

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
            <UnifiedButton
              variant="outline"
              size="xs"
              icon={FileJson}
              text="Sample"
              onClick={handleSample}
              title="Load Sample JSON"
            />
            <UnifiedButton
              variant="red"
              size="xs"
              icon={RotateCcw}
              text="Reset"
              onClick={handleReset}
              disabled={!input && !output}
              title="Reset All"
            />
            <JsonActionButtons />
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
                theme={isDarkMode ? 'shadcn-dark' : 'shadcn-light'}
                onMount={handleInputEditorMount}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  wordWrap: 'on',
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  formatOnPaste: true,
                  formatOnType: true,
                  folding: true,
                  bracketPairColorization: { enabled: true },
                  padding: { top: 10, bottom: 10 },
                }}
              />
            </div>
          </div>

          {/* Output editor */}
          <div className="flex-1 min-h-[200px] lg:min-h-[300px] flex flex-col bg-card rounded-lg border">
            <div className="px-2 py-1 bg-muted border-b text-xs font-medium text-muted-foreground flex items-center justify-between">
              <span>Formatted Output</span>
              <div className="flex items-center gap-1 sm:gap-2">
                <UnifiedButton
                  variant="outline"
                  icon={copied ? Check : Copy}
                  text={copied ? 'Copied' : 'Copy'}
                  onClick={handleCopy}
                  disabled={!output}
                  style={{ minHeight: '44px' }}
                  className="h-11 sm:h-10"
                />
                <UnifiedButton
                  variant="outline"
                  icon={Download}
                  text="Download"
                  onClick={handleDownload}
                  disabled={!output}
                  style={{ minHeight: '44px' }}
                  className="h-11 sm:h-10"
                />
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <MonacoEditor
                height="100%"
                language="json"
                value={output}
                theme={isDarkMode ? 'shadcn-dark' : 'shadcn-light'}
                onMount={handleOutputEditorMount}
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 14,
                  wordWrap: 'on',
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  folding: true,
                  bracketPairColorization: { enabled: true },
                  padding: { top: 10, bottom: 10 },
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}