import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { validateTags } from '@/lib/tags/tag-utils';
import { publishLimiter } from '@/lib/middleware/rate-limit';
import { success } from '@/lib/api/responses';
import { withValidationHandler, withDatabaseHandler } from '@/lib/api/middleware';
import { AuthenticationError, ValidationError, RateLimitError } from '@/lib/utils/app-errors';

const publishSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: z.string().trim().max(300).optional(),
  richContent: z.string().trim().optional(),
  tags: z.array(z.string().trim()).max(10).default([]),
  category: z.string().trim().max(50).optional(),
});

const createSlug = (title: string, shareId: string): string =>
  `${title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')}-${shareId.slice(0, 8)}`;

/**
 * POST publish document to public library
 * Now using withValidationHandler for automatic Zod error handling
 */
export const POST = withValidationHandler(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new AuthenticationError('Authentication required');
  }

  // Apply rate limiting
  const rateLimitKey = session.user.id;
  if (!publishLimiter.isAllowed(rateLimitKey)) {
    const resetTime = publishLimiter.getResetTime(rateLimitKey);
    throw new RateLimitError(
      resetTime ? Math.ceil((resetTime.getTime() - Date.now()) / 1000) : undefined,
      'Publishing limit reached. Please wait before publishing more documents.',
      {
        resetTime: resetTime?.toISOString(),
        remaining: publishLimiter.getRemainingAttempts(rateLimitKey),
      }
    );
  }

  const { id } = await params;
  // Zod validation errors automatically handled by middleware
  const data = publishSchema.parse(await request.json());

  // Validate and normalize tags
  const { validTags, invalidTags } = validateTags(data.tags);

  if (invalidTags.length > 0) {
    throw new ValidationError('Invalid tags', [
      { field: 'tags', message: `Invalid tags: ${invalidTags.join(', ')}` },
    ]);
  }

  // Remove duplicates after normalization
  const uniqueTags = Array.from(new Set(validTags));

  // Prisma errors automatically handled by middleware
  const document = await prisma.jsonDocument.update({
    where: {
      shareId: id,
      userId: session.user.id,
      visibility: 'private', // Only allow publishing private documents
    },
    data: {
      visibility: 'public',
      publishedAt: new Date(),
      title: data.title,
      description: data.description,
      richContent: data.richContent,
      tags: uniqueTags, // Store normalized, unique tags
      category: data.category,
      slug: createSlug(data.title, id),
    },
    select: { shareId: true, title: true, slug: true, publishedAt: true, tags: true },
  });

  return success({ document });
});

/**
 * DELETE unpublish document from public library
 * Now using withDatabaseHandler for automatic Prisma error handling
 */
export const DELETE = withDatabaseHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new AuthenticationError('Authentication required');
  }

  const { id } = await params;

  // Prisma errors automatically handled by middleware
  await prisma.jsonDocument.update({
    where: {
      shareId: id,
      userId: session.user.id,
      visibility: 'public', // Only allow unpublishing public documents
    },
    data: {
      visibility: 'private',
      publishedAt: null,
      slug: null,
    },
  });

  return success({});
});
