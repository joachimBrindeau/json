'use client';

import { useState, useEffect, useCallback } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { logger } from '@/lib/logger';
import { apiClient } from '@/lib/api/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TrendingUp, AlertTriangle, Users, Hash, BarChart2, Activity } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface TagStat {
  tag: string;
  count: number;
  totalViews: number;
  avgViewsPerDoc: number;
  uniqueUsers: number;
  firstSeen: string;
  lastSeen: string;
  trending: number;
}

interface Analytics {
  period: string;
  totalTags: number;
  topTags: TagStat[];
  trendingTags: TagStat[];
  suspiciousTags: TagStat[];
  categoryDistribution: { category: string; count: number }[];
  summary: {
    avgTagsPerDoc: string;
    totalDocuments: number;
    uniqueAuthors: number;
  };
}

export default function TagAnalyticsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');
  const [error, setError] = useState('');

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiClient.get<Analytics>(`/api/tags/analytics?days=${period}`);
      setAnalytics(data);
    } catch (err) {
      setError('Failed to load tag analytics');
      logger.error({ err, period }, 'Failed to load tag analytics');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    if (!session) {
      router.push('/');
      return;
    }
    fetchAnalytics();
  }, [session, period, fetchAnalytics, router]);

  // const formatDate = (date: string) => new Date(date).toLocaleDateString();

  const getTrendIcon = (trend: number) => {
    if (trend > 5) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend > 0) return <Activity className="h-4 w-4 text-blue-500" />;
    return null;
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <LoadingSpinner size="md" />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-full">
          <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
          <p className="text-lg">{error}</p>
          <Button onClick={fetchAnalytics} className="mt-4">
            Retry
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 space-y-6 overflow-auto h-full">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Tag Analytics</h1>
            <p className="text-muted-foreground">Monitor tag usage and identify patterns</p>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {analytics && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Tags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-blue-500" />
                    <p className="text-2xl font-bold">{analytics.totalTags}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Documents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <BarChart2 className="h-4 w-4 text-green-500" />
                    <p className="text-2xl font-bold">{analytics.summary.totalDocuments}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Unique Authors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-purple-500" />
                    <p className="text-2xl font-bold">{analytics.summary.uniqueAuthors}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Avg Tags/Doc
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-orange-500" />
                    <p className="text-2xl font-bold">{analytics.summary.avgTagsPerDoc}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Tags */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Hash className="h-5 w-5" />
                    Top Tags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analytics.topTags.slice(0, 10).map((tag, index) => (
                      <div key={tag.tag} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground w-6">#{index + 1}</span>
                          <Badge variant="outline">{tag.tag}</Badge>
                          {getTrendIcon(tag.trending)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{tag.count} uses</span>
                          <span>{tag.totalViews} views</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Trending Tags */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Trending Tags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analytics.trendingTags.map((tag) => (
                      <div key={tag.tag} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="default">{tag.tag}</Badge>
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        </div>
                        <div className="text-sm text-muted-foreground">{tag.uniqueUsers} users</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Category Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart2 className="h-5 w-5" />
                    Category Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.categoryDistribution.map((cat) => (
                      <div key={cat.category}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm">{cat.category}</span>
                          <span className="text-sm text-muted-foreground">{cat.count}</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{
                              width: `${(cat.count / Math.max(...analytics.categoryDistribution.map((c) => c.count))) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Suspicious Tags */}
              {analytics.suspiciousTags.length > 0 && (
                <Card className="border-yellow-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-yellow-600">
                      <AlertTriangle className="h-5 w-5" />
                      Suspicious Tags
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analytics.suspiciousTags.map((tag) => (
                        <div key={tag.tag} className="flex items-center justify-between">
                          <Badge variant="destructive">{tag.tag}</Badge>
                          <div className="text-sm text-muted-foreground">
                            <span className="text-yellow-600">
                              {tag.uniqueUsers === 1
                                ? 'Single user'
                                : `Low engagement (${tag.avgViewsPerDoc} avg views)`}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mt-4">
                      These tags may require moderation or cleanup
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
