import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FormatOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  description?: string;
}

interface FormatSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  options: FormatOption[];
  className?: string;
}

export function FormatSelector({ value, onValueChange, options, className = '' }: FormatSelectorProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={`h-6 w-24 text-xs ${className}`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.id} value={option.id} className="text-xs">
            <div className="flex items-center gap-1">
              {option.icon}
              {option.label}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
