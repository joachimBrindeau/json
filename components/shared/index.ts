// Shared component utilities for JSON viewer components
// This reduces duplication across the codebase

// Base Components
export { BaseModal, ConfirmationModal, InfoModal, SuccessModal } from './BaseModal';
export type { BaseModalProps, BaseModalRef } from './BaseModal';

export { JsonViewerBase } from './JsonViewerBase';
export type { JsonViewerBaseProps, ViewerMode } from './JsonViewerBase';

// Node Rendering
export { 
  NodeRenderer, 
  CompactNodeRenderer, 
  ListNodeRenderer, 
  TreeNodeRenderer,
  useNodeRenderer 
} from './NodeRenderer';
export type { 
  NodeRendererProps, 
  CompactNodeRendererProps, 
  ListNodeRendererProps, 
  TreeNodeRendererProps 
} from './NodeRenderer';

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
} from './EmptyStates';

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
} from './JsonViewerBase';