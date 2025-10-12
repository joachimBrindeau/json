import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  analyzeJsonStream,
  chunkJsonData,
  createPerformanceMonitor,
  JsonCache,
} from '@/lib/json';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const monitor = createPerformanceMonitor();

  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || null;
    
    // Parse JSON body
    const body = await request.json();
    const { title, content } = body;

    if (!content) {
      return NextResponse.json({ error: 'No content provided' }, { status: 400 });
    }

    // Validate JSON content
    let parsedContent: unknown;
    try {
      parsedContent = typeof content === 'string' ? JSON.parse(content) : content;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON format' }, { status: 400 });
    }

    // Convert back to string for storage
    const jsonString = JSON.stringify(parsedContent, null, 2);

    // Check size limit (max 2GB for very large JSONs)
    const maxSize = parseInt(process.env.MAX_JSON_SIZE_MB || '2048') * 1024 * 1024;
    if (jsonString.length > maxSize) {
      return NextResponse.json(
        { error: `JSON size exceeds ${maxSize / (1024 * 1024)}MB limit` },
        { status: 413 }
      );
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
        return NextResponse.json({
          shareId: existingDoc.shareId,
          message: 'Document already exists',
          isExisting: true
        });
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

    return NextResponse.json({
      shareId: document.shareId,
      title: document.title,
      size: Number(document.size),
      analysis,
      message: 'JSON document created successfully'
    });

  } catch (error) {
    monitor.end('json_create_error');
    console.error('JSON creation error:', error);
    
    return NextResponse.json(
      { error: 'Failed to create JSON document' },
      { status: 500 }
    );
  }
}
