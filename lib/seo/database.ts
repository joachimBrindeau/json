import { prisma } from '@/lib/db';
import { generateSEOMetadata, PAGE_SEO, getCanonicalUrl } from '@/lib/seo';
import { validateSEOSettings, validatePageKey } from '@/lib/seo/validation';
import type { PageKey, SEOSettingsInput } from '@/lib/seo/types';
import { Metadata } from 'next';
import { unstable_cache } from 'next/cache';
import { logger } from '@/lib/logger';

/**
 * Cached database SEO fetcher with Next.js unstable_cache
 * This provides longer-term caching across multiple renders and requests,
 * preventing simultaneous database queries during SSR of multiple layouts
 */
export const getSEOSettingsFromDatabase = unstable_cache(
  async (pageKey: string) => {
    try {
      const settings = await prisma.seoSettings.findFirst({
        where: {
          pageKey,
          isActive: true,
        },
        orderBy: {
          priority: 'desc', // Highest priority first (for A/B testing)
        },
      });

      return settings;
    } catch (error) {
      logger.warn({ err: error, pageKey }, 'SEO database error, using fallbacks');
      return null;
    }
  },
  ['seo-settings'], // cache key prefix
  {
    revalidate: 60, // Revalidate every 60 seconds
    tags: ['seo-settings'], // Allow manual cache invalidation
  }
);

/**
 * Generate metadata with database fallback to hardcoded values
 */
export async function generateDatabaseSEOMetadata(pageKey: PageKey): Promise<Metadata> {
  // Try to get from database first
  const dbSettings = await getSEOSettingsFromDatabase(pageKey);

  if (dbSettings) {
    return generateSEOMetadata({
      title: dbSettings.title,
      description: dbSettings.description,
      keywords: Array.isArray(dbSettings.keywords) ? [...dbSettings.keywords] : [],
      ogImage: dbSettings.ogImage || undefined,
      canonicalUrl: getCanonicalUrl(pageKey === 'home' ? '' : pageKey),
    });
  }

  // Fallback to hardcoded PAGE_SEO
  const fallbackConfig = PAGE_SEO[pageKey];
  return generateSEOMetadata({
    title: fallbackConfig.title,
    description: fallbackConfig.description,
    keywords: Array.isArray(fallbackConfig.keywords) ? [...fallbackConfig.keywords] : [],
    ogImage: fallbackConfig.ogImage,
    canonicalUrl: getCanonicalUrl(pageKey === 'home' ? '' : pageKey),
    noIndex: 'noIndex' in fallbackConfig ? fallbackConfig.noIndex : false,
  });
}

/**
 * Upsert SEO settings for a page
 */
export async function upsertSEOSettings(pageKey: string, data: SEOSettingsInput) {
  // Validate page key
  if (!validatePageKey(pageKey)) {
    throw new Error('Invalid page key');
  }

  // Validate input data using centralized validation
  const validation = validateSEOSettings(data);
  if (!validation.valid) {
    throw new Error(validation.errors.join('; '));
  }

  try {
    return await Promise.race([
      prisma.seoSettings.upsert({
        where: { pageKey },
        create: {
          pageKey,
          isActive: data.isActive ?? true,
          priority: data.priority ?? 100,
          ...data,
        },
        update: data,
      }),
      new Promise(
        (_, reject) => setTimeout(() => reject(new Error('Database operation timeout')), 500) // Much shorter timeout
      ),
    ]);
  } catch (error) {
    logger.error({ err: error, pageKey, data }, 'Failed to upsert SEO settings');
    throw new Error(
      `SEO settings update failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get all SEO settings for admin interface
 */
export async function getAllSEOSettings() {
  try {
    return await prisma.seoSettings.findMany({
      orderBy: [{ pageKey: 'asc' }, { priority: 'desc' }],
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch all SEO settings');
    return [];
  }
}

/**
 * Seed database with default SEO values
 */
export async function seedSEOSettings() {
  const defaultSettings = [
    {
      pageKey: 'home',
      title: PAGE_SEO.home.title,
      description: PAGE_SEO.home.description,
      keywords: PAGE_SEO.home.keywords,
      ogImage: PAGE_SEO.home.ogImage,
    },
    {
      pageKey: 'library',
      title: PAGE_SEO.library.title,
      description: PAGE_SEO.library.description,
      keywords: PAGE_SEO.library.keywords,
      ogImage: PAGE_SEO.library.ogImage,
    },
    {
      pageKey: 'edit',
      title: PAGE_SEO.edit.title,
      description: PAGE_SEO.edit.description,
      keywords: PAGE_SEO.edit.keywords,
      ogImage: PAGE_SEO.edit.ogImage,
    },
    {
      pageKey: 'format',
      title: PAGE_SEO.format.title,
      description: PAGE_SEO.format.description,
      keywords: PAGE_SEO.format.keywords,
      ogImage: PAGE_SEO.format.ogImage,
    },
    {
      pageKey: 'compare',
      title: PAGE_SEO.compare.title,
      description: PAGE_SEO.compare.description,
      keywords: PAGE_SEO.compare.keywords,
      ogImage: PAGE_SEO.compare.ogImage,
    },
    {
      pageKey: 'saved',
      title: PAGE_SEO.saved.title,
      description: PAGE_SEO.saved.description,
      keywords: PAGE_SEO.saved.keywords,
      ogImage: PAGE_SEO.saved.ogImage,
    },
  ];

  try {
    for (const settings of defaultSettings) {
      await upsertSEOSettings(settings.pageKey, {
        title: settings.title,
        description: settings.description,
        keywords: Array.isArray(settings.keywords) ? [...settings.keywords] : [],
        ogImage: settings.ogImage,
      });
    }
    logger.info({ count: defaultSettings.length }, 'SEO settings seeded successfully');
  } catch (error) {
    logger.error({ err: error }, 'Failed to seed SEO settings');
    throw error;
  }
}
