import type { EditorAction } from '@/types/editor-actions';
import {
  createCopyAction,
  createDownloadAction,
  createResetAction,
  createFormatAction,
  createMinifyAction,
  createConvertAction,
  createUndoAction,
  createRedoAction,
} from './action-factories';

/**
 * Handlers for standard input actions
 */
export interface StandardInputHandlers {
  /** Copy function from useClipboard hook */
  copy: (text: string) => Promise<void | boolean>;
  /** Download function from useDownload hook */
  download: (content: string, filename: string, mimeType: string) => void;
  /** Toast function for error messages */
  toast: (options: { title: string; description: string; variant?: 'destructive' }) => void;
  /** Reset callback */
  onReset: () => void;
  /** Monaco editor instance (optional, for undo/redo) */
  editor?: any;
}

/**
 * State for standard input actions
 */
export interface StandardInputState {
  /** Input data */
  input: string;
  /** Whether data was copied */
  copied?: boolean;
  /** Filename for download (without extension) */
  filename?: string;
  /** File extension */
  fileExtension?: string;
  /** MIME type */
  mimeType?: string;
}

/**
 * Handlers for standard output actions
 */
export interface StandardOutputHandlers {
  /** Copy function from useClipboard hook */
  copy: (text: string) => Promise<void | boolean>;
  /** Download function from useDownload hook */
  download: (content: string, filename: string, mimeType: string) => void;
  /** Toast function for error messages */
  toast: (options: { title: string; description: string; variant?: 'destructive' }) => void;
  /** Reset callback */
  onReset: () => void;
}

/**
 * State for standard output actions
 */
export interface StandardOutputState {
  /** Output data */
  output: string;
  /** Whether data was copied */
  copied?: boolean;
  /** Filename for download (without extension) */
  filename?: string;
  /** File extension */
  fileExtension?: string;
  /** MIME type */
  mimeType?: string;
}

/**
 * Create standard input pane actions (Undo, Redo, Clear)
 * Copy, Download, and Share are provided by ViewerActions
 * All actions positioned on the right side
 */
export function createStandardInputActions(
  handlers: StandardInputHandlers,
  state: StandardInputState
): EditorAction[] {
  const actions: EditorAction[] = [];

  // Add undo/redo if editor is available
  if (handlers.editor) {
    actions.push(
      createUndoAction({
        editor: handlers.editor,
        position: 'right',
      }),
      createRedoAction({
        editor: handlers.editor,
        position: 'right',
      })
    );
  }

  // Add clear action
  actions.push(
    createResetAction({
      onReset: handlers.onReset,
      hasData: !!state.input,
      id: 'reset-input',
      position: 'right',
      showText: false,
      tooltip: 'Clear input',
    })
  );

  return actions;
}

/**
 * Create standard output pane actions (Copy, Download, Reset)
 * All actions positioned on the right side
 */
export function createStandardOutputActions(
  handlers: StandardOutputHandlers,
  state: StandardOutputState
): EditorAction[] {
  return [
    createCopyAction({
      data: state.output,
      copy: handlers.copy,
      toast: handlers.toast,
      copied: state.copied,
      id: 'copy-output',
      position: 'right',
      showText: false,
      tooltip: state.copied ? 'Copied!' : 'Copy output',
      noDataMessage: 'Generate output first',
    }),
    createDownloadAction({
      data: state.output,
      download: handlers.download,
      toast: handlers.toast,
      id: 'download-output',
      position: 'right',
      showText: false,
      tooltip: 'Download output',
      filename: state.filename || 'output',
      fileExtension: state.fileExtension || 'json',
      mimeType: state.mimeType || 'application/json',
      noDataMessage: 'Generate output first',
    }),
    createResetAction({
      onReset: handlers.onReset,
      hasData: !!state.output,
      id: 'reset-output',
      position: 'right',
      showText: true,
      tooltip: 'Clear output',
    }),
  ];
}

/**
 * Handlers for format page actions
 */
export interface FormatPageHandlers extends StandardInputHandlers, StandardOutputHandlers {
  /** Format callback */
  onFormat: () => void;
  /** Minify callback */
  onMinify: () => void;
}

