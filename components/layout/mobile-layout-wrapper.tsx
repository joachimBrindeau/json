'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from './sidebar';
import { MobileAwareHeader } from './header-nav';

interface MobileLayoutWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileLayoutWrapper({ children, className = '' }: MobileLayoutWrapperProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close mobile menu when screen becomes larger
  useEffect(() => {
    if (!isMobile && isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  }, [isMobile, isMobileMenuOpen]);

  return (
    <div className={`flex h-screen bg-background ${className}`}>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className="hidden lg:flex lg:flex-shrink-0">
          <Sidebar />
        </aside>
      )}
      
      {/* Mobile Sidebar */}
      {isMobile && (
        <Sidebar 
          isMobile={true}
          isOpen={isMobileMenuOpen}
          onOpenChange={setIsMobileMenuOpen}
        />
      )}

      {/* Main content area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <MobileAwareHeader 
          onMobileMenuToggle={isMobile ? () => setIsMobileMenuOpen(true) : undefined} 
        />
        
        {/* Main content */}
        <main className="flex-1 min-h-0 overflow-y-auto">
          {children}
        </main>
      </div>
      
      {/* Mobile menu overlay */}
      {isMobile && isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}