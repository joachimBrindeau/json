import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/auth/admin'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'
import { success, forbidden, internalServerError } from '@/lib/api/responses'
import { config } from '@/lib/config'

export async function GET(_request: NextRequest) {
  try {
    await requireSuperAdmin()

    // Database health check
    const dbStart = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const dbResponseTime = Date.now() - dbStart

    // Get database statistics
    const [
      userCount,
      documentCount,
      documentStats
    ] = await Promise.all([
      prisma.user.count(),
      prisma.jsonDocument.count(),
      prisma.jsonDocument.aggregate({
        _avg: { size: true },
        _sum: { size: true }
      })
    ])

    // System information
    const stats = {
      database: {
        status: 'healthy' as const,
        responseTime: dbResponseTime,
        totalTables: 5, // Estimate based on schema
        totalRecords: userCount + documentCount
      },
      redis: {
        status: 'connected' as const, // TODO: Implement Redis health check
        memoryUsed: 1024 * 1024 * 50, // 50MB - mock data
        memoryMax: 1024 * 1024 * 512, // 512MB - mock data
        hitRate: 85.3 // Mock hit rate
      },
      application: {
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        nodeVersion: process.version,
        environment: config.nodeEnv,
        memoryUsage: process.memoryUsage().heapUsed
      },
      storage: {
        documentsCount: documentCount,
        totalSize: documentStats._sum.size || 0,
        avgDocumentSize: documentStats._avg.size || 0
      }
    }

    return success(stats)

  } catch (error: unknown) {
    logger.error({ err: error }, 'Admin system stats API error')

    if (error instanceof Error && error.message === 'Unauthorized: Superadmin access required') {
      return forbidden('Unauthorized access')
    }

    return internalServerError('Failed to fetch system stats')
  }
}