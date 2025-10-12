import { MainLayout } from '@/components/layout/main-layout';
import { generateSEOMetadata } from '@/lib/seo';
import { Metadata } from 'next';

export const metadata: Metadata = generateSEOMetadata({
  title: 'JSON Guides & Tutorials - Learn JSON Best Practices',
  description: 'Comprehensive guides, tutorials, and best practices for working with JSON. Learn JSON formatting, validation, API integration, and advanced techniques for developers.',
  keywords: [
    'json tutorial', 'json guide', 'json best practices', 'json learning',
    'json documentation', 'api tutorial', 'json for beginners', 'json advanced',
    'rest api guide', 'json schema tutorial', 'json validation guide'
  ],
  canonicalUrl: `${process.env.NEXT_PUBLIC_APP_URL}/blog`
});

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}