'use client';

import { memo, useState, useEffect } from 'react';
import { HeaderNav } from './HeaderNav';
import { Sidebar } from './sidebar';
import { ReviewsSnippet } from '@/components/shared/seo/ReviewsSnippet';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { usePathname } from 'next/navigation';
import { PageTransition } from '@/components/animations';

interface MainLayoutProps {
  children: React.ReactNode;
}

function MainLayoutComponent({ children }: MainLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <div className="h-screen flex">
      {/* Desktop Sidebar - always visible on large screens */}
      <div className="hidden lg:block">
        <ErrorBoundary fallback={<div className="w-64 border-r bg-muted/30">Sidebar Error</div>}>
          <Sidebar />
        </ErrorBoundary>
      </div>

      {/* Mobile Sidebar - always available on mobile */}
      <div className="lg:hidden">
        <ErrorBoundary fallback={<div>Sidebar Error</div>}>
          <Sidebar isMobile={true} isOpen={mobileMenuOpen} onOpenChange={setMobileMenuOpen} />
        </ErrorBoundary>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <ErrorBoundary fallback={<div className="h-16 border-b bg-muted/30">Navigation Error</div>}>
          <HeaderNav onMobileMenuToggle={() => setMobileMenuOpen(true)} />
        </ErrorBoundary>

        <main className="flex-1 min-h-0 overflow-y-auto">
          <ErrorBoundary>
            <PageTransition>{children}</PageTransition>
          </ErrorBoundary>
          {/* Reviews Snippet - Visible on all pages for Google compliance */}
          <ReviewsSnippet />
        </main>
      </div>
    </div>
  );
}

// Export memoized component
export const MainLayout = memo(MainLayoutComponent);
