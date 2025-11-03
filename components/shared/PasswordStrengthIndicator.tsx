'use client';

import { useMemo } from 'react';
import { validatePasswordStrength } from '@/lib/auth/password';
import { cn } from '@/lib/utils';

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

/**
 * Password Strength Indicator Component
 * 
 * Displays visual feedback about password strength in real-time
 */
export function PasswordStrengthIndicator({ password, className }: PasswordStrengthIndicatorProps) {
  const validation = useMemo(() => {
    if (!password) {
      return null;
    }
    return validatePasswordStrength(password);
  }, [password]);

  if (!password || !validation) {
    return null;
  }

  const strengthColors = {
    weak: 'bg-red-500',
    medium: 'bg-yellow-500',
    strong: 'bg-green-500',
  };

  const strengthLabels = {
    weak: 'Weak',
    medium: 'Medium',
    strong: 'Strong',
  };

  const strengthWidths = {
    weak: 'w-1/3',
    medium: 'w-2/3',
    strong: 'w-full',
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Strength Bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full transition-all duration-300',
              strengthColors[validation.strength],
              strengthWidths[validation.strength]
            )}
          />
        </div>
        <span
          className={cn(
            'text-xs font-medium min-w-[60px] text-right',
            validation.strength === 'weak' && 'text-red-500',
            validation.strength === 'medium' && 'text-yellow-500',
            validation.strength === 'strong' && 'text-green-500'
          )}
        >
          {strengthLabels[validation.strength]}
        </span>
      </div>

      {/* Error Messages */}
      {validation.errors.length > 0 && (
        <div className="text-xs text-muted-foreground space-y-1">
          {validation.errors.slice(0, 3).map((error, index) => (
            <div key={index} className="flex items-start gap-1">
              <span className="text-red-500">•</span>
              <span>{error}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

