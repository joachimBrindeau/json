'use client';

import { forwardRef } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { Save, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SaveButtonProps extends Omit<ButtonProps, 'variant'> {
  isLoading?: boolean;
}

const SaveButton = forwardRef<HTMLButtonElement, SaveButtonProps>(
  ({ className, isLoading, children = 'Save', ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant="outline"
        className={cn(
          'border-green-500 text-green-600 bg-green-50 hover:bg-green-100 hover:text-green-700 hover:border-green-600',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
        ) : (
          <Save className="h-3 w-3 mr-1" />
        )}
        {children}
      </Button>
    );
  }
);

SaveButton.displayName = 'SaveButton';

export { SaveButton };