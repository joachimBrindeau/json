import { generateSEOMetadata } from '@/lib/seo';
import { getCanonicalUrl } from '@/lib/seo/url-utils';

export const metadata = generateSEOMetadata({
  title: 'JSON Minifier - Compress and Minify JSON Online',
  description:
    'Free online JSON minifier tool. Compress and minify JSON files to reduce size. Remove whitespace and formatting while preserving data integrity. Fast, secure, and easy to use.',
  keywords: [
    'json minifier',
    'minify json',
    'compress json',
    'json compressor',
    'reduce json size',
    'remove whitespace',
    'json optimizer',
    'online minifier',
    'free json tools',
    'json compression',
  ],
  ogImage: '/og-minify.png.svg',
  canonicalUrl: getCanonicalUrl('/minify'),
});
