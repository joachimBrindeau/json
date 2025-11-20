import { generateSEOMetadata } from '@/lib/seo';
import { getCanonicalUrl } from '@/lib/seo/url-utils';

export const metadata = generateSEOMetadata({
  title: 'JSON Converter - Convert JSON to YAML, XML, CSV, TOML & More',
  description:
    'Convert JSON to YAML, XML, CSV, TOML, and more instantly. Free online converter with syntax highlighting. Transform your data now.',
  keywords: [
    'json converter',
    'json to yaml',
    'json to xml',
    'json to csv',
    'json to toml',
    'json to properties',
    'json to typescript',
    'json to javascript',
    'convert json',
    'format converter',
    'data conversion',
    'online converter',
    'free json tools',
  ],
  ogImage: '/og-convert.png.svg',
  canonicalUrl: getCanonicalUrl('/convert'),
});
