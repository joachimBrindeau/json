// Shared component utilities for JSON viewer components
// This reduces duplication across the codebase

// Base Components
export { BaseModal, ConfirmationModal, InfoModal, SuccessModal } from './base-modal';
export type { BaseModalProps, BaseModalRef } from './base-modal';

export { JsonViewerBase } from './json-viewer-base';
export type { JsonViewerBaseProps, ViewerMode } from './json-viewer-base';

// Error Handling
export { ErrorBoundary } from './error-boundary';

// Loading Components
export { LoadingSpinner } from './loading-spinner';
export { LoadingState as LoadingStateComponent } from './loading-state';

// Service Worker & Version
export { ServiceWorkerManager } from './service-worker-manager';
export { VersionChecker } from './version-checker';

// Search
export { SearchBar } from './search-bar';

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
} from './empty-states';

// Providers
export { NavigationProvider } from './providers/navigation-provider';
export { AuthSessionProvider } from './providers/session-provider';

// SEO
export { WebVitals } from './seo/web-vitals';
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
