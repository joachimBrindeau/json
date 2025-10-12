import { NextResponse } from 'next/server';
import { withAuth, handleApiError, validatePaginationParams, validateSortParam, validateSearchParam, formatDocumentListResponse } from '@/lib/api/utils';
import { getUserDocuments } from '@/lib/db/queries/documents';

export const runtime = 'nodejs';

export const GET = withAuth(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    
    // Validate parameters
    const pagination = validatePaginationParams(searchParams);
    pagination.limit = searchParams.get('limit') ? pagination.limit : 50; // Higher default for private library
    
    const sort = validateSortParam(
      searchParams.get('sort') || 'recent',
      ['recent', 'title', 'size', 'updated']
    );
    
    const search = validateSearchParam(searchParams.get('search'));

    // Get user documents
    const result = await getUserDocuments(request.user.id, {
      page: pagination.page,
      limit: pagination.limit,
      search: search || undefined,
      sortBy: sort,
      sortOrder: 'desc'
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.status || 400 });
    }

    return NextResponse.json({
      documents: formatDocumentListResponse(result.data?.documents || [], false),
      pagination: result.data?.pagination,
    });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return handleApiError(error, 'Private library API');
  }
});