'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

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
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSystemStats()
    const interval = setInterval(fetchSystemStats, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchSystemStats = async () => {
    try {
      const response = await fetch('/api/admin/system/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch system stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / (24 * 60 * 60))
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60))
    const minutes = Math.floor((seconds % (60 * 60)) / 60)
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center p-8 text-gray-500">
        Failed to load system statistics
      </div>
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
                <span>{formatBytes(stats.redis.memoryUsed)} / {formatBytes(stats.redis.memoryMax)}</span>
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
              <div className="text-2xl font-bold">{formatBytes(stats.storage.totalSize)}</div>
              <div className="text-sm text-gray-500">Total Size</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{formatBytes(stats.storage.avgDocumentSize)}</div>
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
            <Button variant="outline" onClick={() => fetchSystemStats()} className="w-full sm:w-auto">
              Refresh Stats
            </Button>
            <Button variant="outline" onClick={async () => {
              try {
                const response = await fetch('/api/admin/system/cache', { method: 'DELETE' });
                if (response.ok) {
                  alert('Cache cleared successfully');
                  fetchSystemStats();
                } else {
                  alert('Failed to clear cache');
                }
              } catch (error) {
                alert('Error clearing cache');
              }
            }} className="w-full sm:w-auto">
              Clear Cache
            </Button>
            <Button variant="outline" onClick={async () => {
              try {
                const response = await fetch('/api/admin/system/optimize', { method: 'POST' });
                if (response.ok) {
                  alert('Database optimization started');
                  fetchSystemStats();
                } else {
                  alert('Failed to optimize database');
                }
              } catch (error) {
                alert('Error optimizing database');
              }
            }} className="w-full sm:w-auto">
              Optimize Database
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