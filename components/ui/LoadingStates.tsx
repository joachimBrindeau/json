'use client';

/**
 * LoadingStates Component Library
 * 
 * Specialized loading components for various use cases.
 * 
 * **Note:** For basic loading needs, use:
 * - `LoadingSpinner` from '@/components/shared/LoadingSpinner' (simple spinner)
 * - `LoadingState` from '@/components/shared/LoadingState' (spinner + message)
 * 
 * These specialized components are for specific use cases:
 * - `JsonLoading`: JSON-specific loading with progress
 * - `ProcessingLoading`: Multi-step process loading
 * - `SkeletonCard`: Skeleton loading for cards
 * - `JsonViewerSkeleton`: Skeleton loading for JSON viewer
 */

import { Loader2, FileJson, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from './skeleton';

interface JsonLoadingProps {
  message?: string;
  progress?: number;
  className?: string;
}

export function JsonLoading({ message = 'Loading...', progress, className }: JsonLoadingProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center space-y-4 p-8', className)}>
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse opacity-20"></div>
        <FileJson className="h-12 w-12 text-blue-500 animate-bounce relative z-10" />
      </div>
      <div className="text-center space-y-2">
        <p className="text-lg font-medium text-foreground">{message}</p>
        {progress !== undefined && (
          <div className="flex items-center space-x-2">
            <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-sm text-muted-foreground">{progress}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

interface ProcessingLoadingProps {
  steps: Array<{
    label: string;
    completed: boolean;
    current: boolean;
  }>;
  className?: string;
}

export function ProcessingLoading({ steps, className }: ProcessingLoadingProps) {
  return (
    <div className={cn('space-y-4 p-6', className)}>
      <div className="flex items-center space-x-2 mb-4">
        <Activity className="h-5 w-5 text-blue-500 animate-spin" />
        <h3 className="text-lg font-semibold">Processing...</h3>
      </div>

      <div className="space-y-3">
        {steps.map((step, index) => (
          <div
            key={index}
            className={cn(
              'flex items-center space-x-3 p-3 rounded-lg transition-all duration-300',
              step.completed &&
                'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800',
              step.current &&
                !step.completed &&
                'bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800',
              !step.completed && !step.current && 'bg-muted/50'
            )}
          >
            <div
              className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300',
                step.completed && 'bg-green-500',
                step.current && !step.completed && 'bg-blue-500',
                !step.completed && !step.current && 'bg-muted-foreground'
              )}
            >
              {step.completed ? (
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : step.current ? (
                <Loader2 className="w-3 h-3 text-white animate-spin" />
              ) : (
                <span className="w-2 h-2 bg-white rounded-full" />
              )}
            </div>
            <span
              className={cn(
                'text-sm font-medium transition-colors duration-300',
                step.completed && 'text-green-700 dark:text-green-300',
                step.current && !step.completed && 'text-blue-700 dark:text-blue-300',
                !step.completed && !step.current && 'text-muted-foreground'
              )}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-4 p-6 border rounded-lg', className)}>
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-3 w-3/4" />
      </div>
      <div className="flex space-x-2">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-12" />
      </div>
    </div>
  );
}

export function JsonViewerSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-4 p-4', className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <div className="flex space-x-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>

      <div className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="ml-6 space-y-2">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>
    </div>
  );
}
