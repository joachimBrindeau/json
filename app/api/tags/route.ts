import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { suggestTags } from '@/lib/tags/tag-utils';
import { tagSuggestLimiter } from '@/lib/middleware/rate-limit';
import { logger } from '@/lib/logger';
import { success, internalServerError, error as errorResponse } from '@/lib/api/responses';

export async function GET(request: NextRequest) {
  // Apply rate limiting for tag suggestions
  const identifier =
    request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous';

  if (!tagSuggestLimiter.isAllowed(identifier)) {
    return errorResponse('Too many tag requests. Please slow down.', { status: 429 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();
    const category = searchParams.get('category');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

    // Fetch all unique tags from published documents
    const documents = await prisma.jsonDocument.findMany({
      where: {
        visibility: 'public',
        ...(category && { category }),
      },
      select: {
        tags: true,
      },
    });

    // Extract and count unique tags
    const tagCounts = new Map<string, number>();

    documents.forEach((doc) => {
      doc.tags.forEach((tag) => {
        const count = tagCounts.get(tag) || 0;
        tagCounts.set(tag, count + 1);
      });
    });

    // Convert to array and sort by count
    let allTags = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag);

    // If there's a query, filter and suggest tags
    if (query && query.length >= 2) {
      allTags = suggestTags(query, allTags, limit);
    } else {
      // Return most popular tags
      allTags = allTags.slice(0, limit);
    }

    // Get tag statistics
    const tagStats = allTags.map((tag) => ({
      tag,
      count: tagCounts.get(tag) || 0,
    }));

    return success({
      tags: tagStats,
      total: tagCounts.size,
    });
  } catch (error) {
    logger.error({ err: error, query: request.url }, 'Tags API error');
    return internalServerError('Failed to fetch tags');
  }
}
