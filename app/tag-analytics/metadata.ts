import { Metadata } from 'next';
import { generateSEOMetadata } from '@/lib/seo';
import { getCanonicalUrl } from '@/lib/seo/url-utils';
import { PAGE_SEO } from '@/lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: PAGE_SEO['tag-analytics'].title,
  description: PAGE_SEO['tag-analytics'].description,
  keywords: [...PAGE_SEO['tag-analytics'].keywords],
  ogImage: PAGE_SEO['tag-analytics'].ogImage,
  canonicalUrl: getCanonicalUrl('tag-analytics'),
  noIndex: PAGE_SEO['tag-analytics'].noIndex,
});

