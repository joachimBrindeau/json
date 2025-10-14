'use client';

import { lazy, Suspense, ComponentType } from 'react';
import { JsonViewerSkeleton, LibrarySkeleton, Skeleton } from '@/components/ui/skeleton';

// Lazy load heavy components
export const LazyViewer = lazy(() =>
  import('@/components/features/viewer')
    .then(module => ({ default: module.Viewer }))
);

// Backwards compatibility
export const LazyUltraJsonViewer = LazyViewer;

export const LazyMonacoEditor = lazy(() => 
  import('@monaco-editor/react').then(module => ({ default: module.default }))
);

export const LazyReactFlow = lazy(() => 
  import('reactflow').then(module => ({ 
    default: module.ReactFlow 
  }))
);

export const LazyPublishModal = lazy(() => 
  import('@/components/features/modals/publish-modal').then(module => ({ 
    default: module.PublishModal 
  }))
);

export const LazyEmbedModal = lazy(() => 
  import('@/components/features/modals/embed-modal').then(module => ({ 
    default: module.EmbedModal 
  }))
);

export const LazyShareModal = lazy(() =>
  import('@/components/features/modals/share-modal').then(module => ({
    default: module.ShareModal
  }))
);

// Backwards compatibility
export const LazyUnifiedShareModal = LazyShareModal;

// Wrapper components with appropriate loading states
interface LazyComponentWrapperProps {
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

function LazyWrapper({ fallback, children }: LazyComponentWrapperProps) {
  return <Suspense fallback={fallback}>{children}</Suspense>;
}

// High-level lazy components with specific skeletons
export function LazyViewerWithSkeleton(props: any) {
  return (
    <LazyWrapper fallback={<JsonViewerSkeleton />}>
      <LazyViewer {...props} />
    </LazyWrapper>
  );
}

// Backwards compatibility
export const LazyJsonViewerWithSkeleton = LazyViewerWithSkeleton;

export function LazyMonacoEditorWithSkeleton(props: any) {
  return (
    <LazyWrapper fallback={<Skeleton className="h-96 w-full" />}>
      <LazyMonacoEditor {...props} />
    </LazyWrapper>
  );
}

export function LazyReactFlowWithSkeleton(props: any) {
  return (
    <LazyWrapper fallback={<Skeleton className="h-full w-full" />}>
      <LazyReactFlow {...props} />
    </LazyWrapper>
  );
}

// Modal components don't need skeletons as they're usually triggered by user action
export function LazyPublishModalWithSuspense(props: any) {
  return (
    <LazyWrapper fallback={null}>
      <LazyPublishModal {...props} />
    </LazyWrapper>
  );
}

export function LazyEmbedModalWithSuspense(props: any) {
  return (
    <LazyWrapper fallback={null}>
      <LazyEmbedModal {...props} />
    </LazyWrapper>
  );
}

export function LazyShareModalWithSuspense(props: any) {
  return (
    <LazyWrapper fallback={null}>
      <LazyShareModal {...props} />
    </LazyWrapper>
  );
}

// Backwards compatibility
export const LazyUnifiedShareModalWithSuspense = LazyShareModalWithSuspense;

// Generic lazy component loader with retry logic
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback: React.ReactNode = <Skeleton className="h-32 w-full" />
) {
  const LazyComponent = lazy(importFn);
  
  return function LazyComponentWithFallback(props: any) {
    return (
      <Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}