'use client';

import { lazy, Suspense, ComponentType } from 'react';
import { JsonViewerSkeleton, LibrarySkeleton } from '@/components/ui/skeleton-screen';
import { Skeleton } from '@/components/ui/skeleton-screen';

// Lazy load heavy components
export const LazyUltraJsonViewer = lazy(() => 
  import('@/components/features/viewer/ultra-optimized-viewer/UltraJsonViewer')
    .then(module => ({ default: module.UltraJsonViewer }))
);

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

export const LazyUnifiedShareModal = lazy(() => 
  import('@/components/features/modals/unified-share-modal').then(module => ({ 
    default: module.UnifiedShareModal 
  }))
);

// Wrapper components with appropriate loading states
interface LazyComponentWrapperProps {
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

function LazyWrapper({ fallback, children }: LazyComponentWrapperProps) {
  return <Suspense fallback={fallback}>{children}</Suspense>;
}

// High-level lazy components with specific skeletons
export function LazyJsonViewerWithSkeleton(props: any) {
  return (
    <LazyWrapper fallback={<JsonViewerSkeleton />}>
      <LazyUltraJsonViewer {...props} />
    </LazyWrapper>
  );
}

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

export function LazyUnifiedShareModalWithSuspense(props: any) {
  return (
    <LazyWrapper fallback={null}>
      <LazyUnifiedShareModal {...props} />
    </LazyWrapper>
  );
}

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