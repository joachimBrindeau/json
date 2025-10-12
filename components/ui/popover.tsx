"use client";

import React, { createContext, useContext, useRef, useState, useEffect } from 'react';

interface PopoverContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const PopoverContext = createContext<PopoverContextType | undefined>(undefined);

export function Popover({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  
  return (
    <PopoverContext.Provider value={{ open, setOpen }}>
      <div className="relative">
        {children}
      </div>
    </PopoverContext.Provider>
  );
}

export function PopoverTrigger({ 
  children, 
  asChild = false 
}: { 
  children: React.ReactNode; 
  asChild?: boolean; 
}) {
  const context = useContext(PopoverContext);
  if (!context) throw new Error('PopoverTrigger must be used within Popover');
  
  const { open, setOpen } = context;
  
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: () => setOpen(!open)
    });
  }
  
  return (
    <button onClick={() => setOpen(!open)}>
      {children}
    </button>
  );
}

export function PopoverContent({ 
  children, 
  className = "" 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  const context = useContext(PopoverContext);
  if (!context) throw new Error('PopoverContent must be used within Popover');
  
  const { open, setOpen } = context;
  const contentRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open, setOpen]);
  
  if (!open) return null;
  
  return (
    <div 
      ref={contentRef}
      className={`absolute z-50 mt-2 bg-white border rounded-md shadow-lg p-4 ${className}`}
    >
      {children}
    </div>
  );
}