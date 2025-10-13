import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { success, unauthorized, internalServerError } from '@/lib/api/responses';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Only allow authenticated users to view analytics
    if (!session?.user) {
      return unauthorized('Authentication required');
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    const since = new Date();
    since.setDate(since.getDate() - days);

    // Get all public documents with tags
    const documents = await prisma.jsonDocument.findMany({
      where: {
        visibility: 'public',
        publishedAt: {
          gte: since,
        },
      },
      select: {
        tags: true,
        publishedAt: true,
        viewCount: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Calculate tag statistics
    const tagStats = new Map<
      string,
      {
        count: number;
        totalViews: number;
        firstSeen: Date;
        lastSeen: Date;
        users: Set<string>;
      }
    >();

    documents.forEach((doc) => {
      doc.tags.forEach((tag) => {
        const stats = tagStats.get(tag) || {
          count: 0,
          totalViews: 0,
          firstSeen: new Date(),
          lastSeen: new Date(0),
          users: new Set(),
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
        trending: calculateTrendScore(stats),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    // Identify potential spam patterns
    const suspiciousTags = sortedTags.filter((tag) => {
      // Tags used by only one user with high frequency
      const singleUserHighFreq = tag.uniqueUsers === 1 && tag.count > 10;
      // Tags with very low engagement
      const lowEngagement = tag.avgViewsPerDoc < 2 && tag.count > 5;
      // Recently created tags with sudden high usage
      const suddenSpike = isRecentSpike(tag);

      return singleUserHighFreq || lowEngagement || suddenSpike;
    });

    // Category distribution
    const categoryMap = new Map<string, number>();
    documents.forEach((doc) => {
      doc.tags.forEach((tag) => {
        // Attempt to categorize tags
        const category = categorizeTag(tag);
        categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
      });
    });

    const categoryDistribution = Array.from(categoryMap.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    return success({
      period: `${days} days`,
      totalTags: tagStats.size,
      topTags: sortedTags.slice(0, 20),
      trendingTags: sortedTags.sort((a, b) => b.trending - a.trending).slice(0, 10),
      suspiciousTags: suspiciousTags.slice(0, 10),
      categoryDistribution,
      summary: {
        avgTagsPerDoc:
          documents.length > 0
            ? (documents.reduce((sum, doc) => sum + doc.tags.length, 0) / documents.length).toFixed(
                1
              )
            : 0,
        totalDocuments: documents.length,
        uniqueAuthors: new Set(documents.map((d) => d.user?.id).filter(Boolean)).size,
      },
    });
  } catch (error) {
    logger.error({ err: error, userId: (await getServerSession(authOptions))?.user?.id }, 'Tag analytics error');
    return internalServerError('Failed to fetch tag analytics');
  }
}

// Calculate trend score based on recent usage
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

// Check if tag has suspicious recent spike
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

// Attempt to categorize tags
function categorizeTag(tag: string): string {
  const lower = tag.toLowerCase();

  if (
    [
      'javascript',
      'typescript',
      'python',
      'java',
      'cpp',
      'csharp',
      'go',
      'rust',
      'ruby',
      'php',
    ].some((lang) => lower.includes(lang))
  ) {
    return 'Programming Languages';
  }
  if (
    ['react', 'vue', 'angular', 'nextjs', 'express', 'django', 'flask', 'spring'].some((fw) =>
      lower.includes(fw)
    )
  ) {
    return 'Frameworks';
  }
  if (['api', 'rest', 'graphql', 'websocket', 'http'].some((api) => lower.includes(api))) {
    return 'API/Network';
  }
  if (
    ['database', 'sql', 'nosql', 'mongodb', 'postgresql', 'mysql'].some((db) => lower.includes(db))
  ) {
    return 'Database';
  }
  if (
    ['docker', 'kubernetes', 'aws', 'azure', 'gcp', 'devops'].some((infra) => lower.includes(infra))
  ) {
    return 'Infrastructure';
  }
  if (['test', 'testing', 'unit', 'e2e', 'mock'].some((test) => lower.includes(test))) {
    return 'Testing';
  }

  return 'Other';
}
