import { requireSuperAdmin } from '@/lib/auth/admin';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { success, forbidden, internalServerError } from '@/lib/api/responses';

export async function GET() {
  try {
    await requireSuperAdmin();

    // Get all tags with their usage counts
    const tagUsage = await prisma.jsonDocument.findMany({
      where: {
        tags: {
          isEmpty: false,
        },
      },
      select: {
        tags: true,
        createdAt: true,
        userId: true,
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });

    // Process tag statistics
    const tagCounts = new Map<string, number>();
    const recentTagCounts = new Map<string, number>();
    const historicalTagCounts = new Map<string, number>();
    const tagsByUser = new Map<
      string,
      { userId: string; userEmail: string; userName?: string; tags: Set<string> }
    >();
    const recentTags = new Set<string>();
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    let totalUsage = 0;

    tagUsage.forEach((doc) => {
      doc.tags.forEach((tag) => {
        // Count total tag usage
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        totalUsage++;

        // Track recent tags (last week)
        if (doc.createdAt > oneWeekAgo) {
          recentTags.add(tag);
          recentTagCounts.set(tag, (recentTagCounts.get(tag) || 0) + 1);
        } else {
          // Track historical usage (before last week)
          historicalTagCounts.set(tag, (historicalTagCounts.get(tag) || 0) + 1);
        }

        // Track tags by user
        if (doc.userId && doc.user) {
          const userKey = doc.userId;
          if (!tagsByUser.has(userKey)) {
            tagsByUser.set(userKey, {
              userId: doc.userId,
              userEmail: doc.user.email,
              userName: doc.user.name || undefined,
              tags: new Set(),
            });
          }
          tagsByUser.get(userKey)!.tags.add(tag);
        }
      });
    });

    // Helper function to calculate trend
    const calculateTrend = (tagName: string): 'up' | 'down' | 'stable' => {
      const recentCount = recentTagCounts.get(tagName) || 0;
      const historicalCount = historicalTagCounts.get(tagName) || 0;

      // Handle edge cases
      if (historicalCount === 0) {
        // New tag (only recent usage)
        return recentCount > 0 ? 'up' : 'stable';
      }

      // Calculate percentage change
      const percentChange = ((recentCount - historicalCount) / historicalCount) * 100;

      // Apply thresholds
      if (percentChange > 10) return 'up';
      if (percentChange < -10) return 'down';
      return 'stable';
    };

    // Convert to sorted arrays
    const popularTags = Array.from(tagCounts.entries())
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalUsage > 0 ? (count / totalUsage) * 100 : 0,
        trend: calculateTrend(name),
        recentUsage: recentTagCounts.get(name) || 0,
      }))
      .sort((a, b) => b.count - a.count);

    const tagsByUserArray = Array.from(tagsByUser.values())
      .map((user) => ({
        userId: user.userId,
        userEmail: user.userEmail,
        userName: user.userName,
        tagCount: user.tags.size,
      }))
      .sort((a, b) => b.tagCount - a.tagCount);

    const analytics = {
      totalTags: tagCounts.size,
      totalUsage,
      popularTags: popularTags.slice(0, 20),
      recentTags: Array.from(recentTags).slice(0, 10),
      tagsByUser: tagsByUserArray,
    };

    return success(analytics);
  } catch (error: unknown) {
    logger.error({ err: error }, 'Admin tag analytics API error');

    if (error instanceof Error && error.message === 'Unauthorized: Superadmin access required') {
      return forbidden('Unauthorized access');
    }

    return internalServerError('Failed to fetch tag analytics');
  }
}
