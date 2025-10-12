/**
 * Flow diagram mode - visual flow representation
 */

'use client';

import dynamic from 'next/dynamic';

const JsonFlowView = dynamic(
  () => import('@/components/features/flow-diagram/JsonFlowView'),
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
    <div style={{ height }} className="w-full">
      <JsonFlowView data={data} />
    </div>
  );
};

