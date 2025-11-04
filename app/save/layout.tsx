import { Metadata } from 'next';
import { generateSEOMetadata } from '@/lib/seo';
import { getCanonicalUrl } from '@/lib/seo/url-utils';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Save JSON - Store and Manage Your JSON Documents',
  description:
    'Save and manage your JSON documents online. Access your saved JSON files from anywhere, organize by tags, and collaborate with your team. Free storage for your JSON projects.',
  keywords: [
    'save json',
    'json storage',
    'json documents',
    'json management',
    'store json',
    'json files',
    'json organizer',
    'json workspace',
  ],
  ogImage: '/og-image.png.svg',
  canonicalUrl: getCanonicalUrl('/save'),
  noIndex: true, // User-specific content, should not be indexed
});

export default function SaveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
