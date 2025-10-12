import { MetadataRoute } from 'next';
import { DEFAULT_SEO_CONFIG } from '@/lib/seo';

// Function to get prisma conditionally
function getPrisma() {
  if (!process.env.DATABASE_URL) {
    return null;
  }
  
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { prisma } = require('@/lib/db');
  return prisma;
}

const prisma = getPrisma();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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
      url: `${baseUrl}/compare`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
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
  if (!process.env.DATABASE_URL || !prisma) {
    console.warn('Database not available for sitemap, returning static pages only');
    return staticPages;
  }

  try {
    const queries = [];
    
    // Get public documents for dynamic sitemap
    queries.push(
      prisma.jsonDocument.findMany({
        where: {
          visibility: 'public',
          publishedAt: { not: null },
        },
        select: {
          shareId: true,
          slug: true,
          updatedAt: true,
          publishedAt: true,
          title: true,
        },
        orderBy: {
          publishedAt: 'desc',
        },
        take: 1000, // Limit for performance
      })
    );

    // Get popular shared documents (viewer URLs)
    queries.push(
      prisma.jsonDocument.findMany({
        where: {
          OR: [
            { visibility: 'public' },
            { visibility: 'unlisted' }
          ],
          shareId: { not: null },
        },
        select: {
          shareId: true,
          updatedAt: true,
          viewCount: true,
        },
        orderBy: {
          viewCount: 'desc',
        },
        take: 500,
      })
    );

    const [publicDocuments, sharedDocuments] = await Promise.race([
      Promise.all(queries),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database timeout')), 1000)
      )
    ]) as [unknown[], unknown[]];

    const dynamicPages: MetadataRoute.Sitemap = [];

    // Add public documents to library (/library/...)
    if (publicDocuments && Array.isArray(publicDocuments)) {
      publicDocuments.forEach((doc: unknown) => {
        const docTyped = doc as { shareId?: string; slug?: string; updatedAt: Date };
        if (docTyped.shareId || docTyped.slug) {
          dynamicPages.push({
            url: `${baseUrl}/library/${docTyped.slug || docTyped.shareId}`,
            lastModified: docTyped.updatedAt,
            changeFrequency: 'weekly' as const,
            priority: 0.8,
          });
        }
      });
    }

    // Add shared documents to library (/library/...)
    if (sharedDocuments && Array.isArray(sharedDocuments)) {
      sharedDocuments.forEach((doc: unknown) => {
        const docTyped = doc as { shareId?: string; updatedAt: Date };
        if (docTyped.shareId) {
          dynamicPages.push({
            url: `${baseUrl}/library/${docTyped.shareId}`,
            lastModified: docTyped.updatedAt,
            changeFrequency: 'monthly' as const,
            priority: 0.7,
          });
        }
      });
    }

    console.log(`Generated sitemap with ${staticPages.length} static pages and ${dynamicPages.length} dynamic pages`);
    return [...staticPages, ...dynamicPages];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    console.log(`Falling back to ${staticPages.length} static pages only`);
    return staticPages; // Return static pages as fallback
  }
}