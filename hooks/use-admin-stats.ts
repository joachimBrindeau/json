'use client';

import { useState, useEffect } from 'react';

interface AdminStats {
  userCount: number;
  documentCount: number;
  tagCount: number;
  activeToday: number;
  database: {
    status: string;
    responseTime: number;
  };
  redis: {
    status: string;
    memoryUsed: number;
    memoryMax: number;
  };
  application: {
    uptime: number;
    version: string;
    environment: string;
  };
}

export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch system stats
        const [systemResponse, usersResponse] = await Promise.all([
          fetch('/api/admin/system/stats'),
          fetch('/api/admin/users')
        ]);

        if (!systemResponse.ok || !usersResponse.ok) {
          throw new Error('Failed to fetch admin stats');
        }

        const systemData = await systemResponse.json();
        const usersData = await usersResponse.json();

        setStats({
          userCount: usersData.totalUsers || 0,
          documentCount: systemData.storage?.documentsCount || 0,
          tagCount: systemData.tags?.totalTags || 0,
          activeToday: usersData.activeToday || 0,
          database: systemData.database || { status: 'unknown', responseTime: 0 },
          redis: systemData.redis || { status: 'unknown', memoryUsed: 0, memoryMax: 0 },
          application: systemData.application || { uptime: 0, version: '1.0.0', environment: 'unknown' }
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return { stats, loading, error };
}