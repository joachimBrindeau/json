import { createHash } from 'crypto';
import { prisma } from '@/lib/db';
import { analyzeJsonStream, chunkJsonData, createPerformanceMonitor, JsonCache } from '@/lib/json';
import { logger } from '@/lib/logger';
import { success, created, badRequest, error, internalServerError } from '@/lib/api/responses';
import { config } from '@/lib/config';
import { sanitizeString, withAuth } from '@/lib/api/utils';
import { publishLimiter } from '@/lib/middleware/rate-limit';
import { RateLimitError, ValidationError } from '@/lib/utils/app-errors';
import { z } from 'zod';

export const runtime = 'nodejs';

const createJsonSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200).optional(),
  content: z.union([z.string(), z.record(z.string(), z.any()), z.array(z.any())]),
});

export const maxDuration = 60;

export const POST = withAuth(async (request, session) => {
  const monitor = createPerformanceMonitor();

  try {
    const userId = session?.user?.id || null;

    // Parse and validate body
    const raw = await request.json();
    const parsedBody = createJsonSchema.safeParse(raw);
    if (!parsedBody.success) {
      return badRequest(parsedBody.error.issues[0]?.message || 'Invalid request payload');
    }
    const { title, content } = parsedBody.data;

    // Validate content presence
    if (
      content === undefined ||
      content === null ||
      (typeof content === 'string' && content.trim() === '')
    ) {
      return badRequest('No content provided');
    }

    // Sanitize title if provided
    const safeTitle = title ? sanitizeString(title).slice(0, 200) : undefined;

    // Validate JSON content
    // Rate limit JSON create via API: prefer user-based key, fallback to IP
    const rateKey =
      (session?.user?.id as string | undefined) ||
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'anonymous';
    if (!publishLimiter.isAllowed(rateKey)) {
      const reset = publishLimiter.getResetTime(rateKey);
      throw new RateLimitError(
        reset ? Math.ceil((reset.getTime() - Date.now()) / 1000) : undefined,
        'Creation rate limit reached. Please try again later.',
        {
          resetTime: reset?.toISOString(),
          remaining: publishLimiter.getRemainingAttempts(rateKey),
        }
      );
    }

    let parsedContent: unknown;
    try {
      parsedContent = typeof content === 'string' ? JSON.parse(content) : content;
    } catch {
      return badRequest('Invalid JSON format');
    }

    // Convert back to string for storage
    const jsonString = JSON.stringify(parsedContent, null, 2);

    // Check size limit using centralized config
    if (jsonString.length > config.performance.maxJsonSizeBytes) {
      return error(`JSON size exceeds ${config.performance.maxJsonSizeMB}MB limit`, {
        status: 413,
      });
    }

    // Generate content hash for deduplication
    const checksum = createHash('sha256').update(jsonString).digest('hex');

    // Check for existing document with same hash
    const existingDoc = await prisma.jsonDocument.findFirst({
      where: { checksum },
      select: { shareId: true, visibility: true, userId: true },
    });

    if (existingDoc) {
      // If document exists and is public, or belongs to the same user, return it
      if (existingDoc.visibility === 'public' || existingDoc.userId === userId) {
        return success(
          {
            shareId: existingDoc.shareId,
            isExisting: true,
          },
          { message: 'Document already exists' }
        );
      }
    }

    // Analyze JSON structure
    const analysis = await analyzeJsonStream(jsonString);

    // Generate unique share ID
    const shareId = createHash('sha256')
      .update(`${Date.now()}-${Math.random()}-${checksum}`)
      .digest('hex')
      .substring(0, 24);

    // Skip chunking for now to simplify
    const chunks: any[] = [];

    // Create document record
    const document = await prisma.jsonDocument.create({
      data: {
        shareId,
        title: safeTitle || 'Untitled JSON',
        content: parsedContent as any,
        checksum,
        size: BigInt(jsonString.length),
        visibility: 'private', // Default to private
        userId,
        metadata: {
          analysis,
          chunks: chunks.length,
          createdAt: new Date().toISOString(),
          userAgent: request.headers.get('user-agent') || 'unknown',
          source: 'api',
        } as any,
      },
    });

    // Skip chunk storage for now

    // Cache for quick access
    await JsonCache.set(shareId, {
      content: jsonString,
      metadata: document.metadata as any,
      title: document.title,
    });

    monitor.end();

    return created(
      {
        shareId: document.shareId,
        title: document.title,
        size: Number(document.size),
        analysis,
      },
      { message: 'JSON document created successfully' }
    );
  } catch (error) {
    monitor.end();
    logger.error({ err: error }, 'JSON creation error');

    return internalServerError('Failed to create JSON document');
  }
});
