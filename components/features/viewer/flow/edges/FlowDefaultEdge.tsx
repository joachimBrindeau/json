'use client';

import { memo } from 'react';
import { EdgeProps, getBezierPath } from 'reactflow';

const DefaultEdgeComponent = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) => {
  // Use getBezierPath for smooth curved connections
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Custom styling for highlighted edges
  const isHighlighted = data?.highlighted || false;
  const dynamicStyle = isHighlighted
    ? {
        ...style,
        stroke: '#3b82f6',
        strokeWidth: 3,
      }
    : {
        stroke: '#94a3b8',
        strokeWidth: 2,
        ...style,
      };

  return (
    <path
      id={id}
      style={dynamicStyle}
      className="react-flow__edge-path"
      d={edgePath}
      markerEnd={markerEnd}
    />
  );
};

export const FlowDefaultEdge = memo(DefaultEdgeComponent);
