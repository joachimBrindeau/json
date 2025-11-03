import * as React from 'react';
import { NodeType } from '@/components/features/viewer/flow/utils/flow-types';
import { cn } from '@/lib/utils';

type Props = {
  nodeId: string;
  nodeType: NodeType;
  isHighlight?: boolean;
  children: React.ReactNode;
};

const hostClassNames: Record<NodeType, string> = {
  [NodeType.Object]:
    'group relative flex flex-col min-w-nodeMinWidth max-w-nodeMaxWidth rounded-lg border-2 border-solid border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-3 px-3 hover:border-gray-400 dark:hover:border-gray-600',
  [NodeType.Array]:
    'group relative flex flex-col min-w-nodeMinWidth max-w-nodeMaxWidth rounded-lg border-2 border-solid border-blue-300 dark:border-blue-700 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-gray-900 overflow-hidden hover:border-blue-400 dark:hover:border-blue-600 shadow-sm',
  [NodeType.Primitive]:
    'group relative flex flex-col min-w-nodeMinWidth rounded-lg border-2 border-solid border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-nodePadding px-nodePadding hover:border-gray-400 dark:hover:border-gray-600',
};

const NodeShellComponent = ({ nodeId, nodeType, isHighlight = false, children }: Props) => {
  return (
    <div
      className={cn(
        hostClassNames[nodeType],
        isHighlight && '!border-red-500 dark:!border-red-400 !border-4'
      )}
      data-node-id={nodeId}
    >
      {children}
    </div>
  );
};

export const FlowNodeShell = NodeShellComponent;
