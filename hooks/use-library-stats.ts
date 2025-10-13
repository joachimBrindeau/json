'use client';

import { useEffect, useCallback } from 'react';
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
  const { setLibraryUpdateCallback } = useBackendStore();

  const { data, loading, refetch } = useApiData<LibraryStatsData, UserStatsResponse>({
    endpoint: '/api/user/stats',
    errorMessage: 'Failed to load library stats',
    enabled: !!session,
    showToast: false,
    transform: (rawData) => ({
      totalJsons: rawData.total || 0,
      totalSize: rawData.totalSize || 0,
    }),
    dependencies: [session],
  });

  // Memoize the refetch callback for the backend store
  const handleLibraryUpdate = useCallback(() => {
    refetch();
  }, [refetch]);

  // Register for updates from backend store
  useEffect(() => {
    if (session) {
      setLibraryUpdateCallback(handleLibraryUpdate);
      return () => {
        setLibraryUpdateCallback(() => {});
      };
    }
  }, [setLibraryUpdateCallback, handleLibraryUpdate, session]);

  return {
    totalJsons: data?.totalJsons || 0,
    totalSize: data?.totalSize || 0,
    loading,
  };
}
