import { NextRequest } from 'next/server';
import { logger } from '@/lib/logger';
import { success, internalServerError, error as errorResponse } from '@/lib/api/responses';
import { withAuth } from '@/lib/api/utils';
import { getTagAnalytics } from '@/lib/db/queries/analytics';

export const GET = withAuth(async (request, session) => {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    const result = await getTagAnalytics({ days, limit, userId: session?.user?.id });
    if (!result.success) {
      return errorResponse(result.error || 'Failed to fetch tag analytics', {
        status: (result as any).status ?? 500,
      });
    }

    return success(result.data!);
  } catch (error) {
    logger.error({ err: error, userId: session?.user?.id }, 'Tag analytics error');
    return internalServerError('Failed to fetch tag analytics');
  }
});
