import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseDownloadOptions {
  successMessage?: string;
  errorMessage?: string;
  successDescription?: string;
  errorDescription?: string;
}

/**
 * Custom hook for file download operations
 * @param options Configuration options for toast messages
 * @returns Function to trigger file download
 */
export function useDownload(options: UseDownloadOptions = {}) {
  const {
    successMessage = 'Downloaded!',
    errorMessage = 'Failed to download',
    successDescription = 'File downloaded successfully',
    errorDescription = 'Could not download file',
  } = options;

  const { toast } = useToast();

  const download = useCallback((
    content: string | Blob,
    filename: string,
    mimeType: string = 'application/json'
  ) => {
    if (!content) {
      toast({
        title: errorMessage,
        description: 'No content to download',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const blob = typeof content === 'string'
        ? new Blob([content], { type: mimeType })
        : content;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

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
  }, [toast, successMessage, errorMessage, successDescription, errorDescription]);

  return { download };
}
