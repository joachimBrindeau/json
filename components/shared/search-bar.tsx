'use client';

import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  'data-testid'?: string;
}

/**
 * Unified search bar component used across all views
 * Provides consistent styling and behavior for search functionality
 */
export function SearchBar({
  value,
  onChange,
  placeholder = 'Search JSON...',
  className = '',
  'data-testid': dataTestId = 'search-input',
}: SearchBarProps) {
  return (
    <div className={`relative flex-1 max-w-sm ${className}`}>
      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
      <Input
        type="text"
        placeholder={placeholder}
        aria-label={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-7 pl-7 text-sm"
        data-testid={dataTestId}
      />
    </div>
  );
}
