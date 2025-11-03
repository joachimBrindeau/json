'use client';

import dynamic from 'next/dynamic';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

/**
 * Monaco Editor with loading state
 * Shared component to avoid duplication across the codebase
 */
export const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  loading: () => (
    <div className="h-full flex items-center justify-center bg-background border">
      <div className="text-center">
        <LoadingSpinner size="md" label="Loading Code Editor..." />
      </div>
    </div>
  ),
  ssr: false,
});
