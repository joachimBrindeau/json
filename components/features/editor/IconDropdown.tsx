'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import type { LucideIcon } from 'lucide-react';

export interface DropdownAction {
  /** Unique identifier */
  id: string;
  /** Label to display */
  label: string;
  /** Icon component */
  icon: LucideIcon;
  /** Click handler */
  onClick: () => void;
  /** Whether the action is disabled */
  disabled?: boolean;
}

interface IconDropdownProps {
  /** Icon to display on the button */
  icon: LucideIcon;
  /** Tooltip text */
  tooltip: string;
  /** Dropdown menu items */
  actions: DropdownAction[];
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Alignment of dropdown content */
  align?: 'start' | 'end' | 'center';
  /** Width of dropdown content */
  width?: string;
}

/**
 * Reusable icon dropdown button component
 * Used for Share, Magic Actions, and other icon-based dropdowns
 */
export function IconDropdown({
  icon: Icon,
  tooltip,
  actions,
  disabled = false,
  align = 'end',
  width = 'w-56',
}: IconDropdownProps) {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          disabled={disabled}
          title={tooltip}
          className="h-7 w-7"
        >
          <Icon className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className={width}>
        {actions.map((action) => (
          <DropdownMenuItem
            key={action.id}
            onClick={() => {
              action.onClick();
              setOpen(false);
            }}
            disabled={action.disabled}
            className="cursor-pointer"
          >
            <action.icon className="h-4 w-4 mr-2" />
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
