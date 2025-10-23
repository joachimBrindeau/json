import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth/admin';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { success, forbidden, internalServerError } from '@/lib/api/responses';

export async function GET(_request: NextRequest) {
  try {
    await requireSuperAdmin();

    // Get users with their document count
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        lastLoginAt: true,
        _count: {
          select: {
            documents: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform the data to include calculated fields
    const enrichedUsers = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      createdAt: user.createdAt.toISOString(),
      lastLogin: user.lastLoginAt?.toISOString() ?? null,
      documentsCount: user._count.documents,
      isActive: user._count.documents > 0, // Consider users with documents as active
    }));

    return success({
      users: enrichedUsers,
      total: users.length,
    });
  } catch (error: unknown) {
    logger.error({ err: error }, 'Admin users API error');

    if (error instanceof Error && error.message === 'Unauthorized: Superadmin access required') {
      return forbidden('Unauthorized access');
    }

    return internalServerError('Failed to fetch users');
  }
}
