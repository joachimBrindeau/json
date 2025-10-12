import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/auth/admin'
import { prisma } from '@/lib/db'

export async function GET(_request: NextRequest) {
  try {
    await requireSuperAdmin()

    // Get users with their document count
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        // Add last login when we implement session tracking
        _count: {
          select: {
            documents: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform the data to include calculated fields
    const enrichedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      createdAt: user.createdAt.toISOString(),
      lastLogin: null, // TODO: Implement session tracking for last login
      documentsCount: user._count.documents,
      isActive: user._count.documents > 0 // Consider users with documents as active
    }))

    return NextResponse.json({
      users: enrichedUsers,
      total: users.length
    })

  } catch (error: unknown) {
    console.error('Admin users API error:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized: Superadmin access required') {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}