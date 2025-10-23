/**
 * Connection statistics display component
 *
 * Shows incoming/outgoing connection counts with tooltips
 */

import { Node } from '@xyflow/react';
import { ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { FLOW_STYLES } from '../utils/flow-styles';

interface Connection {
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
}

interface ConnectionStatsProps {
  sourceConnections: Connection[];
  targetConnections: Connection[];
  connectedNodesData: Node[];
}

export const ConnectionStats = ({
  sourceConnections,
  targetConnections,
  connectedNodesData,
}: ConnectionStatsProps) => (
  <div className={FLOW_STYLES.connectionStats}>
    <div className={FLOW_STYLES.connectionStat} title={`Incoming: ${targetConnections.length}`}>
      <ArrowDownToLine className="h-3 w-3" />
      <span>{targetConnections.length}</span>
    </div>
    <div
      className={FLOW_STYLES.connectionStat}
      title={
        connectedNodesData.length > 0
          ? `Connected to: ${connectedNodesData.map((n) => n?.data?.label || n?.id).join(', ')}`
          : `Outgoing: ${sourceConnections.length}`
      }
    >
      <ArrowUpFromLine className="h-3 w-3" />
      <span>{sourceConnections.length}</span>
    </div>
  </div>
);
