import { NextRequest, NextResponse } from 'next/server';
import { handleApiError, validatePaginationParams, validateSortParam, validateSearchParam, formatDocumentListResponse } from '@/lib/api/utils';
import { getPublicDocuments, createJsonDocument } from '@/lib/db/queries/documents';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const CATEGORIES = [
  'API Response',
  'Configuration',
  'Database Schema',
  'Test Data',
  'Template',
  'Example',
] as const;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Validate parameters
    const pagination = validatePaginationParams(searchParams);
    const sort = validateSortParam(
      searchParams.get('sort') || 'recent',
      ['recent', 'popular', 'views', 'size', 'title']
    );
    const search = validateSearchParam(searchParams.get('search'));
    const category = searchParams.get('category');
    const dateRange = searchParams.get('dateRange');
    const complexity = searchParams.get('complexity');
    const minSize = searchParams.get('minSize');
    const maxSize = searchParams.get('maxSize');

    // Validate category
    if (category && !CATEGORIES.includes(category as typeof CATEGORIES[number])) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${CATEGORIES.join(', ')}` },
        { status: 400 }
      );
    }

    // Get public documents
    const result = await getPublicDocuments({
      page: pagination.page,
      limit: pagination.limit,
      search: search || undefined,
      category: category || undefined,
      dateRange: dateRange || undefined,
      complexity: complexity || undefined,
      minSize: minSize || undefined,
      maxSize: maxSize || undefined,
      sortBy: sort,
      sortOrder: 'desc'
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.status || 400 });
    }

    return NextResponse.json({
      documents: formatDocumentListResponse(result.data?.documents || [], true),
      pagination: result.data?.pagination,
    });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return handleApiError(error, 'Public library API');
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    
    // Validate required fields
    if (!data.title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Validate category if provided
    if (data.category && !CATEGORIES.includes(data.category as typeof CATEGORIES[number])) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${CATEGORIES.join(', ')}` },
        { status: 400 }
      );
    }

    // Create the document with public visibility
    const result = await createJsonDocument({
      userId: session.user.id,
      title: data.title.trim(),
      description: data.description?.trim() || '',
      content: data.content || '{}', // Default empty JSON if no content provided
      category: data.category || undefined,
      tags: data.tags || [],
      richContent: data.richContent || '',
      visibility: 'public', // Force public visibility for public library
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.status || 400 });
    }

    return NextResponse.json({
      success: true,
      document: result.data,
    }, { status: 201 });

  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return handleApiError(error, 'Public library POST API');
  }
}
