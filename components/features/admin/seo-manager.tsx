'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, AlertTriangle } from 'lucide-react'
import { ErrorBoundary } from '@/components/shared/error-boundary'
import { LoadingState } from '@/components/shared/loading-state'
import { EmptyState } from '@/components/shared/empty-states'
import { useApiData } from '@/hooks/use-api-data'

interface SEOData {
  pageKey: string
  title: string
  description: string
  keywords: string[]
  isActive: boolean
  priority: number
  updatedAt: string
}

export function SEOManager() {
  const { data, loading, refetch } = useApiData<{ settings: SEOData[] }>({
    endpoint: '/api/admin/seo',
    errorMessage: 'Failed to load SEO data',
  })

  const seoData = data?.settings || []

  const handleEditSEO = () => {
    window.open('/superadmin', '_blank')
  }

  if (loading) {
    return <LoadingState message="Loading SEO configuration..." size="md" />
  }

  if (!data) {
    return (
      <EmptyState
        icon={<AlertTriangle className="h-12 w-12" />}
        title="Failed to Load SEO Data"
        description="Unable to load SEO configuration. Please try again."
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-medium">SEO Configuration</h3>
          <p className="text-sm text-gray-500">Manage meta tags and SEO settings for all pages</p>
        </div>
        <Button onClick={handleEditSEO} className="flex items-center space-x-2 w-full sm:w-auto">
          <ExternalLink className="h-4 w-4" />
          <span className="hidden sm:inline">Open SEO Editor</span>
          <span className="sm:hidden">SEO Editor</span>
        </Button>
      </div>

      <ErrorBoundary
        level="component"
        fallback={
          <div className="p-4 text-center text-sm text-muted-foreground">
            Failed to load SEO pages
          </div>
        }
        enableRetry
      >
      <div className="grid gap-4">
        {seoData.map((page) => (
          <Card key={page.pageKey}>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="text-base capitalize">{page.pageKey} Page</CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge variant={page.isActive ? "default" : "secondary"} className="text-xs">
                    {page.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge variant="outline" className="text-xs">Priority: {page.priority}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Title</label>
                  <p className="text-sm mt-1">{page.title}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="text-sm mt-1 text-gray-700">{page.description}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Keywords</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {page.keywords.map((keyword, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="text-xs text-gray-500">
                  Last updated: {new Date(page.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      </ErrorBoundary>

      {seoData.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">No SEO configuration found</p>
            <Button onClick={handleEditSEO} className="mt-2">
              Set up SEO
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>SEO Health Check</CardTitle>
          <CardDescription>Quick overview of your SEO configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Pages configured</span>
              <Badge variant={seoData.length > 0 ? "default" : "destructive"}>
                {seoData.length} pages
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Active pages</span>
              <Badge variant={seoData.some(p => p.isActive) ? "default" : "destructive"}>
                {seoData.filter(p => p.isActive).length} active
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">llms.txt endpoint</span>
              <Badge variant="default">
                <a href="/llms.txt" target="_blank" className="flex items-center space-x-1">
                  <span>Active</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}