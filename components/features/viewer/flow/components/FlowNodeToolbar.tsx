/**
 * Unified NodeToolbar component for Flow nodes
 *
 * Consolidates duplicate toolbar implementation from FlowObjectNode and FlowArrayNode
 * Follows DRY principle - single source of truth for node toolbar behavior
 *
 * NOTE: This is an embedded toolbar (not using @xyflow/react NodeToolbar) so it scales with zoom
 */

import { Node } from '@xyflow/react';
import { Copy, Maximize2, Minimize2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FLOW_STYLES } from '../utils/flow-styles';
import { ToolbarButton } from './ToolbarButton';
import { ConnectionStats } from './ConnectionStats';

interface Connection {
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
}

interface FlowNodeToolbarProps {
  nodeId: string;
  stringifiedJson: string;
  hasChildren: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: (nodeId: string) => void;
  sourceConnections: Connection[];
  targetConnections: Connection[];
  connectedNodesData: Node[];
  copyDescription: string;
}

export const FlowNodeToolbar = ({
  nodeId,
  stringifiedJson,
  hasChildren,
  isCollapsed,
  onToggleCollapse,
  sourceConnections,
  targetConnections,
  connectedNodesData,
  copyDescription,
}: FlowNodeToolbarProps) => {
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(stringifiedJson);
    toast({
      title: 'Copied!',
      description: copyDescription,
    });
  };

  const handleToggle = () => {
    if (onToggleCollapse) {
      onToggleCollapse(nodeId);
    }
  };

  return (
    <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-10">
      <div className={FLOW_STYLES.toolbar}>
        <ToolbarButton onClick={handleCopy} title="Copy JSON" icon={Copy} />

        {hasChildren && onToggleCollapse && (
          <ToolbarButton
            onClick={handleToggle}
            title={isCollapsed ? 'Expand' : 'Collapse'}
            icon={isCollapsed ? Maximize2 : Minimize2}
          />
        )}

        <ConnectionStats
          sourceConnections={sourceConnections}
          targetConnections={targetConnections}
          connectedNodesData={connectedNodesData}
        />
      </div>
    </div>
  );
};
