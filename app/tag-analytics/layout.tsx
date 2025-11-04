import { Metadata } from 'next';
import { generateSEOMetadata } from '@/lib/seo';
import { getCanonicalUrl } from '@/lib/seo/url-utils';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Tag Analytics - JSON Document Tag Statistics',
  description:
    'View analytics and statistics for JSON document tags. Track tag usage, popularity, trends, and insights across the JSON Viewer community library.',
  keywords: [
    'json tag analytics',
    'json statistics',
    'tag trends',
    'json analytics',
    'document analytics',
    'json insights',
  ],
  ogImage: '/og-image.png.svg',
  canonicalUrl: getCanonicalUrl('/tag-analytics'),
  noIndex: true, // Analytics page, typically not indexed
});

export default function TagAnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