/**
 * State for format page
 */
export interface FormatPageState {
  /** Input JSON */
  input: string;
  /** Output JSON */
  output: string;
  /** Whether input is valid */
  hasValidInput: boolean;
  /** Whether data was copied */
  copied?: boolean;
}

/**
 * Create format page input actions
 */
export function createFormatInputActions(
  handlers: Pick<FormatPageHandlers, 'copy' | 'download' | 'toast'>,
  state: Pick<FormatPageState, 'input'>
): EditorAction[] {
  return createStandardInputActions(
    {
      copy: handlers.copy,
      download: handlers.download,
      toast: handlers.toast,
      onReset: () => {}, // Will be overridden
    },
    {
      input: state.input,
      filename: 'input',
      fileExtension: 'json',
      mimeType: 'application/json',
    }
  );
}

/**
 * Create format page output actions (Format, Minify on left; Copy, Download, Reset on right)
 */
export function createFormatOutputActions(
  handlers: Pick<FormatPageHandlers, 'onFormat' | 'onMinify' | 'copy' | 'download' | 'toast'>,
  state: FormatPageState
): EditorAction[] {
  return [
    createFormatAction({
      onFormat: handlers.onFormat,
      canFormat: !!state.input && state.hasValidInput,
      position: 'left',
      showText: true,
    }),
    createMinifyAction({
      onMinify: handlers.onMinify,
      canMinify: !!state.input && state.hasValidInput,
      position: 'left',
      showText: true,
    }),
    createCopyAction({
      data: state.output,
      copy: handlers.copy,
      toast: handlers.toast,
      copied: state.copied,
      id: 'copy-output',
      position: 'right',
      showText: false,
      tooltip: state.copied ? 'Copied!' : 'Copy formatted JSON',
      noDataMessage: 'Format JSON first',
    }),
    createDownloadAction({
      data: state.output,
      download: handlers.download,
      toast: handlers.toast,
      id: 'download-output',
      position: 'right',
      showText: false,
      tooltip: 'Download formatted JSON',
      filename: 'formatted',
      fileExtension: 'json',
      mimeType: 'application/json',
      noDataMessage: 'Format JSON first',
    }),
  ];
}

/**
 * Handlers for convert page actions
 */
export interface ConvertPageHandlers extends StandardInputHandlers, StandardOutputHandlers {
  /** Convert callback */
  onConvert: () => void;
}

/**
 * State for convert page
 */
export interface ConvertPageState {
  /** Input data */
  input: string;
  /** Output data */
  output: string;
  /** Whether input is valid */
  hasValidInput: boolean;
  /** Whether data was copied */
  copied?: boolean;
  /** Input format */
  inputFormat?: string;
  /** Output format */
  outputFormat?: string;
  /** Output file extension */
  outputExtension?: string;
  /** Output MIME type */
  outputMimeType?: string;
}

/**
 * Create convert page output actions (Convert on left; Copy, Download, Reset on right)
 */
export function createConvertOutputActions(
  handlers: Pick<ConvertPageHandlers, 'onConvert' | 'copy' | 'download' | 'toast'>,
  state: ConvertPageState
): EditorAction[] {
  return [
    createConvertAction({
      onConvert: handlers.onConvert,
      canConvert: !!state.input && state.hasValidInput,
      position: 'left',
      showText: true,
    }),
    createCopyAction({
      data: state.output,
      copy: handlers.copy,
      toast: handlers.toast,
      copied: state.copied,
      id: 'copy-output',
      position: 'right',
      showText: false,
      tooltip: state.copied ? 'Copied!' : 'Copy converted data',
      noDataMessage: 'Convert data first',
    }),
    createDownloadAction({
      data: state.output,
      download: handlers.download,
      toast: handlers.toast,
      id: 'download-output',
      position: 'right',
      showText: false,
      tooltip: 'Download converted data',
      filename: 'converted',
      fileExtension: state.outputExtension || 'txt',
      mimeType: state.outputMimeType || 'text/plain',
      noDataMessage: 'Convert data first',
    }),
  ];
}

