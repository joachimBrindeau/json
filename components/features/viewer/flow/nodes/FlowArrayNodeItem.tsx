import { memo } from 'react';
import { FlowHandle } from '@/components/features/viewer/flow/FlowHandle';
import { cn } from '@/lib/utils';

type Props = {
  nodeId: string;
  itemIndex: number;
  childNodeId: string;
  totalItems: number;
};

const ArrayNodeItemComponent = ({ 
  nodeId: _nodeId, // eslint-disable-line @typescript-eslint/no-unused-vars
  itemIndex, 
  childNodeId: _childNodeId, // eslint-disable-line @typescript-eslint/no-unused-vars
  totalItems 
}: Props) => {
  const isLastItem = itemIndex === totalItems - 1;

  return (
    <div
      className={cn(
        'relative flex items-center justify-between px-3 py-2.5 transition-colors',
        'hover:bg-blue-50 dark:hover:bg-blue-950/30',
        'border-b border-blue-100 dark:border-blue-900/50',
        isLastItem && 'border-b-0'
      )}
    >
      <div className="flex items-center gap-3 flex-1">
        <div className="flex items-center justify-center min-w-[48px] h-7 px-2.5 rounded-md bg-blue-100 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-800">
          <span className="font-mono font-semibold text-blue-700 dark:text-blue-300 text-xs">
            [{itemIndex}]
          </span>
        </div>

        <div className="flex items-center gap-2 text-gray-400 dark:text-gray-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </div>
      </div>

      <FlowHandle
        style={{ backgroundColor: '#60a5fa', borderColor: '#3b82f6' }}
        id={String(itemIndex)}
        type="source"
        direction="horizontal"
      />
    </div>
  );
};

export const FlowArrayNodeItem = memo(ArrayNodeItemComponent);
