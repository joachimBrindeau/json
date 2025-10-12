import * as React from 'react';
import { memo, useMemo } from 'react';
import { Handle, HandleProps, HandleType, Position } from 'reactflow';

const hiddenHandleStyle = {
  backgroundColor: 'transparent',
  border: 'none',
};

type Props = Pick<HandleProps, 'id' | 'type'> & {
  style?: React.CSSProperties;
};

const DefaultHandleComponent = ({ id, type, style = {} }: Props) => {
  const handleTypeToPositionMap: Record<HandleType, Position> = useMemo(
    () => ({
      source: Position.Right,
      target: Position.Left,
    }),
    []
  );

  return (
    <Handle
      style={{ ...hiddenHandleStyle, ...style }}
      id={id}
      type={type}
      position={handleTypeToPositionMap[type]}
    />
  );
};

export const FlowDefaultHandle = memo(DefaultHandleComponent);
export const DefaultHandle = FlowDefaultHandle;
