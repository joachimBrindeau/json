'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2, type LucideIcon } from 'lucide-react';
import { TooltipWrapper } from '@/components/ui/tooltip';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        // Custom color variants
        green:
          'border border-green-500 text-green-600 bg-green-50 hover:bg-green-100 hover:text-green-700 hover:border-green-600',
        red: 'border border-red-500 text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-700 hover:border-red-600',
        blue: 'border border-blue-500 text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 hover:border-blue-600',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
        xs: 'h-7 px-2 text-xs',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  icon?: LucideIcon;
  text?: string;
  isLoading?: boolean;
  loadingText?: string;
  iconPosition?: 'left' | 'right';
  /** When true, shows only icon and uses text/children as tooltip */
  iconOnly?: boolean;
  /** Tooltip content - shown on hover */
  tooltip?: React.ReactNode;
  /** Tooltip position */
  tooltipSide?: 'top' | 'right' | 'bottom' | 'left';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      icon: Icon,
      text,
      isLoading = false,
      loadingText,
      iconPosition = 'left',
      iconOnly = false,
      children,
      disabled,
      title,
      tooltip,
      tooltipSide = 'top',
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    // If asChild is true, use Slot and pass through all props
    if (asChild) {
      const Comp = Slot;
      return (
        <Comp className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />
      );
    }

    // Determine what to display
    const displayText = isLoading && loadingText ? loadingText : text || children;
    const DisplayIcon = isLoading ? Loader2 : Icon;

    // If iconOnly is true, force size to icon and use text as tooltip
    const effectiveSize = iconOnly ? 'icon' : size;

    // Determine tooltip content: explicit tooltip prop > title prop > iconOnly text
    const tooltipContent =
      tooltip || title || (iconOnly && typeof displayText === 'string' ? displayText : undefined);

    // Accessibility: When rendering an icon-only control, expose an accessible name
    const computedAriaLabel =
      (iconOnly || effectiveSize === 'icon') && typeof tooltipContent === 'string'
        ? tooltipContent
        : undefined;

    // Icon classes
    const iconClasses = cn(
      'h-3 w-3',
      isLoading && 'animate-spin',
      !iconOnly && text && (iconPosition === 'left' ? 'mr-1' : 'ml-1')
    );

    const buttonElement = (
      <button
        className={cn(buttonVariants({ variant, size: effectiveSize }), className)}
        ref={ref}
        disabled={isDisabled}
        aria-label={computedAriaLabel}
        {...props}
      >
        {DisplayIcon && iconPosition === 'left' && <DisplayIcon className={iconClasses} />}

        {!iconOnly && displayText}

        {DisplayIcon && iconPosition === 'right' && <DisplayIcon className={iconClasses} />}
      </button>
    );

    // Wrap with tooltip if content is provided
    if (tooltipContent) {
      return (
        <TooltipWrapper content={tooltipContent} side={tooltipSide} disabled={isDisabled}>
          {buttonElement}
        </TooltipWrapper>
      );
    }

    return buttonElement;
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
