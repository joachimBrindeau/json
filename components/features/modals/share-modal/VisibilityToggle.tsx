'use client';

import { Globe, Lock } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface VisibilityToggleProps {
  isPublic: boolean;
  onToggle: (isPublic: boolean) => void;
  disabled?: boolean;
}

export function VisibilityToggle({ isPublic, onToggle, disabled }: VisibilityToggleProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isPublic ? (
            <Globe className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Lock className="h-4 w-4 text-muted-foreground" />
          )}
          <Label htmlFor="visibility" className="text-sm font-medium">
            {isPublic ? 'Public' : 'Private'}
          </Label>
        </div>
        <Switch
          id="visibility"
          checked={isPublic}
          onCheckedChange={onToggle}
          disabled={disabled}
          aria-label="Toggle public/private visibility"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {isPublic
          ? 'Anyone can discover this in the public library'
          : 'Only people with the link can access this'}
      </p>
    </div>
  );
}
