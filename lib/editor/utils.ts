'use client';

import { useCallback } from 'react';
import { validateJson, formatJson as formatJsonUtil } from '@/lib/json/json-utils';

// Shared editor functionality
export const useEditorActions = (
  localContent: string,
  setLocalContent: (value: string) => void,
  setCurrentJson: (value: string) => Promise<void>,
  toast: (props: { title: string; description: string; variant?: string }) => void
) => {
  const formatJson = useCallback(async () => {
    const formatted = formatJsonUtil(localContent);
    if (formatted) {
      setLocalContent(formatted);
      await setCurrentJson(formatted);
      toast({
        title: 'Formatted',
        description: 'JSON has been formatted successfully',
      });
      return formatted;
    } else {
      toast({
        title: 'Invalid JSON',
        description: 'Please enter valid JSON to format',
        variant: 'destructive',
      });
      return null;
    }
  }, [localContent, setCurrentJson, toast, setLocalContent]);

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // File size validation
      if (file.size > 50 * 1024 * 1024) {
        // 50MB limit
        toast({
          title: 'File too large',
          description: 'Please upload a file smaller than 50MB',
          variant: 'destructive',
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = async (event) => {
        const text = event.target?.result as string;
        setLocalContent(text);
        await setCurrentJson(text);

        if (validateJson(text)) {
          // Format after a short delay to ensure state is updated
          setTimeout(() => formatJson(), 100);
        } else {
          toast({
            title: 'Invalid JSON file',
            description: 'The uploaded file does not contain valid JSON',
            variant: 'destructive',
          });
        }
      };
      reader.readAsText(file);
    },
    [setCurrentJson, toast, formatJson, setLocalContent]
  );

  return {
    formatJson,
    handleFileUpload,
  };
};

// Shared editor header component props
export interface EditorHeaderProps {
  title: string;
  localContent: string;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFormat: () => void;
  additionalActions?: React.ReactNode;
}

// File upload trigger
export const triggerFileUpload = () => {
  document.getElementById('file-upload')?.click();
};

// Status bar data
export const useEditorStatus = (content: string) => {
  return {
    charCount: content.length,
    isValid: validateJson(content),
    hasContent: Boolean(content.trim()),
  };
};
