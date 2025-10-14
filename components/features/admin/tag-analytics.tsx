'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { LoadingState } from '@/components/shared/loading-state'
import { EmptyState } from '@/components/shared/empty-state'
import { AlertTriangle } from 'lucide-react'
import { logger } from '@/lib/logger'
import { apiClient } from '@/lib/api/client'
import { ErrorBoundary } from '@/components/shared/error-boundary'
import { showApiErrorToast } from '@/lib/utils/toast-helpers'

interface TagStats {
  name: string
  count: number
  percentage: number
  trend: 'up' | 'down' | 'stable'
  recentUsage: number
}

interface TagAnalytics {
  totalTags: number
  totalUsage: number
  popularTags: TagStats[]
  recentTags: string[]
  tagsByUser: Array<{
    userId: string
    userEmail: string
    userName?: string
    tagCount: number
  }>
}

export function TagAnalytics() {
  const [analytics, setAnalytics] = useState<TagAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchTagAnalytics = async () => {
    try {
      const data = await apiClient.get<TagAnalytics>('/api/admin/tags/analytics')
      setAnalytics(data)
    } catch (error) {
      logger.error({ err: error }, 'Failed to fetch tag analytics')
      showApiErrorToast('Failed to load tag analytics', error, fetchTagAnalytics)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTagAnalytics()
  }, [])

  if (loading) {
    return <LoadingState message="Loading tag analytics..." size="md" />
  }

  if (!analytics) {
    return (
      <EmptyState
        icon={<AlertTriangle className="h-12 w-12" />}
        title="Failed to Load Analytics"
        description="Unable to load tag analytics. Please try again."
        action={{
          label: 'Retry',
          onClick: fetchTagAnalytics,
          variant: 'outline'
        }}
      />
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalTags}</div>
            <p className="text-sm text-gray-500">Unique tags created</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalUsage}</div>
            <p className="text-sm text-gray-500">Tags applied to documents</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Average per Document</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.totalUsage > 0 ? (analytics.totalUsage / analytics.totalTags).toFixed(1) : '0'}
            </div>
            <p className="text-sm text-gray-500">Tags per document</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Popular Tags */}
        <ErrorBoundary
          level="widget"
          fallback={<div className="text-sm text-muted-foreground p-4">Failed to load popular tags</div>}
          compactMode
        >
        <Card>
          <CardHeader>
            <CardTitle>Most Popular Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.popularTags.map((tag, index) => (
                <div key={tag.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                    <Badge variant="outline">{tag.name}</Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">{tag.count} uses</span>
                    <div className="flex items-center">
                      {tag.trend === 'up' && (
                        <span className="text-green-500">↗</span>
                      )}
                      {tag.trend === 'down' && (
                        <span className="text-red-500">↘</span>
                      )}
                      {tag.trend === 'stable' && (
                        <span className="text-gray-400">→</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        </ErrorBoundary>

        {/* Tag Usage by User */}
        <ErrorBoundary
          level="widget"
          fallback={<div className="text-sm text-muted-foreground p-4">Failed to load tag contributors</div>}
          compactMode
        >
        <Card>
          <CardHeader>
            <CardTitle>Top Tag Contributors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.tagsByUser.slice(0, 10).map((user, index) => (
                <div key={user.userId} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                    <div>
                      <div className="text-sm font-medium">{user.userName || 'Anonymous'}</div>
                      <div className="text-xs text-gray-500">{user.userEmail}</div>
                    </div>
                  </div>
                  <div className="text-sm font-medium">{user.tagCount} tags</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        </ErrorBoundary>

        {/* Recent Tags */}
        <ErrorBoundary
          level="widget"
          fallback={<div className="text-sm text-muted-foreground p-4">Failed to load recent tags</div>}
          compactMode
        >
        <Card>
          <CardHeader>
            <CardTitle>Recently Created Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {analytics.recentTags.map((tag) => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
              ))}
            </div>
            {analytics.recentTags.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No recent tags</p>
            )}
          </CardContent>
        </Card>
        </ErrorBoundary>

        {/* Tag Distribution */}
        <ErrorBoundary
          level="widget"
          fallback={<div className="text-sm text-muted-foreground p-4">Failed to load tag distribution</div>}
          compactMode
        >
        <Card>
          <CardHeader>
            <CardTitle>Tag Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.popularTags.slice(0, 5).map((tag) => (
                <div key={tag.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{tag.name}</span>
                    <span>{tag.percentage.toFixed(1)}%</span>
                  </div>
                  <Progress value={tag.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        </ErrorBoundary>
      </div>
    </div>
  )
}