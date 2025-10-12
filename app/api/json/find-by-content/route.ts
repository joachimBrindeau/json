import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { contentHash, content } = await request.json();

    if (!contentHash || !content) {
      return NextResponse.json({ error: 'Content hash and content are required' }, { status: 400 });
    }

    // Parse the content to compare actual JSON structure
    let parsedContent;
    try {
      parsedContent = JSON.parse(content);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON content' }, { status: 400 });
    }

    // Find documents that belong to the current user (if authenticated) or are anonymous
    const whereCondition = session?.user?.email
      ? {
          OR: [{ userId: session.user.email }, { isAnonymous: true }],
        }
      : { isAnonymous: true };

    // Find all candidate documents and compare their content
    const documents = await prisma.jsonDocument.findMany({
      where: whereCondition,
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

    // Find the first document with matching content
    for (const doc of documents) {
      try {
        // Deep comparison of JSON content
        if (JSON.stringify(doc.content) === JSON.stringify(parsedContent)) {
          return NextResponse.json({
            success: true,
            document: {
              id: doc.id,
              shareId: doc.shareId,
              title: doc.title,
              content: doc.content,
              size: doc.size,
              nodeCount: doc.nodeCount,
              maxDepth: doc.maxDepth,
              complexity: doc.complexity,
              createdAt: doc.createdAt,
              userId: doc.userId,
              isAnonymous: doc.isAnonymous,
            },
          });
        }
      } catch {
        // Skip this document if JSON comparison fails
        continue;
      }
    }

    // No matching document found
    return NextResponse.json({
      success: false,
      document: null,
    });
  } catch (error) {
    console.error('Find by content error:', error);
    return NextResponse.json(
      {
        error: 'Failed to search for existing content',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
