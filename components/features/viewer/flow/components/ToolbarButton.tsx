/**
 * Reusable toolbar button component
 * 
 * Used in FlowNodeToolbar for consistent button styling and behavior
 */

import { LucideIcon } from 'lucide-react';
import { FLOW_STYLES } from '../utils/flow-styles';

interface ToolbarButtonProps {
  onClick: () => void;
  title: string;
  icon: LucideIcon;
}

export const ToolbarButton = ({ onClick, title, icon: Icon }: ToolbarButtonProps) => (
  <button
    onClick={onClick}
    className={FLOW_STYLES.toolbarButton}
    title={title}
  >
    <Icon className="h-3.5 w-3.5" />
  </button>
);

