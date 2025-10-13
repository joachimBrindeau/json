import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/auth/admin'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'
import { success, forbidden, internalServerError } from '@/lib/api/responses'

export async function GET(_request: NextRequest) {
  try {
    await requireSuperAdmin()

    // Get all tags with their usage counts
    const tagUsage = await prisma.jsonDocument.findMany({
      where: {
        tags: {
          isEmpty: false
        }
      },
      select: {
        tags: true,
        createdAt: true,
        userId: true,
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    })

    // Process tag statistics
    const tagCounts = new Map<string, number>()
    const tagsByUser = new Map<string, { userId: string, userEmail: string, userName?: string, tags: Set<string> }>()
    const recentTags = new Set<string>()
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    let totalUsage = 0

    tagUsage.forEach(doc => {
      doc.tags.forEach(tag => {
        // Count total tag usage
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
        totalUsage++

        // Track recent tags (last week)
        if (doc.createdAt > oneWeekAgo) {
          recentTags.add(tag)
        }

        // Track tags by user
        if (doc.userId && doc.user) {
          const userKey = doc.userId
          if (!tagsByUser.has(userKey)) {
            tagsByUser.set(userKey, {
              userId: doc.userId,
              userEmail: doc.user.email,
              userName: doc.user.name || undefined,
              tags: new Set()
            })
          }
          tagsByUser.get(userKey)!.tags.add(tag)
        }
      })
    })

    // Convert to sorted arrays
    const popularTags = Array.from(tagCounts.entries())
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalUsage > 0 ? (count / totalUsage) * 100 : 0,
        trend: 'stable' as const, // TODO: Implement trend calculation
        recentUsage: 0 // TODO: Calculate recent usage
      }))
      .sort((a, b) => b.count - a.count)

    const tagsByUserArray = Array.from(tagsByUser.values())
      .map(user => ({
        userId: user.userId,
        userEmail: user.userEmail,
        userName: user.userName,
        tagCount: user.tags.size
      }))
      .sort((a, b) => b.tagCount - a.tagCount)

    const analytics = {
      totalTags: tagCounts.size,
      totalUsage,
      popularTags: popularTags.slice(0, 20),
      recentTags: Array.from(recentTags).slice(0, 10),
      tagsByUser: tagsByUserArray
    }

    return success(analytics)

  } catch (error: unknown) {
    logger.error({ err: error }, 'Admin tag analytics API error')

    if (error instanceof Error && error.message === 'Unauthorized: Superadmin access required') {
      return forbidden('Unauthorized access')
    }

    return internalServerError('Failed to fetch tag analytics')
  }
}