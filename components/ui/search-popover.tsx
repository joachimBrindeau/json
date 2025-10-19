"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { CursorPopover, CursorPopoverTrigger, CursorPopoverContent } from './cursor-popover';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface SearchPopoverProps {
  /** The trigger element (usually a button) */
  trigger: React.ReactElement;
  /** Placeholder text for the search input */
  placeholder?: string;
  /** Initial search value */
  value?: string;
  /** Callback when search value changes */
  onSearch?: (value: string) => void;
  /** Callback when search is submitted (Enter key or button click) */
  onSubmit?: (value: string) => void;
  /** Whether to show the search button */
  showSearchButton?: boolean;
  /** Whether to show the clear button */
  showClearButton?: boolean;
  /** Custom className for the popover content */
  className?: string;
  /** Alignment of the popover */
  align?: "start" | "center" | "end";
  /** Side of the trigger to show the popover */
  side?: "top" | "right" | "bottom" | "left";
}

/**
 * SearchPopover - A minimalist search popover that appears near the trigger
 * 
 * @example
 * <SearchPopover
 *   trigger={<Button icon={Search} iconOnly />}
 *   placeholder="Search..."
 *   onSearch={(value) => console.log(value)}
 * />
 */
export function SearchPopover({
  trigger,
  placeholder = "Search...",
  value: controlledValue,
  onSearch,
  onSubmit,
  showSearchButton = true,
  showClearButton = true,
  className,
  align = "start",
  side = "bottom",
}: SearchPopoverProps) {
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(controlledValue || '');
  const inputRef = useRef<HTMLInputElement>(null);

  const value = controlledValue !== undefined ? controlledValue : internalValue;

  const handleValueChange = (newValue: string) => {
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }
    onSearch?.(newValue);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    onSubmit?.(value);
    setOpen(false);
  };

  const handleClear = () => {
    handleValueChange('');
    inputRef.current?.focus();
  };

  // Auto-focus input when popover opens
  useEffect(() => {
    if (open && inputRef.current) {
      // Small delay to ensure the popover is rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [open]);

  return (
    <CursorPopover open={open} onOpenChange={setOpen}>
      <CursorPopoverTrigger>
        {trigger}
      </CursorPopoverTrigger>
      <CursorPopoverContent 
        align={align} 
        side={side}
        className={cn("p-2 min-w-[280px]", className)}
      >
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => handleValueChange(e.target.value)}
              placeholder={placeholder}
              className={cn(
                "w-full h-8 pl-8 pr-8 text-sm rounded-md border border-input bg-background",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0",
                "placeholder:text-muted-foreground"
              )}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setOpen(false);
                }
              }}
            />
            {showClearButton && value && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {showSearchButton && (
            <Button
              type="submit"
              size="sm"
              variant="blue"
              className="h-8 px-3"
            >
              <Search className="h-3.5 w-3.5" />
            </Button>
          )}
        </form>
      </CursorPopoverContent>
    </CursorPopover>
  );
}

