import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { success, unauthorized, badRequest, internalServerError } from '@/lib/api/responses';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return unauthorized('Authentication required');
    }

    const { anonymousJsonIds } = await request.json();

    if (!Array.isArray(anonymousJsonIds) || anonymousJsonIds.length === 0) {
      return badRequest('Invalid or empty anonymousJsonIds array');
    }

    // Validate that anonymousJsonIds are strings and reasonably formatted
    const validIds = anonymousJsonIds.filter(
      (id) => typeof id === 'string' && id.length > 0 && id.length < 100
    );

    if (validIds.length === 0) {
      return badRequest('No valid JSON IDs provided');
    }

    // For anonymous IDs that start with "anon-", we can't migrate them directly
    // since they were never saved to the database. This endpoint is for
    // potential future functionality where we might track anonymous documents
    // differently.

    // For now, we'll just acknowledge the request and clear the client state
    const migratedCount = validIds.length;

    return success({
      message: `Acknowledged ${migratedCount} anonymous JSON documents`,
      migratedCount,
    });
  } catch (error) {
    logger.error(
      {
        err: error,
        userId: session?.user?.id
      },
      'Anonymous migration error'
    );

    return internalServerError('Failed to migrate anonymous data', {
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
