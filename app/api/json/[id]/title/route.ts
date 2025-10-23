import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { success } from '@/lib/api/responses';
import { withDatabaseHandler } from '@/lib/api/middleware';
import { ValidationError, NotFoundError } from '@/lib/utils/app-errors';

export const runtime = 'nodejs';

/**
 * PUT update document title
 * Now using withDatabaseHandler for automatic error handling and Prisma error mapping
 */
export const PUT = withDatabaseHandler(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const { title } = await request.json();

    if (!title || typeof title !== 'string') {
      throw new ValidationError('Title is required and must be a string', [
        { field: 'title', message: 'Title is required and must be a string' },
      ]);
    }

    // First find the document by id or shareId
    const existingDocument = await prisma.jsonDocument.findFirst({
      where: {
        OR: [{ id }, { shareId: id }],
      },
      select: {
        id: true,
        shareId: true,
      },
    });

    if (!existingDocument) {
      throw new NotFoundError('Document', id);
    }

    // Update the document title using the found document's actual id
    // Prisma P2025 errors automatically handled by middleware
    const updatedDocument = await prisma.jsonDocument.update({
      where: {
        id: existingDocument.id,
      },
      data: {
        title: title.trim(),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        shareId: true,
        title: true,
        updatedAt: true,
      },
    });

    return success({
      document: updatedDocument,
    });
  }
);
