import { MetadataRoute } from 'next';
import { DEFAULT_SEO_CONFIG } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = DEFAULT_SEO_CONFIG.siteUrl;
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    rules: [
      {
        userAgent: '*',
        allow: isProduction ? '/' : '/',
        disallow: [
          '/api/',
          '/admin/',
          '/superadmin/',
          '/private/',
          '/library/draft-*',
          '/auth/',
          '/auth/*',
          // Disallow embedded views from being indexed separately
          '/embed/*',
          // Note: Removed '/?*' pattern as canonical tags handle duplicate content
          // from query parameters better than blocking all query strings
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
      {
        userAgent: 'ChatGPT-User',
        disallow: ['/'],
      },
      {
        userAgent: 'anthropic-ai',
        disallow: ['/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    ...(isProduction
      ? {}
      : {
          host: baseUrl,
        }),
  };
}
