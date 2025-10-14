'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingState({
  message = 'Loading...',
  size = 'md',
  className
}: LoadingStateProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const spacingClasses = {
    sm: 'p-4',
    md: 'p-8',
    lg: 'p-12',
  };

  return (
    <div className={cn(
      'flex flex-col items-center justify-center',
      spacingClasses[size],
      className
    )}>
      <Loader2
        className={cn(
          'animate-spin text-primary mb-3',
          sizeClasses[size]
        )}
      />
      <p className={cn(
        'text-muted-foreground',
        textSizeClasses[size]
      )}>
        {message}
      </p>
    </div>
  );
}
