'use client';

import { Button } from '@/components/ui/button';
import { ConfirmPopover } from '@/components/ui/confirm-popover';
import type { EditorAction } from '@/types/editor-actions';

interface ActionButtonProps {
  action: EditorAction;
}

/**
 * Renders an action button with automatic responsive behavior
 * - If showText is true: Shows text+icon on desktop (sm+), icon-only on mobile
 * - If showText is false: Shows icon-only on all screen sizes with text as tooltip
 * - Automatically handles loading states and tooltips
 * - If requireConfirm is true: Wraps button with ConfirmPopover
 */
export function ActionButton({ action }: ActionButtonProps) {
  const {
    label,
    icon: Icon,
    onClick,
    disabled = false,
    variant = 'outline',
    showText = true,
    tooltip,
    loading = false,
    loadingText,
    className = '',
    requireConfirm = false,
    confirmTitle,
    confirmDescription,
    confirmVariant = 'default',
  } = action;

  const tooltipText = tooltip || label;

  // Icon-only button (all screen sizes) - uses iconOnly prop for automatic tooltip
  if (!showText) {
    const button = (
      <Button
        variant={variant}
        icon={Icon}
        iconOnly
        onClick={requireConfirm ? undefined : onClick}
        disabled={disabled || loading}
        isLoading={loading}
        title={tooltipText}
        className={`h-7 w-7 ${className}`}
      >
        {label}
      </Button>
    );

    // Wrap with confirmation popover if required
    if (requireConfirm) {
      return (
        <ConfirmPopover
          trigger={button}
          title={confirmTitle || `${label}?`}
          description={confirmDescription}
          variant={confirmVariant}
          onConfirm={onClick}
        />
      );
    }

    return button;
  }

  // Responsive button: text+icon on desktop, icon-only on mobile
  const desktopButton = (
    <Button
      variant={variant}
      size="xs"
      icon={Icon}
      onClick={requireConfirm ? undefined : onClick}
      disabled={disabled || loading}
      isLoading={loading}
      loadingText={loadingText}
      title={tooltipText}
      className={`hidden sm:inline-flex ${className}`}
    >
      {label}
    </Button>
  );

  const mobileButton = (
    <Button
      variant={variant}
      icon={Icon}
      iconOnly
      onClick={requireConfirm ? undefined : onClick}
      disabled={disabled || loading}
      isLoading={loading}
      title={tooltipText}
      className={`sm:hidden h-7 w-7 ${className}`}
    >
      {label}
    </Button>
  );

  // Wrap with confirmation popover if required
  if (requireConfirm) {
    return (
      <>
        <ConfirmPopover
          trigger={desktopButton}
          title={confirmTitle || `${label}?`}
          description={confirmDescription}
          variant={confirmVariant}
          onConfirm={onClick}
        />
        <ConfirmPopover
          trigger={mobileButton}
          title={confirmTitle || `${label}?`}
          description={confirmDescription}
          variant={confirmVariant}
          onConfirm={onClick}
        />
      </>
    );
  }

  return (
    <>
      {desktopButton}
      {mobileButton}
    </>
  );
}
