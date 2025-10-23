'use client';

import React, { createContext, useContext, useRef, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface CursorPopoverContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
}

const CursorPopoverContext = createContext<CursorPopoverContextType | undefined>(undefined);

interface CursorPopoverProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * CursorPopover - A minimalist popover that appears near the trigger element
 * Closes when clicking outside
 */
export function CursorPopover({
  children,
  open: controlledOpen,
  onOpenChange,
}: CursorPopoverProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = useCallback(
    (newOpen: boolean) => {
      if (onOpenChange) {
        onOpenChange(newOpen);
      } else {
        setInternalOpen(newOpen);
      }
    },
    [onOpenChange]
  );

  return (
    <CursorPopoverContext.Provider value={{ open, setOpen, triggerRef }}>
      {children}
    </CursorPopoverContext.Provider>
  );
}

interface CursorPopoverTriggerProps {
  children: React.ReactElement;
  asChild?: boolean;
}

/**
 * CursorPopoverTrigger - The element that triggers the popover
 */
export function CursorPopoverTrigger({ children, asChild = true }: CursorPopoverTriggerProps) {
  const context = useContext(CursorPopoverContext);
  if (!context) throw new Error('CursorPopoverTrigger must be used within CursorPopover');

  const { open, setOpen, triggerRef } = context;

  if (asChild && React.isValidElement(children)) {
    const childProps = children.props as any;
    return React.cloneElement(children, {
      ref: (node: HTMLElement) => {
        triggerRef.current = node;
        // Handle existing ref if any
        const { ref } = children as any;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      onClick: (e: React.MouseEvent) => {
        setOpen(!open);
        // Don't call original onClick - the popover content will handle the action
        // This prevents the action from being triggered when opening the popover
      },
    } as any);
  }

  return (
    <button ref={triggerRef as any} onClick={() => setOpen(!open)}>
      {children}
    </button>
  );
}

interface Position {
  top: number;
  left: number;
}

interface CursorPopoverContentProps {
  children: React.ReactNode;
  className?: string;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
  sideOffset?: number;
  alignOffset?: number;
}

/**
 * CursorPopoverContent - The content that appears in the popover
 * Positions itself relative to the trigger element
 */
export function CursorPopoverContent({
  children,
  className = '',
  align = 'center',
  side = 'bottom',
  sideOffset = 8,
  alignOffset = 0,
}: CursorPopoverContentProps) {
  const context = useContext(CursorPopoverContext);
  if (!context) throw new Error('CursorPopoverContent must be used within CursorPopover');

  const { open, setOpen, triggerRef } = context;
  const contentRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<Position>({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);

  // Calculate position based on trigger element
  useEffect(() => {
    if (!open || !triggerRef.current) return;

    const updatePosition = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;

      const triggerRect = trigger.getBoundingClientRect();
      const contentRect = contentRef.current?.getBoundingClientRect();

      let top = 0;
      let left = 0;

      // Calculate vertical position
      switch (side) {
        case 'top':
          top = triggerRect.top - (contentRect?.height || 0) - sideOffset;
          break;
        case 'bottom':
          top = triggerRect.bottom + sideOffset;
          break;
        case 'left':
        case 'right':
          // Vertical alignment for horizontal sides
          switch (align) {
            case 'start':
              top = triggerRect.top + alignOffset;
              break;
            case 'end':
              top = triggerRect.bottom - (contentRect?.height || 0) - alignOffset;
              break;
            case 'center':
            default:
              top = triggerRect.top + triggerRect.height / 2 - (contentRect?.height || 0) / 2;
              break;
          }
          break;
      }

      // Calculate horizontal position
      switch (side) {
        case 'left':
          left = triggerRect.left - (contentRect?.width || 0) - sideOffset;
          break;
        case 'right':
          left = triggerRect.right + sideOffset;
          break;
        case 'top':
        case 'bottom':
          // Horizontal alignment for vertical sides
          switch (align) {
            case 'start':
              left = triggerRect.left + alignOffset;
              break;
            case 'end':
              left = triggerRect.right - (contentRect?.width || 0) - alignOffset;
              break;
            case 'center':
            default:
              left = triggerRect.left + triggerRect.width / 2 - (contentRect?.width || 0) / 2;
              break;
          }
          break;
      }

      // Keep within viewport bounds
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const contentWidth = contentRect?.width || 0;
      const contentHeight = contentRect?.height || 0;

      if (left + contentWidth > viewportWidth - 8) {
        left = viewportWidth - contentWidth - 8;
      }
      if (left < 8) {
        left = 8;
      }
      if (top + contentHeight > viewportHeight - 8) {
        top = viewportHeight - contentHeight - 8;
      }
      if (top < 8) {
        top = 8;
      }

      setPosition({ top, left });
    };

    // Initial position calculation
    updatePosition();

    // Recalculate on scroll or resize
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open, side, align, sideOffset, alignOffset]);

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        contentRef.current &&
        !contentRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }

    if (open) {
      // Small delay to prevent immediate close on trigger click
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 0);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open, setOpen, triggerRef]);

  // Handle escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [open, setOpen]);

  // Set mounted state for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      ref={contentRef}
      className={cn(
        'fixed z-50 rounded-md border bg-popover text-popover-foreground shadow-md',
        'animate-in fade-in-0 zoom-in-95',
        'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
        className
      )}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {children}
    </div>,
    document.body
  );
}
