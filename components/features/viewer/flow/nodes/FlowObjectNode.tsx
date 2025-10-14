import { memo, useCallback } from 'react';
import { NodeProps, useEdges, NodeToolbar, Position, useHandleConnections, useNodesData } from '@xyflow/react';
import { Copy, Maximize2, Minimize2, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { NodeType, ObjectNodeData } from '@/components/features/viewer/flow/utils/flow-types';
import { FlowNodeShell } from '@/components/features/viewer/flow/nodes/FlowNodeShell';
import { FlowObjectNodeProperty } from '@/components/features/viewer/flow/nodes/FlowObjectNodeProperty';
import { FlowNodeHandles } from '@/components/features/viewer/flow/FlowNodeHandles';
import { FlowCollapseButton } from '@/components/features/viewer/flow/FlowCollapseButton';
import { useToast } from '@/hooks/use-toast';

const ObjectNodeComponent = ({ id, data }: NodeProps<ObjectNodeData>) => {
  const edges = useEdges();
  const { obj, isRootNode, isCollapsed, onToggleCollapse, stringifiedJson } = data;
  const hasChildren = edges.some((edge) => edge.source === id);
  const { toast } = useToast();

  // Track connections
  const sourceConnections = useHandleConnections({ type: 'source', nodeId: id });
  const targetConnections = useHandleConnections({ type: 'target', nodeId: id });

  // Get connected nodes data
  const connectedNodeIds = sourceConnections.map(conn => conn.target);
  const connectedNodesData = useNodesData(connectedNodeIds);

  const handleCopy = () => {
    navigator.clipboard.writeText(stringifiedJson);
    toast({
      title: 'Copied!',
      description: 'Object JSON copied to clipboard',
    });
  };

  const handleToggle = () => {
    if (onToggleCollapse) {
      onToggleCollapse(id);
    }
  };

  const renderProperties = useCallback(() => {
    return Object.entries(obj).map(([propertyK, propertyV]) => {
      const hasChildNode = edges.some(
        ({ source, sourceHandle }) => source === id && sourceHandle === propertyK
      );

      return (
        <FlowObjectNodeProperty
          key={propertyK}
          nodeId={id}
          propertyK={propertyK}
          propertyV={propertyV}
          hasChildNode={hasChildNode}
        />
      );
    });
  }, [obj, edges, id]);

  return (
    <>
      <NodeToolbar
        isVisible
        position={Position.Top}
        align="center"
        offset={10}
        className="flex gap-1 bg-white dark:bg-gray-950 p-1 rounded shadow-lg border border-gray-200 dark:border-gray-800"
      >
        <button
          onClick={handleCopy}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
          title="Copy JSON"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
        {hasChildren && onToggleCollapse && (
          <button
            onClick={handleToggle}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? (
              <Maximize2 className="h-3.5 w-3.5" />
            ) : (
              <Minimize2 className="h-3.5 w-3.5" />
            )}
          </button>
        )}
        <div className="flex items-center gap-2 px-2 text-xs text-gray-600 dark:text-gray-400 border-l border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-1" title={`Incoming: ${targetConnections.length}`}>
            <ArrowDownToLine className="h-3 w-3" />
            <span>{targetConnections.length}</span>
          </div>
          <div
            className="flex items-center gap-1"
            title={connectedNodesData.length > 0
              ? `Connected to: ${connectedNodesData.map(n => n?.data?.label || n?.id).join(', ')}`
              : `Outgoing: ${sourceConnections.length}`
            }
          >
            <ArrowUpFromLine className="h-3 w-3" />
            <span>{sourceConnections.length}</span>
          </div>
        </div>
      </NodeToolbar>

      <FlowNodeShell nodeId={id} nodeType={NodeType.Object}>
        <FlowNodeHandles nodeId={id} isRootNode={isRootNode} />

        {hasChildren && onToggleCollapse && (
          <FlowCollapseButton
            nodeId={id}
            isCollapsed={!!isCollapsed}
            onToggle={onToggleCollapse}
            position="right"
          />
        )}

        <div className="space-y-0">{renderProperties()}</div>
      </FlowNodeShell>
    </>
  );
};

export const FlowObjectNode = memo(ObjectNodeComponent);
