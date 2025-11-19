import { NextRequest } from 'next/server';
import {
  handleApiError,
  withAuth,
  validateAndAnalyzeJson,
  formatDocumentResponse,
} from '@/lib/api/utils';
import { getDocumentById, updateDocument } from '@/lib/db/queries/documents';
import { success, badRequest, error as errorResponse } from '@/lib/api/responses';

export const runtime = 'nodejs';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Get session for authorization (but don't require auth for this endpoint)
    const { getServerSession } = await import('next-auth');
    const { authOptions } = await import('@/lib/auth');
    const session = await getServerSession(authOptions);

    const result = await getDocumentById(id, session?.user?.id, { includeContent: true });

    if (!result.success) {
      return errorResponse((result as any).error || 'Document not found', {
        status: (result as any).status || 404,
      });
    }

    return success(formatDocumentResponse(result.data));
  } catch (error) {
    return handleApiError(error, 'Content retrieval');
  }
}

export const PUT = withAuth(
  async (request, session, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params;
      const { content } = await request.json();

      if (!content) {
        return badRequest('Content is required');
      }

      // Validate and analyze JSON
      const { parsedContent, stats } = validateAndAnalyzeJson(content);

      // Update the document with validation
      const result = await updateDocument(id, session.user.id, {
        content: parsedContent,
        metadata: {
          size: BigInt(stats.size),
          nodeCount: stats.nodeCount,
          maxDepth: stats.maxDepth,
          complexity: stats.complexity,
        },
      });

      if (!result.success) {
        return errorResponse(result.error || 'Update failed', { status: result.status || 400 });
      }

      return success({
        document: result.data,
      });
    } catch (error) {
      return handleApiError(error, 'Content update');
    }
  }
);
