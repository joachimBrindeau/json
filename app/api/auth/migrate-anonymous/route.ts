import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { anonymousJsonIds } = await request.json();

    if (!Array.isArray(anonymousJsonIds) || anonymousJsonIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or empty anonymousJsonIds array' },
        { status: 400 }
      );
    }

    // Validate that anonymousJsonIds are strings and reasonably formatted
    const validIds = anonymousJsonIds.filter(
      (id) => typeof id === 'string' && id.length > 0 && id.length < 100
    );

    if (validIds.length === 0) {
      return NextResponse.json({ error: 'No valid JSON IDs provided' }, { status: 400 });
    }

    // For anonymous IDs that start with "anon-", we can't migrate them directly
    // since they were never saved to the database. This endpoint is for
    // potential future functionality where we might track anonymous documents
    // differently.

    // For now, we'll just acknowledge the request and clear the client state
    const migratedCount = validIds.length;

    return NextResponse.json({
      success: true,
      message: `Acknowledged ${migratedCount} anonymous JSON documents`,
      migratedCount,
    });
  } catch (error) {
    console.error('Anonymous migration error:', error);

    return NextResponse.json(
      {
        error: 'Failed to migrate anonymous data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
