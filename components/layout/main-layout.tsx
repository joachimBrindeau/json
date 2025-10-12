'use client';

import { memo, useState, useEffect } from 'react';
import { HeaderNav } from './header-nav';
import { Sidebar } from './sidebar';
import { ErrorBoundary } from '@/components/shared/error-boundary';
import { usePathname } from 'next/navigation';

interface MainLayoutProps {
  children: React.ReactNode;
  variant?: 'default' | 'landing';
}

function MainLayoutComponent({ children, variant = 'default' }: MainLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Determine if we should show the sidebar based on variant
  const showSidebar = variant === 'default';

  return (
    <div className="h-screen flex">
      {/* Desktop Sidebar - only show for default variant */}
      {showSidebar && (
        <div className="hidden lg:block">
          <ErrorBoundary fallback={<div className="w-64 border-r bg-muted/30">Sidebar Error</div>}>
            <Sidebar />
          </ErrorBoundary>
        </div>
      )}

      {/* Mobile Sidebar - only show for default variant */}
      {showSidebar && (
        <div className="lg:hidden">
          <ErrorBoundary fallback={<div>Sidebar Error</div>}>
            <Sidebar 
              isMobile={true} 
              isOpen={mobileMenuOpen} 
              onOpenChange={setMobileMenuOpen} 
            />
          </ErrorBoundary>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <ErrorBoundary fallback={<div className="h-16 border-b bg-muted/30">Navigation Error</div>}>
          <HeaderNav onMobileMenuToggle={showSidebar ? () => setMobileMenuOpen(true) : undefined} />
        </ErrorBoundary>

        <main className="flex-1 overflow-auto">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

// Export memoized component
export const MainLayout = memo(MainLayoutComponent);