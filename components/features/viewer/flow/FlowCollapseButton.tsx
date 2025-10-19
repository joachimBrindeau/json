import { memo } from 'react';

interface FlowCollapseButtonProps {
  nodeId: string;
  isCollapsed: boolean;
  onToggle: () => void;
  position?: 'right' | 'inline';
}

const FlowCollapseButtonComponent = ({
  nodeId,
  isCollapsed,
  onToggle,
  position = 'right',
}: FlowCollapseButtonProps) => {
  const positionClass = position === 'right' ? 'absolute -right-6 top-1/2 -translate-y-1/2' : '';

  return (
    <div
      className={`${positionClass} bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 w-5 h-5 flex items-center justify-center cursor-pointer hover:border-gray-400 dark:hover:border-gray-600 z-10`}
      style={{ borderRadius: '3px' }}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      role="button"
      aria-label={isCollapsed ? 'Expand branch' : 'Collapse branch'}
      aria-expanded={!isCollapsed}
    >
      <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
        {isCollapsed ? '+' : '-'}
      </span>
    </div>
  );
};

export const FlowCollapseButton = memo(FlowCollapseButtonComponent);
