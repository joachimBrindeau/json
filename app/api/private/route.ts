import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { handleApiError, validatePaginationParams, validateSortParam, validateSearchParam, formatDocumentListResponse } from '@/lib/api/utils';
import { getUserDocuments, createJsonDocument } from '@/lib/db/queries/documents';

const CATEGORIES = [
  'API Response',
  'Configuration',
  'Database Schema',
  'Test Data',
  'Template',
  'Example',
] as const;

const SORT_OPTIONS = ['recent', 'updated', 'views'] as const;

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    // Validate parameters
    const pagination = validatePaginationParams(searchParams);
    const sort = validateSortParam(
      searchParams.get('sort') || 'recent',
      SORT_OPTIONS
    );
    const search = validateSearchParam(searchParams.get('search'));
    const category = searchParams.get('category');
    const visibility = searchParams.get('visibility');

    // Validate category
    if (category && !CATEGORIES.includes(category as typeof CATEGORIES[number])) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${CATEGORIES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate visibility
    if (visibility && !['private', 'public'].includes(visibility)) {
      return NextResponse.json(
        { error: 'Invalid visibility. Must be either "private" or "public"' },
        { status: 400 }
      );
    }

    // Map sort parameter to database field
    const sortBy = sort === 'recent' ? 'created' : 
                  sort === 'updated' ? 'updated' :
                  sort === 'views' ? 'views' : 'created';

    // Get user documents
    const result = await getUserDocuments(session.user.id, {
      page: pagination.page,
      limit: pagination.limit,
      search: search || undefined,
      category: category || undefined,
      visibility: visibility as 'private' | 'public' || undefined,
      sortBy,
      sortOrder: 'desc',
      includeContent: false, // Don't include full content for list view
      includeAnalytics: true
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.status || 400 });
    }

    return NextResponse.json({
      documents: formatDocumentListResponse(result.data?.documents || [], false), // false = private library
      pagination: result.data?.pagination,
    });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return handleApiError(error, 'Private library API');
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

    // Create the document
    const result = await createJsonDocument({
      userId: session.user.id,
      title: data.title.trim(),
      description: data.description?.trim() || '',
      content: data.content || '{}', // Default empty JSON if no content provided
      category: data.category || undefined,
      tags: data.tags || [],
      richContent: data.richContent || '',
      visibility: data.visibility || 'private',
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
    return handleApiError(error, 'Private library POST API');
  }
}