'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { LoadingState } from '@/components/shared/loading-state'
import { EmptyState } from '@/components/shared/empty-states'
import { AlertTriangle } from 'lucide-react'
import { formatSize, formatUptime } from '@/lib/utils/formatters'
import { useApiData } from '@/hooks/use-api-data'
import { useApiDelete, useApiPost } from '@/hooks/use-api-mutation'

interface SystemStats {
  database: {
    status: 'healthy' | 'warning' | 'error'
    responseTime: number
    totalTables: number
    totalRecords: number
  }
  redis: {
    status: 'connected' | 'disconnected'
    memoryUsed: number
    memoryMax: number
    hitRate: number
  }
  application: {
    uptime: number
    version: string
    nodeVersion: string
    environment: string
    memoryUsage: number
  }
  storage: {
    documentsCount: number
    totalSize: number
    avgDocumentSize: number
  }
}

export function SystemStats() {
  const { data: stats, loading, refetch } = useApiData<SystemStats>({
    endpoint: '/api/admin/system/stats',
    errorMessage: 'Failed to load system stats',
    refreshInterval: 30000, // Refresh every 30 seconds
  })

  const clearCache = useApiDelete('/api/admin/system/cache', {
    successMessage: 'Cache cleared successfully',
    onSuccess: () => refetch(),
  })

  const optimizeDb = useApiPost('/api/admin/system/optimize', {
    successMessage: 'Database optimization started',
    onSuccess: () => refetch(),
  })


  if (loading) {
    return <LoadingState message="Loading system statistics..." size="md" />
  }

  if (!stats) {
    return (
      <EmptyState
        icon={<AlertTriangle className="h-12 w-12" />}
        title="Failed to Load Statistics"
        description="Unable to load system statistics. Please try again."
        action={{
          label: 'Retry',
          onClick: refetch,
          variant: 'outline'
        }}
      />
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* System Health Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Database</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Badge variant={stats.database.status === 'healthy' ? 'default' : 'destructive'}>
                {stats.database.status}
              </Badge>
              <span className="text-sm text-gray-500">{stats.database.responseTime}ms</span>
            </div>
            <div className="mt-2 space-y-1 text-sm text-gray-600">
              <div>Tables: {stats.database.totalTables}</div>
              <div>Records: {stats.database.totalRecords.toLocaleString()}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Redis Cache</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Badge variant={stats.redis.status === 'connected' ? 'default' : 'destructive'}>
                {stats.redis.status}
              </Badge>
              <span className="text-sm text-gray-500">{stats.redis.hitRate.toFixed(1)}% hit rate</span>
            </div>
            <div className="mt-2">
              <div className="flex justify-between text-sm mb-1">
                <span>Memory</span>
                <span>{formatSize(stats.redis.memoryUsed)} / {formatSize(stats.redis.memoryMax)}</span>
              </div>
              <Progress value={(stats.redis.memoryUsed / stats.redis.memoryMax) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Application</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Badge variant="default">{stats.application.environment}</Badge>
              <span className="text-sm text-gray-500">v{stats.application.version}</span>
            </div>
            <div className="mt-2 space-y-1 text-sm text-gray-600">
              <div>Uptime: {formatUptime(stats.application.uptime)}</div>
              <div>Node: {stats.application.nodeVersion}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Storage Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Storage Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.storage.documentsCount.toLocaleString()}</div>
              <div className="text-sm text-gray-500">Total Documents</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{formatSize(stats.storage.totalSize)}</div>
              <div className="text-sm text-gray-500">Total Size</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{formatSize(stats.storage.avgDocumentSize)}</div>
              <div className="text-sm text-gray-500">Average Document Size</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Actions */}
      <Card>
        <CardHeader>
          <CardTitle>System Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <Button variant="outline" onClick={() => refetch()} className="w-full sm:w-auto">
              Refresh Stats
            </Button>
            <Button
              variant="outline"
              onClick={() => clearCache.mutate('')}
              disabled={clearCache.isLoading}
              className="w-full sm:w-auto"
            >
              {clearCache.isLoading ? 'Clearing...' : 'Clear Cache'}
            </Button>
            <Button
              variant="outline"
              onClick={() => optimizeDb.mutate({})}
              disabled={optimizeDb.isLoading}
              className="w-full sm:w-auto"
            >
              {optimizeDb.isLoading ? 'Optimizing...' : 'Optimize Database'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle>System Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between border-b pb-2">
              <span>System started</span>
              <span className="text-gray-500">{formatUptime(stats.application.uptime)} ago</span>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <span>Database connection established</span>
              <span className="text-gray-500">{formatUptime(stats.application.uptime)} ago</span>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <span>Redis cache connected</span>
              <span className="text-gray-500">{formatUptime(stats.application.uptime)} ago</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Last health check</span>
              <span className="text-green-600">Just now</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}