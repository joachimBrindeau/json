import { MetadataRoute } from 'next';
import { DEFAULT_SEO_CONFIG } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = DEFAULT_SEO_CONFIG.siteUrl;

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/superadmin/',
          '/library/draft-*',
          '/*?*', // Query parameters
          '/auth/*',
        ],
      },
      {
        userAgent: 'GPTBot',
        disallow: ['/'],
      },
      {
        userAgent: 'Google-Extended',
        disallow: ['/'],
      },
      {
        userAgent: 'CCBot',
        disallow: ['/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}