import { Metadata } from 'next';
import { generateSEOMetadata } from '@/lib/seo';
import { getCanonicalUrl } from '@/lib/seo/url-utils';

export const metadata: Metadata = generateSEOMetadata({
  title: 'JSON Viewer - Interactive JSON Explorer',
  description:
    'View and explore JSON documents with interactive tree navigation, syntax highlighting, and powerful search. Navigate complex JSON structures with ease.',
  keywords: [
    'json viewer',
    'json explorer',
    'json document viewer',
    'interactive json',
    'json tree view',
    'json visualization',
  ],
  ogImage: '/og-viewer.png.svg',
  canonicalUrl: getCanonicalUrl('/view'),
});

export default function ViewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

