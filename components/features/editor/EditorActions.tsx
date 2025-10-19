'use client';

import { useCallback } from 'react';
import { UnifiedButton } from '@/components/ui/unified-button';
import { Copy, Download, FileJson, RotateCcw, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useClipboard } from '@/hooks/use-clipboard';
import { useDownload } from '@/hooks/use-download';

interface EditorActionsProps {
  /** The output/result data to copy or download */
  output: string;
  /** Whether there's any input or output to reset */
  hasContent: boolean;
  /** Callback when sample is clicked */
  onSample?: () => void;
  /** Callback when reset is clicked */
  onReset?: () => void;
  /** Filename for download (without extension) */
  filename?: string;
  /** File extension for download */
  fileExtension?: string;
  /** MIME type for download */
  mimeType?: string;
  /** Custom label for the output (e.g., "formatted JSON", "converted data") */
  outputLabel?: string;
}

/**
 * Common action buttons for editor pages (Format, Convert, etc.)
 * Provides: Copy, Download, Sample, Reset functionality
 */
export function EditorActions({
  output,
  hasContent,
  onSample,
  onReset,
  filename = 'output',
  fileExtension = 'json',
  mimeType = 'application/json',
  outputLabel = 'output',
}: EditorActionsProps) {
  const { toast } = useToast();
  const { copy, copied } = useClipboard({
    successMessage: 'Copied!',
    successDescription: `${outputLabel} copied to clipboard`,
  });
  const { download } = useDownload({
    successMessage: 'Downloaded!',
    successDescription: 'File downloaded successfully',
  });

  const handleCopy = useCallback(async () => {
    if (!output) {
      toast({
        title: 'No output',
        description: `Generate ${outputLabel} first`,
        variant: 'destructive',
      });
      return;
    }
    await copy(output);
  }, [output, copy, toast, outputLabel]);

  const handleDownload = useCallback(() => {
    if (!output) {
      toast({
        title: 'No output',
        description: `Generate ${outputLabel} first`,
        variant: 'destructive',
      });
      return;
    }
    download(output, `${filename}.${fileExtension}`, mimeType);
  }, [output, download, toast, filename, fileExtension, mimeType, outputLabel]);

  return (
    <>
      {onSample && (
        <UnifiedButton
          variant="outline"
          size="xs"
          icon={FileJson}
          text="Sample"
          onClick={onSample}
          title="Load Sample JSON"
        />
      )}

      <UnifiedButton
        variant="outline"
        size="xs"
        icon={copied ? Check : Copy}
        text={copied ? 'Copied' : 'Copy'}
        onClick={handleCopy}
        disabled={!output}
        title={`Copy ${outputLabel}`}
      />

      <UnifiedButton
        variant="outline"
        size="xs"
        icon={Download}
        text="Download"
        onClick={handleDownload}
        disabled={!output}
        title={`Download ${outputLabel}`}
      />

      {onReset && (
        <UnifiedButton
          variant="red"
          size="xs"
          icon={RotateCcw}
          text="Reset"
          onClick={onReset}
          disabled={!hasContent}
          title="Reset All"
        />
      )}
    </>
  );
}
