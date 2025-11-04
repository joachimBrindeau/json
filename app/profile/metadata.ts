import { Metadata } from 'next';
import { generateSEOMetadata } from '@/lib/seo';
import { getCanonicalUrl } from '@/lib/seo/url-utils';
import { PAGE_SEO } from '@/lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: PAGE_SEO.profile.title,
  description: PAGE_SEO.profile.description,
    keywords: [...PAGE_SEO.profile.keywords],
  ogImage: PAGE_SEO.profile.ogImage,
  canonicalUrl: getCanonicalUrl('profile'),
  noIndex: PAGE_SEO.profile.noIndex,
});

