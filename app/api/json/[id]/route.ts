import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

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
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({ document });
  } catch (error) {
    console.error('Document fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch document' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    // SECURITY: Verify user is authenticated
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

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
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // SECURITY: Only allow document owner to delete
    if (existingDocument.userId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied - not document owner' }, { status: 403 });
    }

    // Delete the document
    await prisma.jsonDocument.delete({
      where: {
        id: existingDocument.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    console.error('Document deletion error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('User session:', session?.user?.id);
    console.error('Document ID:', id);

    if ((error as { code?: string })?.code === 'P2025') {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json(
      {
        error: 'Failed to delete document',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : null) : undefined,
      },
      { status: 500 }
    );
  }
}