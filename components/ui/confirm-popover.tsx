'use client';

import React, { useState } from 'react';
import { AlertTriangle, Info, CheckCircle2, XCircle } from 'lucide-react';
import { CursorPopover, CursorPopoverTrigger, CursorPopoverContent } from './cursor-popover';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface ConfirmPopoverProps {
  /** The trigger element (usually a button with a destructive action) */
  trigger: React.ReactElement;
  /** Title of the confirmation prompt */
  title?: string;
  /** Description/message of the confirmation prompt */
  description?: string;
  /** Variant of the confirmation (affects icon and colors) */
  variant?: 'default' | 'destructive' | 'warning' | 'info';
  /** Text for the confirm button */
  confirmText?: string;
  /** Text for the cancel button */
  cancelText?: string;
  /** Callback when confirmed */
  onConfirm?: () => void | Promise<void>;
  /** Callback when cancelled */
  onCancel?: () => void;
  /** Custom className for the popover content */
  className?: string;
  /** Alignment of the popover */
  align?: 'start' | 'center' | 'end';
  /** Side of the trigger to show the popover */
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** Whether to show the icon */
  showIcon?: boolean;
}

const variantConfig = {
  default: {
    icon: Info,
    iconClassName: 'text-blue-500',
    confirmVariant: 'blue' as const,
  },
  destructive: {
    icon: XCircle,
    iconClassName: 'text-red-500',
    confirmVariant: 'red' as const,
  },
  warning: {
    icon: AlertTriangle,
    iconClassName: 'text-yellow-500',
    confirmVariant: 'outline' as const,
  },
  info: {
    icon: CheckCircle2,
    iconClassName: 'text-blue-500',
    confirmVariant: 'blue' as const,
  },
};

/**
 * ConfirmPopover - A minimalist confirmation popover that appears near the trigger
 * Perfect for confirming destructive actions like delete
 *
 * @example
 * <ConfirmPopover
 *   trigger={<Button icon={Trash2} iconOnly variant="outline" />}
 *   title="Delete item?"
 *   description="This action cannot be undone."
 *   variant="destructive"
 *   onConfirm={() => handleDelete()}
 * />
 */
export function ConfirmPopover({
  trigger,
  title = 'Are you sure?',
  description,
  variant = 'default',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  className,
  align = 'center',
  side = 'bottom',
  showIcon = true,
}: ConfirmPopoverProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const config = variantConfig[variant];
  const Icon = config.icon;

  const handleConfirm = async () => {
    if (!onConfirm) {
      setOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      await onConfirm();
      setOpen(false);
    } catch (error) {
      console.error('Confirmation action failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    onCancel?.();
    setOpen(false);
  };

  return (
    <CursorPopover open={open} onOpenChange={setOpen}>
      <CursorPopoverTrigger>{trigger}</CursorPopoverTrigger>
      <CursorPopoverContent
        align={align}
        side={side}
        className={cn('p-3 min-w-[260px] max-w-[320px]', className)}
      >
        <div className="space-y-3">
          {/* Header with icon and title */}
          <div className="flex items-start gap-3">
            {showIcon && (
              <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', config.iconClassName)} />
            )}
            <div className="flex-1 space-y-1">
              <h4 className="text-sm font-semibold leading-none">{title}</h4>
              {description && (
                <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
              className="h-7 px-3 text-xs"
            >
              {cancelText}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={config.confirmVariant}
              onClick={handleConfirm}
              disabled={isLoading}
              isLoading={isLoading}
              className="h-7 px-3 text-xs"
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </CursorPopoverContent>
    </CursorPopover>
  );
}
