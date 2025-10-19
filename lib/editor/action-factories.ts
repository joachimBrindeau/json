import type { EditorAction } from '@/types/editor-actions';
import { Copy, Download, Trash2, FileJson, Zap, Minimize2, ArrowRightLeft, Check, Undo, Redo } from 'lucide-react';

/**
 * Factory function options for creating actions
 */
interface ActionFactoryOptions {
  /** Unique identifier for the action */
  id?: string;
  /** Custom label for the action */
  label?: string;
  /** Custom tooltip text */
  tooltip?: string;
  /** Position of the action button */
  position?: 'left' | 'right';
  /** Whether to show text on larger screens */
  showText?: boolean;
  /** Custom variant */
  variant?: 'outline' | 'blue' | 'green' | 'red' | 'destructive';
  /** Additional className */
  className?: string;
}

interface CopyActionOptions extends ActionFactoryOptions {
  /** The data to copy */
  data: string;
  /** Copy function from useClipboard hook */
  copy: (text: string) => Promise<void | boolean>;
  /** Toast function for error messages */
  toast: (options: { title: string; description: string; variant?: 'destructive' }) => void;
  /** Whether the data was copied (for showing check icon) */
  copied?: boolean;
  /** Custom error message when no data */
  noDataMessage?: string;
}

interface DownloadActionOptions extends ActionFactoryOptions {
  /** The data to download */
  data: string;
  /** Download function from useDownload hook */
  download: (content: string, filename: string, mimeType: string) => void;
  /** Toast function for error messages */
  toast: (options: { title: string; description: string; variant?: 'destructive' }) => void;
  /** Filename (without extension) */
  filename?: string;
  /** File extension */
  fileExtension?: string;
  /** MIME type */
  mimeType?: string;
  /** Custom error message when no data */
  noDataMessage?: string;
}

interface ResetActionOptions extends ActionFactoryOptions {
  /** Reset callback */
  onReset: () => void;
  /** Whether there's data to reset */
  hasData: boolean;
  /** Whether to require confirmation (default: true) */
  requireConfirm?: boolean;
  /** Custom confirmation title */
  confirmTitle?: string;
  /** Custom confirmation description */
  confirmDescription?: string;
  /** Confirmation variant */
  confirmVariant?: 'default' | 'destructive' | 'warning' | 'info';
}

interface FormatActionOptions extends ActionFactoryOptions {
  /** Format callback */
  onFormat: () => void;
  /** Whether the data is valid and can be formatted */
  canFormat: boolean;
  /** Whether formatting is in progress */
  isLoading?: boolean;
}

interface MinifyActionOptions extends ActionFactoryOptions {
  /** Minify callback */
  onMinify: () => void;
  /** Whether the data is valid and can be minified */
  canMinify: boolean;
  /** Whether minifying is in progress */
  isLoading?: boolean;
}

interface ConvertActionOptions extends ActionFactoryOptions {
  /** Convert callback */
  onConvert: () => void;
  /** Whether the data is valid and can be converted */
  canConvert: boolean;
  /** Whether converting is in progress */
  isLoading?: boolean;
}

/**
 * Create a copy action
 */
export function createCopyAction({
  data,
  copy,
  toast,
  copied = false,
  id = 'copy',
  label = 'Copy',
  tooltip,
  position = 'right',
  showText = false,
  variant = 'outline',
  noDataMessage = 'Add data first',
  className,
}: CopyActionOptions): EditorAction {
  return {
    id,
    label,
    icon: copied ? Check : Copy,
    onClick: async () => {
      if (!data) {
        toast({
          title: 'No data',
          description: noDataMessage,
          variant: 'destructive',
        });
        return;
      }
      await copy(data);
    },
    disabled: !data,
    variant,
    position,
    showText,
    tooltip: tooltip || (copied ? 'Copied!' : `Copy ${label.toLowerCase()}`),
    className,
  };
}

/**
 * Create a download action
 */
export function createDownloadAction({
  data,
  download,
  toast,
  id = 'download',
  label = 'Download',
  tooltip,
  position = 'right',
  showText = false,
  variant = 'outline',
  filename = 'output',
  fileExtension = 'json',
  mimeType = 'application/json',
  noDataMessage = 'Add data first',
  className,
}: DownloadActionOptions): EditorAction {
  return {
    id,
    label,
    icon: Download,
    onClick: () => {
      if (!data) {
        toast({
          title: 'No data',
          description: noDataMessage,
          variant: 'destructive',
        });
        return;
      }
      download(data, `${filename}.${fileExtension}`, mimeType);
    },
    disabled: !data,
    variant,
    position,
    showText,
    tooltip: tooltip || `Download ${label.toLowerCase()}`,
    className,
  };
}

