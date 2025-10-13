/**
 * Flow diagram mode - visual flow representation
 */

'use client';

import dynamic from 'next/dynamic';
import { ErrorBoundary } from '@/components/shared/error-boundary';

const FlowView = dynamic(
  () => import('./flow/FlowView').then(m => ({ default: m.FlowView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    ),
  }
);

interface ViewerFlowProps {
  data: any;
  height?: number;
}

export const ViewerFlow = ({ data, height = 600 }: ViewerFlowProps) => {
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
    <div style={{ height }} className="w-full">
      <FlowView json={data} />
    </div>
    </ErrorBoundary>
  );
};

