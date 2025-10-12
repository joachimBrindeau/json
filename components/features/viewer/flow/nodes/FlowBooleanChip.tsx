import { memo } from 'react';
import { Badge } from '@/components/ui/badge';

type Props = {
  value: boolean;
  size?: 'default' | 'sm' | 'lg';
  className?: string;
};

const _BooleanChip = ({ value, size = 'default', className }: Props) => {
  return (
    <Badge className={className} variant={value ? 'default' : 'destructive'}>
      {JSON.stringify(value)}
    </Badge>
  );
};

export const FlowBooleanChip = memo(_BooleanChip);
export const BooleanChip = FlowBooleanChip;
