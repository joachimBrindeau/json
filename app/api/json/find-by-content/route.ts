import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { success, badRequest, internalServerError } from '@/lib/api/responses';
import { withAuth } from '@/lib/api/utils';
import { tagSuggestLimiter } from '@/lib/middleware/rate-limit';
import { RateLimitError } from '@/lib/utils/app-errors';

export const runtime = 'nodejs';

export const POST = withAuth(async (request, session) => {
  // Rate limit: identify by userId if present, else IP
  const rateKey =
    session?.user?.id ||
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'anonymous';
  if (!tagSuggestLimiter.isAllowed(rateKey)) {
    const reset = tagSuggestLimiter.getResetTime(rateKey);
    throw new RateLimitError(
      reset ? Math.ceil((reset.getTime() - Date.now()) / 1000) : undefined,
      'Too many content-lookup requests. Please slow down.',
      {
        resetTime: reset?.toISOString(),
        remaining: tagSuggestLimiter.getRemainingAttempts(rateKey),
      }
    );
  }

  let contentHash: string | undefined;
  let content: string | undefined;

  try {
    ({ contentHash, content } = await request.json());

    if (!contentHash || !content) {
      return badRequest('Content hash and content are required');
    }

    // Parse the content to compare actual JSON structure
    let parsedContent;
    try {
      parsedContent = JSON.parse(content);
    } catch {
      return badRequest('Invalid JSON content');
    }

    // Find documents that belong to the current user (if authenticated) or anonymous (when unauthenticated)
    // Note: userId must be matched against session.user.id, not email
    const whereCondition = session?.user?.id ? { userId: session.user.id } : { isAnonymous: true };

    // First try checksum match (fast path)
    const byHash = await prisma.jsonDocument.findFirst({
      where: {
        ...whereCondition,
        checksum: contentHash,
      },
      select: {
        id: true,
        shareId: true,
        title: true,
        content: true,
        size: true,
        nodeCount: true,
        maxDepth: true,
        complexity: true,
        createdAt: true,
        userId: true,
        isAnonymous: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (byHash) {
      return success({ document: byHash });
    }

    // Fallback: JSON structural equality
    const byContent = await prisma.jsonDocument.findFirst({
      where: {
        ...whereCondition,
        content: parsedContent as any,
      },
      select: {
        id: true,
        shareId: true,
        title: true,
        content: true,
        size: true,
        nodeCount: true,
        maxDepth: true,
        complexity: true,
        createdAt: true,
        userId: true,
        isAnonymous: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return success({
      document: byContent ?? null,
    });
  } catch (error) {
    logger.error(
      { err: error, userId: session?.user?.email, contentHash },
      'Find by content error'
    );
    return internalServerError('Failed to search for existing content', {
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});
