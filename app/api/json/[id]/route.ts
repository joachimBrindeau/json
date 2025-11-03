import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { success } from '@/lib/api/responses';
import { withDatabaseHandler } from '@/lib/api/middleware';
import { withAuth } from '@/lib/api/utils';
import { NotFoundError, AuthorizationError } from '@/lib/utils/app-errors';

export const runtime = 'nodejs';

/**
 * GET document metadata for authenticated user
 * Now using withDatabaseHandler for automatic error handling and Prisma error mapping
 */
export const GET = withAuth(
  async (request, session, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;

    const document = await prisma.jsonDocument.findFirst({
      where: {
        shareId: id,
        userId: session.user.id,
      },
      select: {
        shareId: true,
        title: true,
        description: true,
        richContent: true,
        category: true,
        tags: true,
        visibility: true,
        publishedAt: true,
      },
    });

    if (!document) {
      throw new NotFoundError('Document', id);
    }

    return success({ document });
  }
);

/**
 * DELETE document with ownership verification
 * Now using withDatabaseHandler for automatic error handling and Prisma error mapping
 */
export const DELETE = withAuth(
  async (request, session, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;

    // SECURITY: Verify document exists and user owns it before deleting
    const existingDocument = await prisma.jsonDocument.findFirst({
      where: {
        OR: [{ id }, { shareId: id }],
      },
      select: {
        id: true,
        shareId: true,
        title: true,
        userId: true,
      },
    });

    if (!existingDocument) {
      throw new NotFoundError('Document', id);
    }

    // SECURITY: Only allow document owner to delete
    if (existingDocument.userId !== session.user.id) {
      throw new AuthorizationError('Access denied - not document owner');
    }

    // Delete the document - Prisma P2025 errors automatically handled by middleware
    await prisma.jsonDocument.delete({
      where: {
        id: existingDocument.id,
      },
    });

    return success({}, { message: 'Document deleted successfully' });
  }
);
