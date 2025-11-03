// Shared component utilities for JSON viewer components
// This reduces duplication across the codebase

// Base Components
export { BaseModal, ConfirmationModal, InfoModal, SuccessModal } from './BaseModal';
export type { BaseModalProps, BaseModalRef } from './BaseModal';

export { JsonViewerBase } from './JsonViewerBase';
export type { JsonViewerBaseProps, ViewerMode } from './JsonViewerBase';

// Error Handling
export { ErrorBoundary } from './ErrorBoundary';

// Loading Components
export { LoadingSpinner } from './LoadingSpinner';
export { LoadingState as LoadingStateComponent } from './LoadingState';

// Service Worker & Version
export { ServiceWorkerManager } from './ServiceWorkerManager';
export { VersionChecker } from './VersionChecker';

// Search
export { SearchBar } from './SearchBar';

// Node Rendering
export {
  NodeRenderer,
  CompactNodeRenderer,
  ListNodeRenderer,
  TreeNodeRenderer,
  useNodeRenderer,
} from './node-renderer';
export type {
  NodeRendererProps,
  CompactNodeRendererProps,
  ListNodeRendererProps,
  TreeNodeRendererProps,
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
} from './EmptyStates';

// Providers
export { NavigationProvider } from './providers/NavigationProvider';
export { AuthSessionProvider } from './providers/SessionProvider';

// SEO
export { WebVitals } from './seo/WebVitals';
export { PerformanceOptimizations } from './seo/PerformanceOptimizations';
export { Analytics } from './seo/analytics';

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
  UseJsonProcessingOptions,
} from './hooks/useJsonProcessing';
