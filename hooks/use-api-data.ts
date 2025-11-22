'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient, ApiError } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';

/**
 * Options for the useApiData hook
 */
export interface UseApiDataOptions<T, TRaw = T> {
  /** API endpoint to fetch data from */
  endpoint: string;

  /** Custom error handler callback */
  onError?: (error: Error) => void;

  /** Custom error message for toast notifications */
  errorMessage?: string;

  /** Whether to show toast notifications on error (default: true) */
  showToast?: boolean;

  /** Optional data transformation function (can be async) */
  transform?: (data: TRaw) => T | Promise<T>;

  /** Whether the hook should fetch data (default: true) */
  enabled?: boolean;

  /** Auto-refetch interval in milliseconds (disabled by default) */
  refreshInterval?: number;

  /** Dependencies that trigger a refetch when changed */
  dependencies?: readonly unknown[];
}

/**
 * Return type for the useApiData hook
 */
export interface UseApiDataResult<T> {
  /** The fetched and optionally transformed data */
  data: T | null;

  /** Whether data is currently being fetched */
  loading: boolean;

  /** Error object if the fetch failed */
  error: Error | null;

  /** Manual refetch function */
  refetch: () => Promise<void>;
}

/**
 * Generic hook for fetching data from API endpoints
 * Eliminates duplicated data fetching patterns across the codebase
 *
 * @example
 * ```tsx
 * const { data, loading, error, refetch } = useApiData<AdminStats>({
 *   endpoint: '/api/admin/stats',
 *   errorMessage: 'Failed to load admin statistics',
 *   refreshInterval: 30000, // Refresh every 30 seconds
 * });
 * ```
 */
export function useApiData<T, TRaw = T>(options: UseApiDataOptions<T, TRaw>): UseApiDataResult<T> {
  const {
    endpoint,
    onError,
    errorMessage = 'Failed to fetch data',
    showToast = true,
    transform,
    enabled = true,
    refreshInterval,
    dependencies: _dependencies = [],
  } = options;

  const { toast } = useToast();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const rawResponse = await apiClient.get<any>(endpoint);
      const rawData: TRaw =
        rawResponse && typeof rawResponse === 'object' && 'data' in rawResponse
          ? (rawResponse.data as TRaw)
          : (rawResponse as TRaw);
      const processedData = transform ? await transform(rawData) : (rawData as unknown as T);

      setData(processedData);
    } catch (err) {
      const apiError = err instanceof Error ? err : new Error('Unknown error occurred');

      logger.error({ err: apiError, endpoint }, errorMessage);
      setError(apiError);

      if (showToast) {
        const displayMessage = apiError instanceof ApiError ? apiError.message : errorMessage;

        toast({
          title: 'Error',
          description: displayMessage,
          variant: 'destructive',
        });
      }

      if (onError) {
        onError(apiError);
      }
    } finally {
      setLoading(false);
    }
  }, [endpoint, transform, errorMessage, showToast, toast, onError]);

  // Initial fetch and dependency-triggered refetch
  useEffect(() => {
    // Only fetch on client side to prevent SSR issues
    if (enabled && typeof window !== 'undefined') {
      refetch();
    } else {
      setLoading(false);
    }
  }, [enabled, refetch]);

  // Auto-refresh interval
  useEffect(() => {
    // Only run on client side
    if (enabled && refreshInterval && refreshInterval > 0 && typeof window !== 'undefined') {
      const interval = setInterval(refetch, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [enabled, refreshInterval, refetch]);

  return { data, loading, error, refetch };
}
