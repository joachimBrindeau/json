import { NextRequest, NextResponse } from 'next/server';
import { handleApiError, withAuth, validateAndAnalyzeJson, formatDocumentResponse } from '@/lib/api/utils';
import { getDocumentById, updateDocument } from '@/lib/db/queries/documents';

export const runtime = 'nodejs';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Get session for authorization (but don't require auth for this endpoint)
    const { getServerSession } = await import('next-auth');
    const { authOptions } = await import('@/lib/auth');
    const session = await getServerSession(authOptions);

    const result = await getDocumentById(id, session?.user?.id, { includeContent: true });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.status || 404 });
    }

    return NextResponse.json(formatDocumentResponse(result.data));
  } catch (error) {
    return handleApiError(error, 'Content retrieval');
  }
}

export const PUT = withAuth(async (request, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const { content } = await request.json();

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Validate and analyze JSON
    const { parsedContent, stats } = validateAndAnalyzeJson(content);

    // Update the document with validation
    const result = await updateDocument(id, request.user.id, {
      content: parsedContent,
      metadata: {
        size: BigInt(stats.size),
        nodeCount: stats.nodeCount,
        maxDepth: stats.maxDepth,
        complexity: stats.complexity
      }
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.status || 400 });
    }

    return NextResponse.json({
      success: true,
      document: result.data,
    });
  } catch (error) {
    return handleApiError(error, 'Content update');
  }
});
