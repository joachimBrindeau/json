'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2, type LucideIcon } from 'lucide-react';

const unifiedButtonVariants = cva(
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
        green: 'border border-green-500 text-green-600 bg-green-50 hover:bg-green-100 hover:text-green-700 hover:border-green-600',
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

export interface UnifiedButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof unifiedButtonVariants> {
  icon?: LucideIcon;
  text?: string;
  isLoading?: boolean;
  loadingText?: string;
  iconPosition?: 'left' | 'right';
}

const UnifiedButton = React.forwardRef<HTMLButtonElement, UnifiedButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    icon: Icon,
    text,
    isLoading = false,
    loadingText,
    iconPosition = 'left',
    children,
    disabled,
    ...props 
  }, ref) => {
    const isDisabled = disabled || isLoading;
    
    // Determine what to display
    const displayText = isLoading && loadingText ? loadingText : text || children;
    const DisplayIcon = isLoading ? Loader2 : Icon;
    
    // Icon classes
    const iconClasses = cn(
      'h-3 w-3',
      isLoading && 'animate-spin',
      text && (iconPosition === 'left' ? 'mr-1' : 'ml-1')
    );

    return (
      <button
        className={cn(unifiedButtonVariants({ variant, size }), className)}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {DisplayIcon && iconPosition === 'left' && (
          <DisplayIcon className={iconClasses} />
        )}
        
        {displayText}
        
        {DisplayIcon && iconPosition === 'right' && (
          <DisplayIcon className={iconClasses} />
        )}
      </button>
    );
  }
);

UnifiedButton.displayName = 'UnifiedButton';

export { UnifiedButton, unifiedButtonVariants };