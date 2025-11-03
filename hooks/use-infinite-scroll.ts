import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook for infinite scroll functionality
 * @param hasMore - Whether there are more items to load
 * @param isLoading - Whether items are currently being loaded
 * @param rootMargin - Root margin for IntersectionObserver (default: '100px')
 * @param threshold - Threshold for IntersectionObserver (default: 0.1)
 * @returns Object with loadMoreRef and page state
 */
export function useInfiniteScroll(
  hasMore: boolean,
  isLoading: boolean,
  rootMargin = '100px',
  threshold = 0.1
) {
  const [page, setPage] = useState(1);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);

  // Reset page to 1 (useful when filters change)
  const resetPage = () => setPage(1);

  // Setup IntersectionObserver for infinite scroll
  useEffect(() => {
    // Skip during SSR
    if (typeof window === 'undefined' || isLoading || !elementRef.current) return;

    const handleObserver = (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target.isIntersecting && hasMore && !isLoading) {
        setPage((prev) => prev + 1);
      }
    };

    observerRef.current = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin,
      threshold,
    });

    observerRef.current.observe(elementRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [isLoading, hasMore, rootMargin, threshold]);

  // Callback ref to set the element
  const loadMoreRef = (node: HTMLElement | null) => {
    elementRef.current = node;
  };

  return {
    page,
    setPage,
    resetPage,
    loadMoreRef,
  };
}
