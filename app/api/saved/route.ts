import {
  withAuth,
  handleApiError,
  validatePaginationParams,
  validateSortParam,
  validateSearchParam,
  formatDocumentListResponse,
} from '@/lib/api/utils';
import { getUserDocuments } from '@/lib/db/queries/documents';
import { success, badRequest, error as errorResponse } from '@/lib/api/responses';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

export const GET = withAuth(async (request, session) => {
  try {
    const { searchParams } = new URL(request.url);

    // Validate parameters
    const pagination = validatePaginationParams(searchParams);
    pagination.limit = searchParams.get('limit') ? pagination.limit : 50; // Higher default for private library

    const sortResult = validateSortParam(searchParams.get('sort') || 'recent', [
      'recent',
      'title',
      'size',
      'updated',
    ]);

    // Check if sort validation failed
    if (typeof sortResult === 'object' && 'error' in sortResult) {
      return errorResponse(sortResult.error, { status: sortResult.status });
    }

    const sort = sortResult as string;
    const search = validateSearchParam(searchParams.get('search'));

    // Get user documents
    const result = await getUserDocuments(session.user.id, {
      page: pagination.page,
      limit: pagination.limit,
      search: search || undefined,
      sortBy: sort,
      sortOrder: 'desc',
    });

    if (!result.success) {
      return errorResponse(result.error || 'Failed to fetch documents', {
        status: result.status || 400,
      });
    }

    const docs = formatDocumentListResponse(result.data?.documents || [], false);
    logger.info(
      {
        route: '/api/saved',
        userId: session.user.id,
        page: pagination.page,
        limit: pagination.limit,
        sort,
        search: search || undefined,
        count: docs.length,
      },
      'Private library fetched'
    );

    return success({
      documents: docs,
      pagination: result.data?.pagination,
    });
  } catch (error) {
    if (error instanceof Error) {
      return badRequest(error.message);
    }
    return handleApiError(error, 'Private library API');
  }
});
