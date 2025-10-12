import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { validateTags } from '@/lib/tags/tag-utils';
import { publishLimiter } from '@/lib/middleware/rate-limit';

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

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  // Apply rate limiting
  const rateLimitKey = session.user.id;
  if (!publishLimiter.isAllowed(rateLimitKey)) {
    const resetTime = publishLimiter.getResetTime(rateLimitKey);
    return NextResponse.json(
      {
        error: 'Publishing limit reached. Please wait before publishing more documents.',
        resetTime: resetTime?.toISOString(),
        remaining: publishLimiter.getRemainingAttempts(rateLimitKey),
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Remaining': publishLimiter.getRemainingAttempts(rateLimitKey).toString(),
        },
      }
    );
  }

  try {
    const { id } = await params;
    const data = publishSchema.parse(await request.json());

    // Validate and normalize tags
    const { validTags, invalidTags } = validateTags(data.tags);

    if (invalidTags.length > 0) {
      return NextResponse.json(
        {
          error: 'Invalid tags',
          details: invalidTags,
        },
        { status: 400 }
      );
    }

    // Remove duplicates after normalization
    const uniqueTags = Array.from(new Set(validTags));

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

    return NextResponse.json({ success: true, document });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json(
      {
        error:
          error instanceof Error && error.message.includes('Record to update not found')
            ? 'Document not found or already published'
            : 'Failed to publish',
      },
      { status: 404 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const { id } = await params;

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

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Document not found or not published' }, { status: 404 });
  }
}
