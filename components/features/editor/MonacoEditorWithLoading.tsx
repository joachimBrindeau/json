'use client';

import dynamic from 'next/dynamic';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { configureMonacoLoader } from '@/lib/editor/monaco-loader';

/**
 * Monaco Editor with loading state
 * Shared component to avoid duplication across the codebase
 * 
 * Pre-configures Monaco loader to prevent initialization issues
 */
export const MonacoEditor = dynamic(
  async () => {
    // Configure Monaco loader before importing the editor
    // This ensures Monaco is ready when the component mounts
    try {
      await configureMonacoLoader();
    } catch (error) {
      console.warn('Monaco loader configuration failed, will retry:', error);
    }
    return import('@monaco-editor/react');
  },
  {
    loading: () => (
      <div className="h-full flex items-center justify-center bg-background border">
        <div className="text-center">
          <LoadingSpinner size="md" label="Loading Code Editor..." />
        </div>
      </div>
    ),
    ssr: false,
  }
);
