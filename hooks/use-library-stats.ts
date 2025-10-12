'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useBackendStore } from '@/lib/store/backend';

interface LibraryStats {
  totalJsons: number;
  totalSize: number;
  loading: boolean;
}

export function useLibraryStats(): LibraryStats {
  const { data: session } = useSession();
  const { setLibraryUpdateCallback } = useBackendStore();
  const [stats, setStats] = useState<LibraryStats>({
    totalJsons: 0,
    totalSize: 0,
    loading: true,
  });

  const loadStats = useCallback(async () => {
    if (!session) {
      setStats({ totalJsons: 0, totalSize: 0, loading: false });
      return;
    }

    try {
      setStats((prev) => ({ ...prev, loading: true }));

      // Fetch stats from API
      const response = await fetch('/api/saved?limit=1');
      if (!response.ok) {
        throw new Error('Failed to fetch library stats');
      }

      const data = await response.json();
      const totalJsons = data.pagination?.total || 0;
      
      // For total size, we need all documents (or create a separate stats endpoint)
      let totalSize = 0;
      if (totalJsons > 0) {
        const allResponse = await fetch(`/api/saved?limit=${totalJsons}`);
        if (allResponse.ok) {
          const allData = await allResponse.json();
          totalSize = allData.documents?.reduce((sum: number, doc: { size: number }) => sum + (doc.size || 0), 0) || 0;
        }
      }

      setStats({
        totalJsons,
        totalSize,
        loading: false,
      });
    } catch (error) {
      console.error('Failed to load library stats:', error);
      setStats({ totalJsons: 0, totalSize: 0, loading: false });
    }
  }, [session]);

  useEffect(() => {
    loadStats();
  }, [session, loadStats]);
  
  // Register for updates
  useEffect(() => {
    if (session) {
      setLibraryUpdateCallback(loadStats);
      return () => {
        setLibraryUpdateCallback(() => {});
      };
    }
  }, [setLibraryUpdateCallback, loadStats, session]);

  return stats;
}
