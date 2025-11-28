'use client';

import dynamic from 'next/dynamic';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { configureMonacoLoader } from '@/lib/editor/monaco-loader';

/**
 * Monaco Editor with loading state
 * Shared component to avoid duplication across the codebase
 * 
 * Pre-configures Monaco loader to prevent initialization issues
 * and ensures Monaco is fully ready before rendering the editor
 */
export const MonacoEditor = dynamic(
  async () => {
    // Configure and initialize Monaco loader first
    // This ensures Monaco is ready before the editor component mounts
    try {
      await configureMonacoLoader();
      
      // Wait a bit to ensure Monaco is fully initialized
      // This gives time for any async operations to complete
      await new Promise((resolve) => setTimeout(resolve, 50));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Monaco loader configuration failed:', error);
      // Don't throw - let the component try to load anyway
      // It might still work if @monaco-editor/react handles initialization
    }
    
    // Import the editor component
    // @monaco-editor/react will use the pre-configured loader
    const EditorModule = await import('@monaco-editor/react');
    return EditorModule;
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
