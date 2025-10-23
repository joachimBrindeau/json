import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseClipboardOptions {
  successMessage?: string;
  errorMessage?: string;
  successDescription?: string;
  errorDescription?: string;
  resetDelay?: number;
}

/**
 * Custom hook for clipboard operations with automatic state management
 * @param options Configuration options for toast messages and timing
 * @returns Object with copy function and copied state
 */
export function useClipboard(options: UseClipboardOptions = {}) {
  const {
    successMessage = 'Copied!',
    errorMessage = 'Failed to copy',
    successDescription = 'Content copied to clipboard',
    errorDescription = 'Could not copy to clipboard',
    resetDelay = 2000,
  } = options;

  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copy = useCallback(
    async (text: string) => {
      if (!text) {
        toast({
          title: errorMessage,
          description: 'No content to copy',
          variant: 'destructive',
        });
        return false;
      }

      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), resetDelay);
        toast({
          title: successMessage,
          description: successDescription,
        });
        return true;
      } catch (error) {
        toast({
          title: errorMessage,
          description: errorDescription,
          variant: 'destructive',
        });
        return false;
      }
    },
    [toast, successMessage, errorMessage, successDescription, errorDescription, resetDelay]
  );

  return { copy, copied };
}
