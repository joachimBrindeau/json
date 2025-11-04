'use client';

import { Globe, Lock } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface VisibilityToggleProps {
  isPublic: boolean;
  onToggle: (isPublic: boolean) => void;
  disabled?: boolean;
}

export function VisibilityToggle({ isPublic, onToggle, disabled }: VisibilityToggleProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border rounded-lg">
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          {isPublic ? (
            <Globe className="h-5 w-5 text-blue-500" />
          ) : (
            <Lock className="h-5 w-5 text-muted-foreground" />
          )}
          <span className="font-medium">{isPublic ? 'Public' : 'Private'}</span>
        </div>
        <p className="text-sm text-muted-foreground">
          {isPublic
            ? 'Anyone can discover this JSON in the public library'
            : 'Only people with the link can access this JSON'}
        </p>
      </div>
      <Switch
        checked={isPublic}
        onCheckedChange={onToggle}
        disabled={disabled}
        aria-label="Toggle public/private visibility"
        className="sm:flex-shrink-0"
      />
    </div>
  );
}
