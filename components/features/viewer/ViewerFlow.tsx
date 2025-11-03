/**
 * Flow diagram mode - visual flow representation
 */

'use client';

import dynamic from 'next/dynamic';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

const FlowView = dynamic(() => import('./flow/FlowView').then((m) => ({ default: m.FlowView })), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <LoadingSpinner />
    </div>
  ),
});

interface ViewerFlowProps {
  data: any;
  height?: number;
  searchTerm?: string;
}

export const ViewerFlow = ({ data, height, searchTerm }: ViewerFlowProps) => {
  return (
    <ErrorBoundary
      level="component"
      fallback={
        <div className="flex items-center justify-center h-full">
          <p className="text-sm text-muted-foreground">Failed to render flow diagram</p>
        </div>
      }
      enableRetry
      maxRetries={2}
    >
      <div style={height ? { height } : undefined} className={height ? 'w-full' : 'w-full h-full'}>
        <FlowView json={data} searchTerm={searchTerm} />
      </div>
    </ErrorBoundary>
  );
};
