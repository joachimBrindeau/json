import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { suggestTags } from '@/lib/tags/tag-utils';
import { tagSuggestLimiter } from '@/lib/middleware/rate-limit';
import { logger } from '@/lib/logger';
import { success, internalServerError, error as errorResponse } from '@/lib/api/responses';

// Simple in-memory cache for popular tags by category
const TAGS_CACHE = new Map<
  string,
  { data: Array<{ tag: string; count: number }>; timestamp: number }
>();
const TAGS_CACHE_TTL = 60_000; // 60s

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

    // Cache key per category (or 'all') for popular tags baseline
    const cacheKey = `popular:${category || 'all'}`;
    const now = Date.now();
    let baseline: Array<{ tag: string; count: number }> | undefined;

    // Check cache
    const cached = TAGS_CACHE.get(cacheKey);
    if (cached && now - cached.timestamp < TAGS_CACHE_TTL) {
      baseline = cached.data;
    } else {
      // DB-side aggregation: unnest tags and count
      // Limit the baseline set to keep memory and CPU predictable
      const maxBaseline = 500; // upper bound of baseline rows to keep

      const rows: Array<{ tag: string; count: bigint }> = category
        ? await prisma.$queryRaw`select tag, count(*)::bigint as count
                                  from json_documents jd, unnest(jd.tags) as tag
                                  where jd.visibility = 'public' and jd.category = ${category}
                                  group by tag
                                  order by count(*) desc
                                  limit ${maxBaseline}`
        : await prisma.$queryRaw`select tag, count(*)::bigint as count
                                  from json_documents jd, unnest(jd.tags) as tag
                                  where jd.visibility = 'public'
                                  group by tag
                                  order by count(*) desc
                                  limit ${maxBaseline}`;

      baseline = rows.map((r) => ({ tag: r.tag, count: Number(r.count) }));
      TAGS_CACHE.set(cacheKey, { data: baseline, timestamp: now });
    }

    // From baseline, build final list depending on query
    const popularTags = baseline;
    const allTagNames = popularTags.map((r) => r.tag);

    let selected: string[];
    if (query && query.length >= 2) {
      selected = suggestTags(query, allTagNames, limit);
    } else {
      selected = allTagNames.slice(0, limit);
    }

    const tagIndex = new Map(popularTags.map((r) => [r.tag, r.count] as const));
    const tagStats = selected.map((tag) => ({ tag, count: tagIndex.get(tag) || 0 }));

    return success({
      tags: tagStats,
      total: popularTags.length,
    });
  } catch (error) {
    logger.error({ err: error, query: request.url }, 'Tags API error');
    return internalServerError('Failed to fetch tags');
  }
}
