import { MetadataRoute } from 'next';
import { unstable_cache } from 'next/cache';
import { DEFAULT_SEO_CONFIG } from '@/lib/seo';
import { logger } from '@/lib/logger';
import { config } from '@/lib/config';

// Function to get prisma conditionally
function getPrisma() {
  if (!config.database.url) {
    return null;
  }

   
  const { prisma } = require('@/lib/db');
  return prisma;
}

const prisma = getPrisma();

/**
 * Internal sitemap generation function
 * This is wrapped in unstable_cache for performance
 */
async function generateSitemapInternal(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = DEFAULT_SEO_CONFIG.siteUrl;

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/library`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/edit`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/format`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/minify`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/compare`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/convert`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/save`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/tag-analytics`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/profile`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/llms.txt`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.3,
    },
  ];

  // Only try to get dynamic content if database is available
  if (!config.database.url || !prisma) {
    logger.warn(
      { staticPagesCount: staticPages.length },
      'Database not available for sitemap, returning static pages only'
    );
    return staticPages;
  }

  try {
    // Optimized single query for public documents
    // Combine both queries into one for better performance
    const publicDocuments = await prisma.jsonDocument.findMany({
      where: {
        visibility: 'public',
        publishedAt: { not: null },
      },
      select: {
        shareId: true,
        slug: true,
        updatedAt: true,
        publishedAt: true,
        viewCount: true,
      },
      orderBy: [
        { publishedAt: 'desc' }, // Primary sort by publication date
        { viewCount: 'desc' }, // Secondary sort by popularity
      ],
      take: 1500, // Increased limit, but still reasonable
    });

    const dynamicPages: MetadataRoute.Sitemap = [];

    // Add public documents to library (/library/...)
    // Use optimized single query result
    if (publicDocuments && Array.isArray(publicDocuments)) {
      publicDocuments.forEach((doc) => {
        const docId = doc.slug || doc.shareId;
        if (docId) {
          dynamicPages.push({
            url: `${baseUrl}/library/${docId}`,
            lastModified: doc.updatedAt,
            changeFrequency: 'weekly' as const,
            priority: 0.8,
          });
        }
      });
    }

    logger.info(
      {
        staticPagesCount: staticPages.length,
        dynamicPagesCount: dynamicPages.length,
      },
      'Sitemap generation completed successfully'
    );
    return [...staticPages, ...dynamicPages];
  } catch (error) {
    logger.error(
      {
        err: error,
        staticPagesCount: staticPages.length,
      },
      'Error generating sitemap, falling back to static pages'
    );
    return staticPages; // Return static pages as fallback
  }
}

/**
 * Cached sitemap generation with 1 hour revalidation
 * This prevents expensive database queries on every request
 */
const generateCachedSitemap = unstable_cache(
  generateSitemapInternal,
  ['sitemap'],
  {
    revalidate: 3600, // Cache for 1 hour
    tags: ['sitemap'],
  }
);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return generateCachedSitemap();
}
