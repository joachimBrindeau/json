import { generateSEOMetadata } from '@/lib/seo';
import { getCanonicalUrl } from '@/lib/seo/url-utils';

export const metadata = generateSEOMetadata({
  title: 'JSON Minifier - Compress and Minify JSON Online',
  description:
    'Minify and compress JSON files instantly. Reduce file size while preserving data integrity. Free online tool - start compressing now.',
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
