import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import { useDebounce } from '@/hooks/use-debounce';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';

export interface DocumentListFilters {
  query?: string;
  category?: string;
  tags?: string[];
  visibility?: string;
  sortBy?: string;
  dateRange?: string;
  complexity?: string;
  minSize?: string;
  maxSize?: string;
}

export interface PaginationInfo {
  hasNext?: boolean;
  total?: number;
  totalPages?: number;
  currentPage?: number;
}

export interface UseDocumentListOptions<T> {
  endpoint: string;
  enabled?: boolean;
  pageSize?: number;
  debounceMs?: number;
  onError?: (error: Error) => void;
}

export interface UseDocumentListResult<T> {
  documents: T[];
  loading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  totalCount: number;
  page: number;
  loadMoreRef: (node: HTMLElement | null) => void;
  filters: DocumentListFilters;
  setFilters: (
    filters: DocumentListFilters | ((prev: DocumentListFilters) => DocumentListFilters)
  ) => void;
  refetch: () => void;
  deleteDocument: (id: string) => Promise<void>;
}

/**
 * Unified hook for document list pages with search, pagination, and filtering
 * Handles all common document listing patterns across library, private, and saved pages
 */
export function useDocumentList<T extends { id: string; title?: string }>(
  options: UseDocumentListOptions<T>
): UseDocumentListResult<T> {
  const { endpoint, enabled = true, pageSize = 12, debounceMs = 500, onError } = options;

  // State
  const [documents, setDocuments] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<DocumentListFilters>({
    query: '',
    sortBy: 'recent',
    tags: [],
  });

  const debouncedQuery = useDebounce(filters.query || '', debounceMs);

  // Infinite scroll
  const { page, setPage, loadMoreRef } = useInfiniteScroll(hasMore, loading || isLoadingMore);

  // Build query parameters
  const buildQueryParams = useCallback(
    (currentPage: number) => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        sort: filters.sortBy || 'recent',
      });

      if (debouncedQuery) params.set('search', debouncedQuery);
      if (filters.category) params.set('category', filters.category);
      if (filters.visibility) params.set('visibility', filters.visibility);
      if (filters.dateRange) params.set('dateRange', filters.dateRange);
      if (filters.complexity) params.set('complexity', filters.complexity);
      if (filters.minSize) params.set('minSize', filters.minSize);
      if (filters.maxSize) params.set('maxSize', filters.maxSize);

      return params.toString();
    },
    [debouncedQuery, filters, pageSize]
  );

  // Fetch documents
  const fetchDocuments = useCallback(
    async (reset = false) => {
      if (!enabled) return;

      try {
        if (reset) {
          setLoading(true);
        } else {
          setIsLoadingMore(true);
        }

        const currentPage = reset ? 1 : page;
        const queryParams = buildQueryParams(currentPage);
        const url = `${endpoint}?${queryParams}`;

        const raw = await apiClient.get<any>(url);
        const data = raw && typeof raw === 'object' && 'success' in raw ? raw.data ?? {} : raw;

        if (reset) {
          setDocuments((data?.documents as T[]) || []);
          setPage(1);
        } else {
          setDocuments((prev) => [...prev, ...(((data?.documents as T[]) || []))]);
        }

        setHasMore(Boolean(data?.pagination?.hasNext));
        setTotalCount(Number(data?.pagination?.total || 0));
      } catch (error) {
        logger.error(
          {
            err: error,
            endpoint,
            page,
            filters,
          },
          'Failed to fetch documents'
        );
        if (onError && error instanceof Error) {
          onError(error);
        }
      } finally {
        setLoading(false);
        setIsLoadingMore(false);
      }
    },
    [enabled, endpoint, page, buildQueryParams, onError]
  );

  // Delete document
  const deleteDocument = useCallback(
    async (id: string) => {
      const doc = documents.find((d) => d.id === id);
      if (!doc) return;

      if (
        !confirm(
          `Are you sure you want to delete "${doc.title || 'this document'}"? This action cannot be undone.`
        )
      ) {
        return;
      }

      try {
        await apiClient.delete(`/api/json/${id}`);

        // Remove from local state
        setDocuments((prev) => prev.filter((d) => d.id !== id));
        setTotalCount((prev) => prev - 1);
      } catch (error) {
        logger.error({ err: error, docId: id, docTitle: doc.title }, 'Failed to delete document');
        alert(error instanceof Error ? error.message : 'Failed to delete document');
        throw error;
      }
    },
    [documents]
  );

  // Refetch from beginning
  const refetch = useCallback(() => {
    fetchDocuments(true);
  }, [fetchDocuments]);

  // Load initial data when filters change
  useEffect(() => {
    // Only fetch on client side to prevent hydration mismatch
    if (enabled && typeof window !== 'undefined') {
      fetchDocuments(true);
    }
  }, [
    enabled,
    debouncedQuery,
    filters.category,
    filters.visibility,
    filters.sortBy,
    filters.dateRange,
    filters.complexity,
    filters.minSize,
    filters.maxSize,
  ]);

  // Load more when page changes
  useEffect(() => {
    // Only fetch on client side to prevent hydration mismatch
    if (page > 1 && enabled && typeof window !== 'undefined') {
      fetchDocuments(false);
    }
  }, [page, enabled]);

  return {
    documents,
    loading,
    isLoadingMore,
    hasMore,
    totalCount,
    page,
    loadMoreRef,
    filters,
    setFilters,
    refetch,
    deleteDocument,
  };
}
