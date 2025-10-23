/**
 * Reusable toolbar button component
 *
 * Used in FlowNodeToolbar for consistent button styling and behavior
 */

import { LucideIcon } from 'lucide-react';
import { FLOW_STYLES } from '../utils/flow-styles';
import { TooltipWrapper } from '@/components/ui/tooltip';

interface ToolbarButtonProps {
  onClick: () => void;
  title: string;
  icon: LucideIcon;
}

export const ToolbarButton = ({ onClick, title, icon: Icon }: ToolbarButtonProps) => (
  <TooltipWrapper content={title}>
    <button onClick={onClick} className={FLOW_STYLES.toolbarButton}>
      <Icon className="h-3.5 w-3.5" />
    </button>
  </TooltipWrapper>
);
