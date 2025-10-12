// Shared component utilities for JSON viewer components
// This reduces duplication across the codebase

// Base Components
export { BaseModal, ConfirmationModal, InfoModal, SuccessModal } from './base-modal';
export type { BaseModalProps, BaseModalRef } from './base-modal';

export { JsonViewerBase } from './json-viewer-base';
export type { JsonViewerBaseProps, ViewerMode } from './json-viewer-base';

// Node Rendering
export {
  NodeRenderer,
  CompactNodeRenderer,
  ListNodeRenderer,
  TreeNodeRenderer,
  useNodeRenderer
} from './node-renderer';
export type {
  NodeRendererProps,
  CompactNodeRendererProps,
  ListNodeRendererProps,
  TreeNodeRendererProps
} from './node-renderer';

// Empty States
export {
  EmptyState,
  JsonEmptyState,
  ViewerEmptyState,
  TreeEmptyState,
  SeaEmptyState,
  ListEmptyState,
  SearchEmptyState,
  FilterEmptyState,
  UploadEmptyState,
  JsonErrorState,
  LoadingErrorState,
  LoadingState,
  PerformanceWarningState,
} from './empty-states';

// Hooks
export {
  useJsonProcessing,
  getValueType,
  estimateSize,
  formatJsonValue,
  getTypeColor,
  formatFileSize,
  detectJsonFormat,
} from './hooks/useJsonProcessing';
export type { 
  JsonNode, 
  JsonStats, 
  JsonValidationResult, 
  UseJsonProcessingOptions 
} from './hooks/useJsonProcessing';

// Re-export commonly used types and utilities
export type {
  ViewerMode,
} from './json-viewer-base';