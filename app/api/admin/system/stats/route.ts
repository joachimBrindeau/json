import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/auth/admin'
import { prisma } from '@/lib/db'

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
        environment: process.env.NODE_ENV || 'development',
        memoryUsage: process.memoryUsage().heapUsed
      },
      storage: {
        documentsCount: documentCount,
        totalSize: documentStats._sum.size || 0,
        avgDocumentSize: documentStats._avg.size || 0
      }
    }

    return NextResponse.json(stats)

  } catch (error: unknown) {
    console.error('Admin system stats API error:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized: Superadmin access required') {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch system stats' },
      { status: 500 }
    )
  }
}