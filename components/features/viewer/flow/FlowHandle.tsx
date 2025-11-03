import { memo } from 'react';
import { Handle, HandleProps, HandleType, Position } from '@xyflow/react';
import { sizes } from '@/components/features/viewer/flow/utils/flow-constants';

const hiddenHandleStyle = {
  backgroundColor: 'transparent',
  border: 'none',
} as const;

type HandleDirection = 'horizontal' | 'vertical';

const POSITION_MAP: Record<HandleDirection, Record<HandleType, Position>> = {
  horizontal: {
    source: Position.Right,
    target: Position.Left,
  },
  vertical: {
    source: Position.Bottom,
    target: Position.Top,
  },
};

interface FlowHandleProps extends Pick<HandleProps, 'id' | 'type'> {
  direction?: HandleDirection;
  style?: React.CSSProperties;
  isChain?: boolean;
}

const FlowHandleComponent = ({
  id,
  type,
  direction = 'horizontal',
  style = {},
  isChain = false,
}: FlowHandleProps) => {
  const position = POSITION_MAP[direction][type];
  const chainStyle = isChain ? { left: sizes.arrayNodeSize / 2 } : {};

  return (
    <Handle
      id={id}
      type={type}
      position={position}
      style={{ ...hiddenHandleStyle, ...chainStyle, ...style }}
    />
  );
};

export const FlowHandle = memo(FlowHandleComponent);
