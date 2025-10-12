import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAllSEOSettings, upsertSEOSettings } from '@/lib/seo/database';
import { z } from 'zod';

const seoUpdateSchema = z.object({
  pageKey: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(500),
  keywords: z.array(z.string()).max(20),
  ogImage: z.string().optional(),
  isActive: z.boolean().default(true),
  priority: z.number().min(1).max(100).default(100),
});

// GET - Fetch all SEO settings
export async function GET() {
  console.log('SEO API endpoint called');
  
  try {
    console.log('Attempting to get SEO settings...');
    const settings = await getAllSEOSettings();
    console.log(`Retrieved ${settings.length} SEO settings`);
    
    return NextResponse.json({ 
      success: true,
      settings,
      message: `Found ${settings.length} SEO settings`,
      databaseAvailable: !!process.env.DATABASE_URL
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch SEO settings', 
      details: error instanceof Error ? error.message : 'Unknown error',
      settings: [],
      databaseAvailable: !!process.env.DATABASE_URL
    }, { status: 200 });
  }
}

// POST - Update or create SEO settings
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  // In production, add admin role check here
  // if (!session.user.isAdmin) {
  //   return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  // }

  try {
    const body = await request.json();
    const data = seoUpdateSchema.parse(body);

    const settings = await upsertSEOSettings(data.pageKey, {
      title: data.title,
      description: data.description,
      keywords: data.keywords,
      ogImage: data.ogImage,
      isActive: data.isActive,
      priority: data.priority,
    });

    return NextResponse.json({ settings });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }

    console.error('Failed to update SEO settings:', error);
    return NextResponse.json({ error: 'Failed to update SEO settings' }, { status: 500 });
  }
}