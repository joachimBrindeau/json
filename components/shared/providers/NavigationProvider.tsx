'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { PageSkeleton } from '@/components/ui/skeleton';

interface NavigationContextType {
  isNavigating: boolean;
  prefetchPage: (href: string) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
}

interface NavigationProviderProps {
  children: ReactNode;
}

export function NavigationProvider({ children }: NavigationProviderProps) {
  const [isNavigating, setIsNavigating] = useState(false);
  const [prefetchedPages] = useState(new Set<string>());
  const router = useRouter();
  const pathname = usePathname();

  // Handle route change events
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleRouteChangeStart = () => {
      setIsNavigating(true);
      // Set a reasonable timeout to prevent infinite loading states
      timeoutId = setTimeout(() => {
        setIsNavigating(false);
      }, 5000);
    };

    const handleRouteChangeComplete = () => {
      setIsNavigating(false);
      if (timeoutId) clearTimeout(timeoutId);
    };

    // Listen for programmatic navigation
    const originalPush = router.push;
    const originalReplace = router.replace;

    router.push = (...args) => {
      handleRouteChangeStart();
      const result = originalPush.apply(router, args) as any;
      // Next.js router.push returns a promise
      if (result && typeof result.then === 'function') {
        result.finally(handleRouteChangeComplete);
      } else {
        // Fallback timeout
        setTimeout(handleRouteChangeComplete, 100);
      }
      return result;
    };

    router.replace = (...args) => {
      handleRouteChangeStart();
      const result = originalReplace.apply(router, args) as any;
      if (result && typeof result.then === 'function') {
        result.finally(handleRouteChangeComplete);
      } else {
        setTimeout(handleRouteChangeComplete, 100);
      }
      return result;
    };

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      // Restore original methods
      router.push = originalPush;
      router.replace = originalReplace;
    };
  }, [router]);

  // Reset navigation state when pathname changes
  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  const prefetchPage = (href: string) => {
    if (!prefetchedPages.has(href)) {
      prefetchedPages.add(href);
      router.prefetch(href);
    }
  };

  return (
    <NavigationContext.Provider value={{ isNavigating, prefetchPage }}>
      {isNavigating ? <PageSkeleton /> : children}
    </NavigationContext.Provider>
  );
}