/**
 * Create a reset/clear action (uses bin/trash icon with confirmation popover)
 */
export function createResetAction({
  onReset,
  hasData,
  id = 'reset',
  label = 'Clear',
  tooltip,
  position = 'right',
  showText = false,
  variant = 'outline',
  requireConfirm = true,
  confirmTitle,
  confirmDescription,
  confirmVariant = 'destructive',
  className,
}: ResetActionOptions): EditorAction {
  return {
    id,
    label,
    icon: Trash2,
    onClick: onReset,
    disabled: !hasData,
    variant,
    position,
    showText,
    tooltip: tooltip || `Clear ${label.toLowerCase()}`,
    className,
    requireConfirm,
    confirmTitle: confirmTitle || `Clear ${label.toLowerCase()}?`,
    confirmDescription: confirmDescription || 'This action cannot be undone.',
    confirmVariant,
  };
}

/**
 * Create a format action
 */
export function createFormatAction({
  onFormat,
  canFormat,
  isLoading = false,
  id = 'format',
  label = 'Format',
  tooltip,
  position = 'left',
  showText = true,
  variant = 'blue',
  className,
}: FormatActionOptions): EditorAction {
  return {
    id,
    label,
    icon: Zap,
    onClick: onFormat,
    disabled: !canFormat,
    variant,
    position,
    showText,
    tooltip: tooltip || 'Format JSON',
    loading: isLoading,
    loadingText: 'Formatting...',
    className,
  };
}

/**
 * Create a minify action
 */
export function createMinifyAction({
  onMinify,
  canMinify,
  isLoading = false,
  id = 'minify',
  label = 'Minify',
  tooltip,
  position = 'left',
  showText = true,
  variant = 'outline',
  className,
}: MinifyActionOptions): EditorAction {
  return {
    id,
    label,
    icon: Minimize2,
    onClick: onMinify,
    disabled: !canMinify,
    variant,
    position,
    showText,
    tooltip: tooltip || 'Minify JSON',
    loading: isLoading,
    loadingText: 'Minifying...',
    className,
  };
}

/**
 * Create a convert action
 */
export function createConvertAction({
  onConvert,
  canConvert,
  isLoading = false,
  id = 'convert',
  label = 'Convert',
  tooltip,
  position = 'left',
  showText = true,
  variant = 'blue',
  className,
}: ConvertActionOptions): EditorAction {
  return {
    id,
    label,
    icon: ArrowRightLeft,
    onClick: onConvert,
    disabled: !canConvert,
    variant,
    position,
    showText,
    tooltip: tooltip || 'Convert to selected format',
    loading: isLoading,
    loadingText: 'Converting...',
    className,
  };
}

interface UndoRedoActionOptions extends ActionFactoryOptions {
  /** Editor instance from Monaco */
  editor: any;
  /** Whether undo/redo is available */
  canUndo?: boolean;
  canRedo?: boolean;
}

/**
 * Create an undo action using Monaco's native undo
 */
export function createUndoAction({
  editor,
  canUndo = true,
  id = 'undo',
  label = 'Undo',
  tooltip,
  position = 'right',
  showText = false,
  variant = 'outline',
  className,
}: UndoRedoActionOptions): EditorAction {
  return {
    id,
    label,
    icon: Undo,
    onClick: () => {
      // editor is a ref object, need to access .current
      const editorInstance = editor?.current || editor;
      if (editorInstance && typeof editorInstance.trigger === 'function') {
        editorInstance.trigger('keyboard', 'undo', null);
      }
    },
    disabled: !canUndo || !editor,
    variant,
    position,
    showText,
    tooltip: tooltip || 'Undo (Ctrl+Z)',
    className,
  };
}

/**
 * Create a redo action using Monaco's native redo
 */
export function createRedoAction({
  editor,
  canRedo = true,
  id = 'redo',
  label = 'Redo',
  tooltip,
  position = 'right',
  showText = false,
  variant = 'outline',
  className,
}: UndoRedoActionOptions): EditorAction {
  return {
    id,
    label,
    icon: Redo,
    onClick: () => {
      // editor is a ref object, need to access .current
      const editorInstance = editor?.current || editor;
      if (editorInstance && typeof editorInstance.trigger === 'function') {
        editorInstance.trigger('keyboard', 'redo', null);
      }
    },
    disabled: !canRedo || !editor,
    variant,
    position,
    showText,
    tooltip: tooltip || 'Redo (Ctrl+Y)',
    className,
  };
}

