import { Prisma } from '@prisma/client';
import { prisma } from '../../db';
import {
  buildPagination,
  buildPaginationResult,
  handleDatabaseError,
  PaginationParams,
  PaginationResult
} from './common';

// Analytics input types
export interface ViewTrackingInput {
  documentId: string;
  userAgent?: string;
  ipHash?: string;
  parseTime?: number;
  renderTime?: number;
  memoryUsage?: bigint;
}

export interface AnalyticsQueryOptions extends PaginationParams {
  since?: Date;
  until?: Date;
  sortBy?: 'views' | 'recent' | 'performance';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Track a document view with performance metrics
 */
export async function trackView(input: ViewTrackingInput): Promise<{
  success: boolean;
  error?: string;
  status?: number;
}> {
  try {
    // First check if document exists
    const document = await prisma.jsonDocument.findUnique({
      where: { id: input.documentId },
      select: { id: true, shareId: true }
    });

    if (!document) {
      return { success: false, error: 'Document not found', status: 404 };
    }

    // Check if there's an existing analytics record for this session/document
    const existingAnalytics = await prisma.jsonAnalytics.findFirst({
      where: {
        documentId: input.documentId,
        ipHash: input.ipHash,
        lastViewed: {
          gte: new Date(Date.now() - 30 * 60 * 1000) // Within last 30 minutes
        }
      }
    });

    if (existingAnalytics) {
      // Update existing record
      await prisma.jsonAnalytics.update({
        where: { id: existingAnalytics.id },
        data: {
          viewCount: { increment: 1 },
          lastViewed: new Date(),
          parseTime: input.parseTime || existingAnalytics.parseTime,
          renderTime: input.renderTime || existingAnalytics.renderTime,
          memoryUsage: input.memoryUsage || existingAnalytics.memoryUsage,
          updatedAt: new Date()
        }
      });
    } else {
      // Create new analytics record
      await prisma.jsonAnalytics.create({
        data: {
          documentId: input.documentId,
          userAgent: input.userAgent?.slice(0, 500), // Limit length
          ipHash: input.ipHash,
          parseTime: input.parseTime || 0,
          renderTime: input.renderTime,
          memoryUsage: input.memoryUsage,
          viewCount: 1,
          lastViewed: new Date()
        }
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Track view error:', error);
    return {
      success: false,
      ...handleDatabaseError(error)
    };
  }
}

/**
 * Get analytics for a specific document
 */
export async function getDocumentAnalytics(
  documentId: string,
  userId?: string
): Promise<{
  success: boolean;
  data?: {
    totalViews: number;
    uniqueViews: number;
    avgParseTime: number;
    avgRenderTime: number;
    avgMemoryUsage: string;
    viewsOverTime: Array<{ date: string; views: number }>;
    topUserAgents: Array<{ userAgent: string; count: number }>;
    performanceMetrics: {
      avgParseTime: number;
      minParseTime: number;
      maxParseTime: number;
      avgRenderTime: number;
      minRenderTime: number;
      maxRenderTime: number;
    };
  };
  error?: string;
  status?: number;
}> {
  try {
    // First verify document exists and user has access
    const document = await prisma.jsonDocument.findFirst({
      where: {
        OR: [{ id: documentId }, { shareId: documentId }]
      },
      select: {
        id: true,
        userId: true,
        visibility: true,
        isAnonymous: true
      }
    });

    if (!document) {
      return { success: false, error: 'Document not found', status: 404 };
    }

    // Check access permissions for analytics
    const hasAccess = 
      document.userId === userId || // Owner
      document.visibility === 'public'; // Public document

    if (!hasAccess) {
      return { success: false, error: 'Access denied', status: 403 };
    }

    // Get aggregated analytics
    const analytics = await prisma.jsonAnalytics.aggregate({
      where: { documentId: document.id },
      _sum: { viewCount: true },
      _count: { id: true },
      _avg: { parseTime: true, renderTime: true, memoryUsage: true },
      _min: { parseTime: true, renderTime: true },
      _max: { parseTime: true, renderTime: true }
    });

    // Get views over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const viewsOverTime = await prisma.$queryRaw<Array<{ date: string; views: bigint }>>`
      SELECT 
        DATE(last_viewed) as date,
        SUM(view_count) as views
      FROM json_analytics 
      WHERE document_id = ${document.id}
      AND last_viewed >= ${thirtyDaysAgo}
      GROUP BY DATE(last_viewed)
      ORDER BY date ASC
    `;

    // Get top user agents
    const topUserAgents = await prisma.jsonAnalytics.groupBy({
      by: ['userAgent'],
      where: {
        documentId: document.id,
        userAgent: { not: null }
      },
      _count: { userAgent: true },
      orderBy: { _count: { userAgent: 'desc' } },
      take: 10
    });

    return {
      success: true,
      data: {
        totalViews: analytics._sum.viewCount || 0,
        uniqueViews: analytics._count.id,
        avgParseTime: Math.round(analytics._avg.parseTime || 0),
        avgRenderTime: Math.round(analytics._avg.renderTime || 0),
        avgMemoryUsage: ((Number(analytics._avg.memoryUsage || 0)) / (1024 * 1024)).toFixed(2) + ' MB',
        viewsOverTime: viewsOverTime.map(item => ({
          date: item.date,
          views: Number(item.views)
        })),
        topUserAgents: topUserAgents
          .filter(ua => ua.userAgent)
          .map(ua => ({
            userAgent: ua.userAgent!.slice(0, 100), // Truncate for display
            count: ua._count.userAgent
          })),
        performanceMetrics: {
          avgParseTime: Math.round(analytics._avg.parseTime || 0),
          minParseTime: analytics._min.parseTime || 0,
          maxParseTime: analytics._max.parseTime || 0,
          avgRenderTime: Math.round(analytics._avg.renderTime || 0),
          minRenderTime: analytics._min.renderTime || 0,
          maxRenderTime: analytics._max.renderTime || 0
        }
      }
    };
  } catch (error) {
    console.error('Get document analytics error:', error);
    return {
      success: false,
      ...handleDatabaseError(error)
    };
  }
}

/**
 * Get tag analytics and usage statistics
 */
export async function getTagAnalytics(
  options: {
    days?: number;
    limit?: number;
    userId?: string;
  } = {}
): Promise<{
  success: boolean;
  data?: {
    period: string;
    totalTags: number;
    topTags: Array<{
      tag: string;
      count: number;
      totalViews: number;
      avgViewsPerDoc: number;
      uniqueUsers: number;
      firstSeen: Date;
      lastSeen: Date;
      trending: number;
    }>;
    trendingTags: Array<any>;
    suspiciousTags: Array<any>;
    categoryDistribution: Array<{ category: string; count: number }>;
    summary: {
      avgTagsPerDoc: string;
      totalDocuments: number;
      uniqueAuthors: number;
    };
  };
  error?: string;
  status?: number;
}> {
  try {
    const days = Math.min(options.days || 30, 365);
    const limit = Math.min(options.limit || 50, 100);
    const since = new Date();
    since.setDate(since.getDate() - days);

    const whereClause: Prisma.JsonDocumentWhereInput = {
      visibility: 'public',
      publishedAt: { gte: since },
      ...(options.userId && { userId: options.userId })
    };

    // Get all documents with tags
    const documents = await prisma.jsonDocument.findMany({
      where: whereClause,
      select: {
        tags: true,
        publishedAt: true,
        viewCount: true,
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Calculate tag statistics
    const tagStats = new Map<string, {
      count: number;
      totalViews: number;
      firstSeen: Date;
      lastSeen: Date;
      users: Set<string>;
    }>();

    documents.forEach(doc => {
      doc.tags.forEach(tag => {
        const stats = tagStats.get(tag) || {
          count: 0,
          totalViews: 0,
          firstSeen: new Date(),
          lastSeen: new Date(0),
          users: new Set()
        };

        stats.count++;
        stats.totalViews += doc.viewCount;

        if (doc.publishedAt) {
          if (doc.publishedAt < stats.firstSeen) {
            stats.firstSeen = doc.publishedAt;
          }
          if (doc.publishedAt > stats.lastSeen) {
            stats.lastSeen = doc.publishedAt;
          }
        }

        if (doc.user?.id) {
          stats.users.add(doc.user.id);
        }

        tagStats.set(tag, stats);
      });
    });

    // Convert to array and sort by usage
    const sortedTags = Array.from(tagStats.entries())
      .map(([tag, stats]) => ({
        tag,
        count: stats.count,
        totalViews: stats.totalViews,
        avgViewsPerDoc: Math.round(stats.totalViews / stats.count),
        uniqueUsers: stats.users.size,
        firstSeen: stats.firstSeen,
        lastSeen: stats.lastSeen,
        trending: calculateTrendScore(stats)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    // Identify suspicious tags
    const suspiciousTags = sortedTags.filter(tag => {
      const singleUserHighFreq = tag.uniqueUsers === 1 && tag.count > 10;
      const lowEngagement = tag.avgViewsPerDoc < 2 && tag.count > 5;
      const suddenSpike = isRecentSpike(tag);
      return singleUserHighFreq || lowEngagement || suddenSpike;
    });

    // Category distribution
    const categoryMap = new Map<string, number>();
    documents.forEach(doc => {
      doc.tags.forEach(tag => {
        const category = categorizeTag(tag);
        categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
      });
    });

    const categoryDistribution = Array.from(categoryMap.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    return {
      success: true,
      data: {
        period: `${days} days`,
        totalTags: tagStats.size,
        topTags: sortedTags.slice(0, 20),
        trendingTags: sortedTags.sort((a, b) => b.trending - a.trending).slice(0, 10),
        suspiciousTags: suspiciousTags.slice(0, 10),
        categoryDistribution,
        summary: {
          avgTagsPerDoc: documents.length > 0 
            ? (documents.reduce((sum, doc) => sum + doc.tags.length, 0) / documents.length).toFixed(1)
            : '0',
          totalDocuments: documents.length,
          uniqueAuthors: new Set(documents.map(d => d.user?.id).filter(Boolean)).size
        }
      }
    };
  } catch (error) {
    console.error('Get tag analytics error:', error);
    return {
      success: false,
      ...handleDatabaseError(error)
    };
  }
}

/**
 * Get user activity analytics
 */
export async function getUserAnalytics(
  userId: string,
  options: AnalyticsQueryOptions = {}
): Promise<{
  success: boolean;
  data?: {
    documentsCreated: number;
    totalViews: number;
    avgViewsPerDocument: number;
    publicDocuments: number;
    privateDocuments: number;
    topDocuments: Array<{
      id: string;
      title: string;
      views: number;
      created: Date;
    }>;
    activityOverTime: Array<{
      date: string;
      documentsCreated: number;
      views: number;
    }>;
    performanceStats: {
      avgParseTime: number;
      avgRenderTime: number;
      avgMemoryUsage: string;
    };
  };
  error?: string;
  status?: number;
}> {
  try {
    const since = options.since || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days
    const until = options.until || new Date();

    // Get user documents summary
    const documentStats = await prisma.jsonDocument.aggregate({
      where: {
        userId,
        createdAt: { gte: since, lte: until }
      },
      _count: { id: true },
      _sum: { viewCount: true }
    });

    // Get visibility breakdown
    const visibilityStats = await prisma.jsonDocument.groupBy({
      by: ['visibility'],
      where: {
        userId,
        createdAt: { gte: since, lte: until }
      },
      _count: { visibility: true }
    });

    const visibilityMap = visibilityStats.reduce((acc, stat) => {
      acc[stat.visibility] = stat._count.visibility;
      return acc;
    }, {} as Record<string, number>);

    // Get top documents by views
    const topDocuments = await prisma.jsonDocument.findMany({
      where: {
        userId,
        createdAt: { gte: since, lte: until }
      },
      select: {
        id: true,
        shareId: true,
        title: true,
        viewCount: true,
        createdAt: true
      },
      orderBy: { viewCount: 'desc' },
      take: 10
    });

    // Get activity over time
    const activityOverTime = await prisma.$queryRaw<Array<{
      date: string;
      documents_created: bigint;
      total_views: bigint;
    }>>`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as documents_created,
        SUM(view_count) as total_views
      FROM json_documents 
      WHERE user_id = ${userId}
      AND created_at >= ${since}
      AND created_at <= ${until}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    // Get performance analytics for user's documents
    const performanceStats = await prisma.jsonAnalytics.aggregate({
      where: {
        document: { userId }
      },
      _avg: {
        parseTime: true,
        renderTime: true,
        memoryUsage: true
      }
    });

    return {
      success: true,
      data: {
        documentsCreated: documentStats._count.id,
        totalViews: documentStats._sum.viewCount || 0,
        avgViewsPerDocument: documentStats._count.id > 0 
          ? Math.round((documentStats._sum.viewCount || 0) / documentStats._count.id)
          : 0,
        publicDocuments: visibilityMap.public || 0,
        privateDocuments: visibilityMap.private || 0,
        topDocuments: topDocuments.map(doc => ({
          id: doc.shareId,
          title: doc.title || 'Untitled',
          views: doc.viewCount,
          created: doc.createdAt
        })),
        activityOverTime: activityOverTime.map(item => ({
          date: item.date,
          documentsCreated: Number(item.documents_created),
          views: Number(item.total_views)
        })),
        performanceStats: {
          avgParseTime: Math.round(performanceStats._avg.parseTime || 0),
          avgRenderTime: Math.round(performanceStats._avg.renderTime || 0),
          avgMemoryUsage: ((Number(performanceStats._avg.memoryUsage || 0)) / (1024 * 1024)).toFixed(2) + ' MB'
        }
      }
    };
  } catch (error) {
    console.error('Get user analytics error:', error);
    return {
      success: false,
      ...handleDatabaseError(error)
    };
  }
}

/**
 * Get overall platform analytics (admin only)
 */
export async function getPlatformAnalytics(
  options: AnalyticsQueryOptions = {}
): Promise<{
  success: boolean;
  data?: {
    totalDocuments: number;
    totalUsers: number;
    totalViews: number;
    publicDocuments: number;
    averageDocumentSize: string;
    topCategories: Array<{ category: string; count: number }>;
    userGrowth: Array<{ date: string; newUsers: number; totalUsers: number }>;
    documentGrowth: Array<{ date: string; newDocuments: number; totalDocuments: number }>;
    performanceOverview: {
      avgParseTime: number;
      avgRenderTime: number;
      avgMemoryUsage: string;
    };
  };
  error?: string;
  status?: number;
}> {
  try {
    const since = options.since || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Overall platform stats
    const [documentStats, userStats, performanceStats] = await Promise.all([
      prisma.jsonDocument.aggregate({
        _count: { id: true },
        _sum: { viewCount: true, size: true }
      }),
      prisma.user.aggregate({
        _count: { id: true }
      }),
      prisma.jsonAnalytics.aggregate({
        _avg: {
          parseTime: true,
          renderTime: true,
          memoryUsage: true
        }
      })
    ]);

    // Public documents count
    const publicCount = await prisma.jsonDocument.count({
      where: { visibility: 'public' }
    });

    // Top categories
    const topCategories = await prisma.jsonDocument.groupBy({
      by: ['category'],
      where: {
        category: { not: null },
        visibility: 'public'
      },
      _count: { category: true },
      orderBy: { _count: { category: 'desc' } },
      take: 10
    });

    // User growth over time
    const userGrowth = await prisma.$queryRaw<Array<{
      date: string;
      new_users: bigint;
      total_users: bigint;
    }>>`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as new_users,
        SUM(COUNT(*)) OVER (ORDER BY DATE(created_at)) as total_users
      FROM users 
      WHERE created_at >= ${since}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    // Document growth over time
    const documentGrowth = await prisma.$queryRaw<Array<{
      date: string;
      new_documents: bigint;
      total_documents: bigint;
    }>>`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as new_documents,
        SUM(COUNT(*)) OVER (ORDER BY DATE(created_at)) as total_documents
      FROM json_documents 
      WHERE created_at >= ${since}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    return {
      success: true,
      data: {
        totalDocuments: documentStats._count.id,
        totalUsers: userStats._count.id,
        totalViews: documentStats._sum.viewCount || 0,
        publicDocuments: publicCount,
        averageDocumentSize: ((Number(documentStats._sum.size || 0) / documentStats._count.id) / (1024 * 1024)).toFixed(2) + ' MB',
        topCategories: topCategories
          .filter(cat => cat.category)
          .map(cat => ({
            category: cat.category!,
            count: cat._count.category
          })),
        userGrowth: userGrowth.map(item => ({
          date: item.date,
          newUsers: Number(item.new_users),
          totalUsers: Number(item.total_users)
        })),
        documentGrowth: documentGrowth.map(item => ({
          date: item.date,
          newDocuments: Number(item.new_documents),
          totalDocuments: Number(item.total_documents)
        })),
        performanceOverview: {
          avgParseTime: Math.round(performanceStats._avg.parseTime || 0),
          avgRenderTime: Math.round(performanceStats._avg.renderTime || 0),
          avgMemoryUsage: ((Number(performanceStats._avg.memoryUsage || 0)) / (1024 * 1024)).toFixed(2) + ' MB'
        }
      }
    };
  } catch (error) {
    console.error('Get platform analytics error:', error);
    return {
      success: false,
      ...handleDatabaseError(error)
    };
  }
}

// Helper functions (extracted from the existing API)

function calculateTrendScore(stats: {
  count: number;
  totalViews: number;
  firstSeen: Date;
  lastSeen: Date;
  users: Set<string>;
}): number {
  const now = new Date();
  const daysSinceLastUse = (now.getTime() - stats.lastSeen.getTime()) / (1000 * 60 * 60 * 24);
  const daysSinceFirstUse = (now.getTime() - stats.firstSeen.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSinceLastUse > 7) return 0; // Not used recently

  // Higher score for newer tags used frequently
  const recencyScore = Math.max(0, 10 - daysSinceLastUse);
  const frequencyScore = stats.count / Math.max(1, daysSinceFirstUse);

  return recencyScore * frequencyScore;
}

function isRecentSpike(tag: {
  tag: string;
  count: number;
  totalViews: number;
  avgViewsPerDoc: number;
  uniqueUsers: number;
  firstSeen: Date;
  lastSeen: Date;
  trending: number;
}): boolean {
  const daysSinceFirst = (new Date().getTime() - tag.firstSeen.getTime()) / (1000 * 60 * 60 * 24);
  // New tag with high usage in short time
  return daysSinceFirst < 3 && tag.count > 20;
}

function categorizeTag(tag: string): string {
  const lower = tag.toLowerCase();

  if (['javascript', 'typescript', 'python', 'java', 'cpp', 'csharp', 'go', 'rust', 'ruby', 'php'].some(lang => lower.includes(lang))) {
    return 'Programming Languages';
  }
  if (['react', 'vue', 'angular', 'nextjs', 'express', 'django', 'flask', 'spring'].some(fw => lower.includes(fw))) {
    return 'Frameworks';
  }
  if (['api', 'rest', 'graphql', 'websocket', 'http'].some(api => lower.includes(api))) {
    return 'API/Network';
  }
  if (['database', 'sql', 'nosql', 'mongodb', 'postgresql', 'mysql'].some(db => lower.includes(db))) {
    return 'Database';
  }
  if (['docker', 'kubernetes', 'aws', 'azure', 'gcp', 'devops'].some(infra => lower.includes(infra))) {
    return 'Infrastructure';
  }
  if (['test', 'testing', 'unit', 'e2e', 'mock'].some(test => lower.includes(test))) {
    return 'Testing';
  }

  return 'Other';
}