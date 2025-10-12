import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { title } = await request.json();

    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        { error: 'Title is required and must be a string' },
        { status: 400 }
      );
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
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Update the document title using the found document's actual id
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

    return NextResponse.json({
      success: true,
      document: updatedDocument,
    });
  } catch (error) {
    console.error('Title update error:', error);

    if ((error as { code?: string })?.code === 'P2025') {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json(
      {
        error: 'Failed to update title',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
