import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Increment view count for public JSONs only
    await prisma.jsonDocument.updateMany({
      where: {
        shareId: id,
        visibility: 'public',
      },
      data: {
        viewCount: { increment: 1 },
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
