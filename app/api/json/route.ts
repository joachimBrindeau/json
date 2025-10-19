import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { prisma } from '@/lib/db';
import {
  analyzeJsonStream,
  chunkJsonData,
  createPerformanceMonitor,
  JsonCache,
} from '@/lib/json';
import { logger } from '@/lib/logger';
import { success, created, badRequest, error, internalServerError } from '@/lib/api/responses';
import { config } from '@/lib/config';
import { withAuth } from '@/lib/api/utils';

export const runtime = 'nodejs';
export const maxDuration = 60;

export const POST = withAuth(async (request, session) => {
  const monitor = createPerformanceMonitor();

  try {
    const userId = session?.user?.id || null;
    
    // Parse JSON body
    const body = await request.json();
    const { title, content } = body;

    if (!content) {
      return badRequest('No content provided');
    }

    // Validate JSON content
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
      return error(`JSON size exceeds ${config.performance.maxJsonSizeMB}MB limit`, { status: 413 });
    }

    // Generate content hash for deduplication
    const checksum = createHash('sha256').update(jsonString).digest('hex');

    // Check for existing document with same hash
    const existingDoc = await prisma.jsonDocument.findFirst({
      where: { checksum },
      select: { shareId: true, visibility: true, userId: true }
    });

    if (existingDoc) {
      // If document exists and is public, or belongs to the same user, return it
      if (existingDoc.visibility === 'public' || existingDoc.userId === userId) {
        return success({
          shareId: existingDoc.shareId,
          isExisting: true
        }, { message: 'Document already exists' });
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
        title: title || 'Untitled JSON',
        content: parsedContent,
        checksum,
        size: BigInt(jsonString.length),
        visibility: 'private', // Default to private
        userId,
        metadata: {
          analysis,
          chunks: chunks.length,
          createdAt: new Date().toISOString(),
          userAgent: request.headers.get('user-agent') || 'unknown',
          source: 'api'
        }
      }
    });

    // Skip chunk storage for now

    // Cache for quick access
    await JsonCache.set(shareId, {
      content: jsonString,
      metadata: document.metadata as any,
      title: document.title
    });

    monitor.end('json_create_success');

    return created({
      shareId: document.shareId,
      title: document.title,
      size: Number(document.size),
      analysis
    }, { message: 'JSON document created successfully' });

  } catch (error) {
    monitor.end('json_create_error');
    logger.error({ err: error }, 'JSON creation error');

    return internalServerError('Failed to create JSON document');
  }
});
