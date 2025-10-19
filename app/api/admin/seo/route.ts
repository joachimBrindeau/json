import { NextRequest, NextResponse } from 'next/server';
import { getAllSEOSettings, upsertSEOSettings } from '@/lib/seo/database';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { success, badRequest, internalServerError } from '@/lib/api/responses';
import { config } from '@/lib/config';
import { withAuth } from '@/lib/api/utils';

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
  logger.info('SEO API endpoint called');

  try {
    logger.info('Attempting to get SEO settings...');
    const settings = await getAllSEOSettings();
    logger.info({ settingsCount: settings.length }, `Retrieved ${settings.length} SEO settings`);

    return success({
      settings,
      message: `Found ${settings.length} SEO settings`,
      databaseAvailable: !!config.database.url
    });
  } catch (error) {
    logger.error({ err: error, databaseAvailable: !!config.database.url }, 'API Error');
    return success({
      success: false,
      error: 'Failed to fetch SEO settings',
      details: error instanceof Error ? error.message : 'Unknown error',
      settings: [],
      databaseAvailable: !!config.database.url
    });
  }
}

// POST - Update or create SEO settings
export const POST = withAuth(async (request, session) => {
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

    return success({ settings });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequest(error.issues[0].message);
    }

    logger.error({ err: error, userId: session?.user?.id }, 'Failed to update SEO settings');
    return internalServerError('Failed to update SEO settings');
  }
});