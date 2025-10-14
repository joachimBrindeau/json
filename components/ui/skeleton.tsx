'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Skeleton = memo<SkeletonProps>(({ className, ...props }) => (
  <div
    className={cn(
      'animate-pulse rounded-md bg-muted',
      className
    )}
    {...props}
  />
));

Skeleton.displayName = 'Skeleton';

// Page-specific skeleton screens
export const PageSkeleton = memo(() => (
  <div className="h-full flex flex-col">
    {/* Header skeleton */}
    <div className="border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
      </div>
    </div>

    {/* Content skeleton */}
    <div className="flex-1 flex">
      {/* Sidebar skeleton */}
      <div className="w-64 border-r bg-background/50">
        <div className="p-4 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex-1 p-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    </div>
  </div>
));

PageSkeleton.displayName = 'PageSkeleton';

export const JsonViewerSkeleton = memo(() => (
  <div className="h-full flex flex-col">
    {/* Tabs skeleton */}
    <div className="border-b bg-muted/30">
      <div className="flex">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-20 m-1 rounded" />
        ))}
      </div>
    </div>

    {/* Content skeleton */}
    <div className="flex-1 p-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
        {/* Editor skeleton */}
        <div className="border rounded-lg">
          <div className="border-b p-2 flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-24 ml-auto" />
          </div>
          <div className="p-4 space-y-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className={`h-4 ${i % 3 === 0 ? 'w-1/2' : i % 3 === 1 ? 'w-3/4' : 'w-full'}`} />
            ))}
          </div>
        </div>

        {/* Viewer skeleton */}
        <div className="border rounded-lg">
          <div className="border-b p-2">
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="p-4">
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Skeleton className="h-4 w-4 mt-1" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
));

JsonViewerSkeleton.displayName = 'JsonViewerSkeleton';

export const LibrarySkeleton = memo(() => (
  <div className="h-full p-6">
    <div className="mb-6">
      <Skeleton className="h-8 w-48 mb-2" />
      <Skeleton className="h-4 w-96" />
    </div>

    {/* Search bar skeleton */}
    <div className="mb-6 flex items-center gap-4">
      <Skeleton className="h-10 flex-1 max-w-md" />
      <Skeleton className="h-10 w-32" />
      <Skeleton className="h-10 w-24" />
    </div>

    {/* Grid skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="border rounded-lg overflow-hidden">
          <Skeleton className="h-32 w-full" />
          <div className="p-4 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
            <div className="flex items-center gap-2 mt-3">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-12" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
));

LibrarySkeleton.displayName = 'LibrarySkeleton';