'use client';

import { forwardRef } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { Save } from 'lucide-react';

interface SaveButtonProps extends Omit<ButtonProps, 'variant' | 'icon'> {
  isLoading?: boolean;
}

const SaveButton = forwardRef<HTMLButtonElement, SaveButtonProps>(
  ({ isLoading, children = 'Save', ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant="green"
        icon={Save}
        isLoading={isLoading}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

SaveButton.displayName = 'SaveButton';

export { SaveButton };