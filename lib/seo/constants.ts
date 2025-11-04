/**
 * SEO Constants and Configuration
 * Centralized constants for SEO infrastructure
 */

export const DEFAULT_SEO_CONFIG = {
  siteName: 'JSON Viewer',
  // Use environment variable with fallback - ensure consistency across the app
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://json-viewer.io',
  siteLanguage: 'en',
  siteLocale: 'en_US',
  defaultTitle: 'JSON Viewer - Free Online JSON Formatter, Editor & Validator',
  titleTemplate: '%s | JSON Viewer',
  defaultDescription:
    'Free online JSON viewer, formatter, and editor with syntax highlighting, tree view, and instant sharing. Validate, beautify, and visualize JSON data with our powerful web-based tool.',
  keywords: [
    'json viewer',
    'json formatter',
    'json editor',
    'json validator',
    'json beautifier',
    'json tree view',
    'online json tool',
    'json visualizer',
    'json parser',
    'json syntax highlighting',
    'share json',
    'json collaboration',
  ],
  ogImage: '/og-image.png.svg',
  ogImageWidth: 1200,
  ogImageHeight: 630,
  twitterHandle: '@jsonviewer',
} as const;

/**
 * SEO validation limits
 */
export const SEO_LIMITS = {
  TITLE_MAX_LENGTH: 200,
  DESCRIPTION_MAX_LENGTH: 500,
  KEYWORDS_MAX_COUNT: 20,
  CACHE_REVALIDATE_SECONDS: 60,
  SITEMAP_TIMEOUT_MS: 1000,
  SITEMAP_MAX_URLS: 50000,
  SITEMAP_MAX_SIZE_MB: 50,
} as const;

/**
 * Comprehensive page-specific SEO configurations
 */
export const PAGE_SEO = {
  home: {
    title: 'JSON Viewer - Free Online JSON Formatter, Editor & Validator',
    description:
      'Free online JSON viewer, formatter, and editor with syntax highlighting, tree view, and instant sharing. Validate, beautify, and visualize JSON data with our powerful web-based tool. No installation required. Process large files, real-time collaboration.',
    keywords: [
      // Primary keywords
      'json viewer',
      'json formatter',
      'json editor',
      'json validator',
      'json beautifier',
      // Long-tail keywords
      'free json viewer online',
      'json formatter online free',
      'json tree viewer',
      'validate json online',
      'json syntax checker',
      'prettify json online',
      'json visualizer tool',
      'format json code',
      // Use case keywords
      'api response viewer',
      'json debugging tool',
      'json file viewer',
      'parse json online',
      'json minifier',
      'json compare tool',
      'json diff viewer',
      'json schema validator',
      // Technical keywords
      'json pretty print',
      'json lint',
      'json parser online',
      'json syntax highlighting',
      'json data visualization',
      'rest api testing',
      'json mock data',
      'json templates',
    ],
    ogImage: '/og-image.png.svg',
  },
  library: {
    title: 'Public JSON Library - Browse Shared JSON Examples & Templates',
    description:
      'Discover and explore thousands of shared JSON examples from the community. Find real-world JSON structures, API responses, configurations, database schemas, and templates for every use case.',
    keywords: [
      'json examples',
      'json templates',
      'shared json',
      'json library',
      'api examples',
      'json schemas',
      'json samples',
      'community json',
      'open source json',
    ],
    ogImage: '/og-library.png.svg',
  },
  edit: {
    title: 'JSON Editor - Create, Edit & Validate JSON Online',
    description:
      'Professional online JSON editor with real-time syntax highlighting, auto-completion, validation, and error detection. Create, edit, and format JSON documents with powerful features.',
    keywords: [
      'json editor',
      'json creator',
      'online json editor',
      'json maker',
      'json validation',
      'json syntax highlighting',
      'json auto-complete',
    ],
    ogImage: '/og-editor.png.svg',
  },
  format: {
    title: 'JSON Formatter - Beautify, Minify & Pretty Print JSON',
    description:
      'Format and beautify JSON online with our free tool. Minify JSON for production, prettify for readability, or validate syntax. Supports large files and complex structures.',
    keywords: [
      'json formatter',
      'json beautifier',
      'json minifier',
      'prettify json',
      'json pretty print',
      'format json online',
      'json validator',
    ],
    ogImage: '/og-formatter.png.svg',
  },
  compare: {
    title: 'JSON Compare - Diff, Compare & Merge JSON Files',
    description:
      'Compare two JSON files and see differences highlighted with our advanced diff tool. Perfect for debugging API changes, configuration comparisons, and data validation.',
    keywords: [
      'json compare',
      'json diff',
      'compare json files',
      'json difference',
      'json merge',
      'api diff',
      'json debugging',
    ],
    ogImage: '/og-compare.png.svg',
  },
  saved: {
    title: 'My JSON Library - Manage Private & Public Documents',
    description:
      'Access and manage all your saved JSON documents. Edit metadata, share publicly, publish to community library, or keep private. Full control over your JSON collection.',
    keywords: [
      'saved json',
      'my json documents',
      'json management',
      'private json library',
      'json collection',
    ],
    ogImage: '/og-saved.png.svg',
    noIndex: true,
  },
  viewer: {
    title: 'JSON Document Viewer - Interactive JSON Explorer',
    description:
      'View shared JSON documents with interactive tree navigation, syntax highlighting, and powerful search. Explore complex JSON structures with ease.',
    keywords: ['json viewer', 'shared json', 'json explorer', 'json document', 'interactive json'],
    ogImage: '/og-viewer.png.svg',
  },
  embed: {
    title: 'Embedded JSON Viewer - Integrate JSON Viewing',
    description:
      'Embeddable JSON viewer component for your website or application. Clean, fast, and feature-rich JSON visualization.',
    keywords: ['embedded json viewer', 'json widget', 'json component', 'json embed'],
    ogImage: '/og-embed.png.svg',
  },
  blog: {
    title: 'JSON Guides & Tutorials - Learn JSON Best Practices',
    description:
      'Comprehensive guides, tutorials, and best practices for working with JSON. Learn JSON formatting, validation, API integration, and advanced techniques for developers.',
    keywords: [
      'json tutorial',
      'json guide',
      'json best practices',
      'json learning',
      'json documentation',
      'api tutorial',
      'json for beginners',
      'json advanced',
      'rest api guide',
      'json schema tutorial',
      'json validation guide',
    ],
    ogImage: '/og-blog.png.svg',
  },
  minify: {
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
  },
  convert: {
    title: 'JSON Converter - Convert JSON to YAML, XML, CSV, TOML & More',
    description:
      'Free online JSON converter tool. Convert JSON to YAML, XML, CSV, TOML, Properties, TypeScript, and JavaScript formats. Fast, secure, and easy to use with syntax highlighting.',
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
  },
  profile: {
    title: 'User Profile - JSON Viewer',
    description: 'Manage your JSON Viewer account, preferences, and saved documents.',
    keywords: ['profile', 'account', 'settings', 'user profile'],
    ogImage: '/og-image.png.svg',
    noIndex: true,
  },
  'tag-analytics': {
    title: 'Tag Analytics - JSON Viewer',
    description: 'View analytics and statistics for JSON document tags and categories.',
    keywords: ['analytics', 'tags', 'statistics', 'json analytics'],
    ogImage: '/og-image.png.svg',
    noIndex: true,
  },
} as const;

