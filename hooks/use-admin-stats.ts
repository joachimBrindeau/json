'use client';

import { useApiData } from './use-api-data';
import { apiClient } from '@/lib/api/client';

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

interface SystemStatsResponse {
  storage?: { documentsCount: number };
  tags?: { totalTags: number };
  database?: { status: string; responseTime: number };
  redis?: { status: string; memoryUsed: number; memoryMax: number };
  application?: { uptime: number; version: string; environment: string };
}

interface UsersStatsResponse {
  totalUsers: number;
  activeToday: number;
}

export function useAdminStats() {
  const {
    data: stats,
    loading,
    error,
  } = useApiData<AdminStats>({
    endpoint: '/api/admin/system/stats',
    errorMessage: 'Failed to fetch admin stats',
    refreshInterval: 30000,
    transform: async (systemData: SystemStatsResponse) => {
      // Fetch users data in parallel as part of transformation
      const usersData = await apiClient.get<UsersStatsResponse>('/api/admin/users');

      return {
        userCount: usersData.totalUsers || 0,
        documentCount: systemData.storage?.documentsCount || 0,
        tagCount: systemData.tags?.totalTags || 0,
        activeToday: usersData.activeToday || 0,
        database: systemData.database || { status: 'unknown', responseTime: 0 },
        redis: systemData.redis || { status: 'unknown', memoryUsed: 0, memoryMax: 0 },
        application: systemData.application || {
          uptime: 0,
          version: '1.0.0',
          environment: 'unknown',
        },
      };
    },
  });

  return {
    stats,
    loading,
    error: error?.message || null,
  };
}
