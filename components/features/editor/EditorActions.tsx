/**
 * @deprecated This component is deprecated. Use action factory functions instead.
 *
 * Migration guide:
 * ```typescript
 * // Old approach:
 * import { EditorActions } from '@/components/features/editor/EditorActions';
 * <EditorActions output={output} hasContent={!!output} onReset={handleReset} />
 *
 * // New approach:
 * import { createResetAction } from '@/lib/editor/action-factories';
 *
 * const actions = useMemo(() => [
 *   createResetAction({ onReset: handleReset, hasData: !!output }),
 * ], [output]);
 *
 * <EditorPane actions={actions} customActions={<ViewerActions />} ... />
 * ```
 *
 * This file is kept for backward compatibility but will be removed in a future version.
 * All editor pages have been migrated to use the new action-based architecture.
 */

import type { EditorAction } from '@/types/editor-actions';
import {
  createCopyAction,
  createDownloadAction,
  createResetAction,
} from '@/lib/editor/action-factories';

interface CreateEditorActionsOptions {
  /** The output/result data to copy or download */
  output: string;
  /** Whether there's any input or output to reset */
  hasContent: boolean;
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
  /** Copy function from useClipboard hook */
  copy: (text: string) => Promise<void>;
  /** Download function from useDownload hook */
  download: (content: string, filename: string, mimeType: string) => void;
  /** Toast function for error messages */
  toast: (options: { title: string; description: string; variant?: 'destructive' }) => void;
  /** Whether data was copied */
  copied?: boolean;
}

/**
 * Factory function to create editor actions
 * @deprecated Use createStandardInputActions or createStandardOutputActions from action-presets instead
 */
export function createEditorActionsArray({
  output,
  hasContent,
  onReset,
  filename = 'output',
  fileExtension = 'json',
  mimeType = 'application/json',
  outputLabel = 'output',
  copy,
  download,
  toast,
  copied = false,
}: CreateEditorActionsOptions): EditorAction[] {
  const actions: EditorAction[] = [];

  actions.push(
    createCopyAction({
      data: output,
      copy,
      toast,
      copied,
      position: 'right',
      showText: false,
      tooltip: copied ? 'Copied!' : `Copy ${outputLabel}`,
      noDataMessage: `Generate ${outputLabel} first`,
    })
  );

  actions.push(
    createDownloadAction({
      data: output,
      download,
      toast,
      position: 'right',
      showText: false,
      tooltip: `Download ${outputLabel}`,
      filename,
      fileExtension,
      mimeType,
      noDataMessage: `Generate ${outputLabel} first`,
    })
  );

  if (onReset) {
    actions.push(
      createResetAction({
        onReset,
        hasData: hasContent,
        position: 'right',
        showText: true,
        tooltip: 'Reset All',
      })
    );
  }

  return actions;
}
