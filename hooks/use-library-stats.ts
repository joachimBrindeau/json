'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useBackendStore } from '@/lib/store/backend';
import { useApiData } from './use-api-data';

interface LibraryStatsData {
  totalJsons: number;
  totalSize: number;
}

interface LibraryStats extends LibraryStatsData {
  loading: boolean;
}

interface UserStatsResponse {
  total: number;
  totalSize: number;
}

export function useLibraryStats(): LibraryStats {
  const { data: session } = useSession();
  const setLibraryUpdateCallback = useBackendStore((state) => state.setLibraryUpdateCallback);

  const { data, loading, refetch } = useApiData<LibraryStatsData, UserStatsResponse>({
    endpoint: '/api/user/stats',
    errorMessage: 'Failed to load library stats',
    enabled: !!session,
    showToast: false,
    transform: (rawData) => ({
      totalJsons: rawData.total || 0,
      totalSize: rawData.totalSize || 0,
    }),
    // Don't pass session as dependency - it changes on every render
    // The enabled flag is sufficient to control when to fetch
  });

  // Use a ref to store the latest refetch function
  const refetchRef = useRef(refetch);

  // Update the ref when refetch changes
  useEffect(() => {
    refetchRef.current = refetch;
  }, [refetch]);

  // Create a stable callback that calls the latest refetch
  const stableRefetch = useCallback(() => {
    refetchRef.current();
  }, []);

  // Register for updates from backend store
  // Only set the callback once when session becomes available
  useEffect(() => {
    if (session) {
      setLibraryUpdateCallback(stableRefetch);
      return () => {
        setLibraryUpdateCallback(() => {});
      };
    }
  }, [session, setLibraryUpdateCallback, stableRefetch]);

  return {
    totalJsons: data?.totalJsons || 0,
    totalSize: data?.totalSize || 0,
    loading,
  };
}
