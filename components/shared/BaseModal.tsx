'use client';

import React, { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { X, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { logger } from '@/lib/logger';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

export interface BaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;

  // Header configuration
  showCloseButton?: boolean;
  icon?: React.ReactNode;

  // Footer configuration
  showFooter?: boolean;
  primaryAction?: {
    label: string;
    onClick: () => void | Promise<void>;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    disabled?: boolean;
    loading?: boolean;
    testId?: string;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    testId?: string;
  };

  // Content configuration
  scrollable?: boolean;
  maxHeight?: string;

  // State indicators
  variant?: 'default' | 'destructive' | 'warning' | 'success';

  // Animation & accessibility
  closeOnEscape?: boolean;
  closeOnOverlayClick?: boolean;
  trapFocus?: boolean;

  // Event handlers
  onClose?: () => void;
  onAfterOpen?: () => void;
}

export interface BaseModalRef {
  focus: () => void;
  close: () => void;
}

const variantIcons = {
  default: null,
  destructive: <AlertTriangle className="h-5 w-5 text-destructive" />,
  warning: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
  success: <CheckCircle className="h-5 w-5 text-green-500" />,
};

const variantStyles = {
  default: '',
  destructive: 'border-destructive/20',
  warning: 'border-yellow-200',
  success: 'border-green-200',
};

export const BaseModal = forwardRef<BaseModalRef, BaseModalProps>(
  (
    {
      open,
      onOpenChange,
      title,
      description,
      children,
      className = '',

      // Header config
      showCloseButton = true,
      icon,

      // Footer config
      showFooter = true,
      primaryAction,
      secondaryAction,

      // Content config
      scrollable = true,
      maxHeight = '80vh',

      // State
      variant = 'default',

      // Behavior
      closeOnEscape = true,
      closeOnOverlayClick = true,
      trapFocus = true,

      // Events
      onClose,
      onAfterOpen,
    },
    ref
  ) => {
    const contentRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      focus: () => contentRef.current?.focus(),
      close: () => handleClose(),
    }));

    const handleClose = useCallback(() => {
      onClose?.();
      onOpenChange(false);
    }, [onClose, onOpenChange]);

    const handlePrimaryAction = useCallback(async () => {
      if (primaryAction?.onClick) {
        try {
          await primaryAction.onClick();
        } catch (error) {
          logger.error({ err: error, title }, 'Modal primary action failed');
        }
      }
    }, [primaryAction, title]);

    const handleOpenChange = useCallback(
      (newOpen: boolean) => {
        if (!newOpen) {
          handleClose();
        } else {
          onOpenChange(newOpen);
          onAfterOpen?.();
        }
      },
      [handleClose, onOpenChange, onAfterOpen]
    );

    // Determine display icon
    const displayIcon = icon || variantIcons[variant];

    const contentComponent = scrollable ? (
      <ScrollArea className="max-h-full" style={{ maxHeight }}>
        <div className="pr-4">{children}</div>
      </ScrollArea>
    ) : (
      <div className="overflow-hidden" style={{ maxHeight }}>
        {children}
      </div>
    );

    return (
      <Dialog open={open} onOpenChange={closeOnOverlayClick ? handleOpenChange : undefined}>
        <DialogContent
          ref={contentRef}
          className={`
          ${variantStyles[variant]} 
          ${className}
        `.trim()}
          onEscapeKeyDown={closeOnEscape ? undefined : (e) => e.preventDefault()}
          onPointerDownOutside={closeOnOverlayClick ? undefined : (e) => e.preventDefault()}
          aria-describedby={description ? 'modal-description' : undefined}
        >
          {/* Header */}
          <DialogHeader className="space-y-2">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                {displayIcon && <div className="flex-shrink-0 mt-0.5">{displayIcon}</div>}
                <div className="flex-1 min-w-0">
                  <DialogTitle className="text-left leading-6">{title}</DialogTitle>
                  {description && (
                    <DialogDescription id="modal-description" className="text-left mt-1">
                      {description}
                    </DialogDescription>
                  )}
                </div>
              </div>

              {showCloseButton && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 flex-shrink-0"
                  onClick={handleClose}
                  aria-label="Close modal"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </DialogHeader>

          {/* Content */}
          <div className="flex-1 min-h-0">{contentComponent}</div>

          {/* Footer */}
          {showFooter && (primaryAction || secondaryAction) && (
            <DialogFooter className="flex gap-2 pt-4">
              <div className="flex gap-2 ml-auto">
                {secondaryAction && (
                  <Button
                    variant={secondaryAction.variant || 'outline'}
                    onClick={secondaryAction.onClick}
                    data-testid={secondaryAction.testId}
                    aria-label={secondaryAction.label}
                  >
                    {secondaryAction.label}
                  </Button>
                )}
                {primaryAction && (
                  <Button
                    variant={primaryAction.variant || 'default'}
                    onClick={handlePrimaryAction}
                    disabled={primaryAction.disabled || primaryAction.loading}
                    data-testid={primaryAction.testId}
                    aria-label={primaryAction.label}
                  >
                    {primaryAction.loading && <LoadingSpinner size="sm" className="mr-2" />}
                    {primaryAction.label}
                  </Button>
                )}
              </div>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    );
  }
);

BaseModal.displayName = 'BaseModal';

// Common modal variants for convenience
export const ConfirmationModal = forwardRef<
  BaseModalRef,
  Omit<BaseModalProps, 'variant'> & {
    variant?: 'destructive' | 'warning';
  }
>((props, ref) => (
  <BaseModal ref={ref} {...props} variant={props.variant || 'destructive'} showFooter={true} />
));

ConfirmationModal.displayName = 'ConfirmationModal';

export const InfoModal = forwardRef<BaseModalRef, Omit<BaseModalProps, 'variant'>>((props, ref) => (
  <BaseModal
    ref={ref}
    {...props}
    variant="default"
    icon={<Info className="h-5 w-5 text-blue-500" />}
  />
));

InfoModal.displayName = 'InfoModal';

export const SuccessModal = forwardRef<BaseModalRef, Omit<BaseModalProps, 'variant'>>(
  (props, ref) => <BaseModal ref={ref} {...props} variant="success" />
);

SuccessModal.displayName = 'SuccessModal';
