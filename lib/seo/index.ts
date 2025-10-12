import { Metadata } from 'next';

/**
 * Centralized SEO Configuration
 * Single source of truth for all SEO-related settings
 */
export const DEFAULT_SEO_CONFIG = {
  siteName: 'JSON Viewer',
  // Use environment variable with fallback - ensure consistency across the app
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://json-viewer.io',
  siteLanguage: 'en',
  siteLocale: 'en_US',
  defaultTitle: 'JSON Viewer - Free Online JSON Formatter, Editor & Validator',
  titleTemplate: '%s | JSON Viewer',
  defaultDescription: 'Free online JSON viewer, formatter, and editor with syntax highlighting, tree view, and instant sharing. Validate, beautify, and visualize JSON data with our powerful web-based tool.',
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
    'json collaboration'
  ],
  ogImage: '/og-image.png',
  ogImageWidth: 1200,
  ogImageHeight: 630,
  twitterHandle: '@jsonviewer'
};

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  ogType?: 'website' | 'article';
  canonicalUrl?: string;
  noIndex?: boolean;
  publishedAt?: string;
  author?: string;
  richContent?: string; // For structured data
}

/**
 * Generate comprehensive metadata for pages
 */
export function generateSEOMetadata({
  title,
  description,
  keywords = [],
  ogImage,
  ogType = 'website',
  canonicalUrl,
  noIndex = false,
  publishedAt,
  author
}: SEOProps = {}): Metadata {
  const fullTitle = title ? `${title} | ${DEFAULT_SEO_CONFIG.siteName}` : DEFAULT_SEO_CONFIG.defaultTitle;
  const fullDescription = description || DEFAULT_SEO_CONFIG.defaultDescription;
  const fullKeywords = [...DEFAULT_SEO_CONFIG.keywords, ...keywords];
  const fullCanonicalUrl = canonicalUrl || DEFAULT_SEO_CONFIG.siteUrl;
  const fullOgImage = ogImage || DEFAULT_SEO_CONFIG.ogImage;

  return {
    metadataBase: new URL(DEFAULT_SEO_CONFIG.siteUrl),
    title: fullTitle,
    description: fullDescription,
    keywords: fullKeywords,
    authors: author ? [{ name: author }] : [{ name: 'JSON Viewer Team' }],
    creator: DEFAULT_SEO_CONFIG.siteName,
    publisher: DEFAULT_SEO_CONFIG.siteName,
    category: 'Technology',
    classification: 'Developer Tools',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
      yandex: process.env.YANDEX_VERIFICATION,
      other: {
        'msvalidate.01': process.env.BING_VERIFICATION || '',
      },
    },
    openGraph: {
      title: fullTitle,
      description: fullDescription,
      url: fullCanonicalUrl,
      siteName: DEFAULT_SEO_CONFIG.siteName,
      images: [
        {
          url: fullOgImage,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
      locale: 'en_US',
      type: ogType,
      ...(publishedAt && { publishedTime: publishedAt }),
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: fullDescription,
      images: [fullOgImage],
      creator: DEFAULT_SEO_CONFIG.twitterHandle,
      site: DEFAULT_SEO_CONFIG.twitterHandle,
    },
    // Additional social media platforms
    other: {
      ...{
        'apple-mobile-web-app-capable': 'yes',
        'apple-mobile-web-app-status-bar-style': 'default',
        'apple-mobile-web-app-title': DEFAULT_SEO_CONFIG.siteName,
        'mobile-web-app-capable': 'yes',
        'theme-color': '#ffffff',
        'msapplication-TileColor': '#ffffff',
        'application-name': DEFAULT_SEO_CONFIG.siteName,
        'rating': 'general',
        'revisit-after': '7 days',
      },
      // LinkedIn specific
      'linkedin:owner': 'jsonviewer',
      // Pinterest specific
      'pinterest-rich-pin': 'true',
      // Facebook specific
      'fb:app_id': process.env.FACEBOOK_APP_ID || '',
      // WhatsApp/Telegram sharing
      'whatsapp:title': fullTitle,
      'telegram:title': fullTitle,
    },
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: fullCanonicalUrl,
    },
  };
}

/**
 * Generate JSON-LD structured data for articles/documents
 */
export function generateArticleStructuredData({
  title,
  description,
  url,
  publishedAt,
  author,
  richContent
}: {
  title: string;
  description?: string;
  url: string;
  publishedAt?: string;
  author?: string;
  richContent?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: description || DEFAULT_SEO_CONFIG.defaultDescription,
    url,
    datePublished: publishedAt,
    author: author ? {
      '@type': 'Person',
      name: author
    } : {
      '@type': 'Organization', 
      name: DEFAULT_SEO_CONFIG.siteName
    },
    publisher: {
      '@type': 'Organization',
      name: DEFAULT_SEO_CONFIG.siteName,
      logo: {
        '@type': 'ImageObject',
        url: `${DEFAULT_SEO_CONFIG.siteUrl}/icon.svg`
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url
    },
    ...(richContent && { articleBody: richContent })
  };
}

/**
 * Generate JSON-LD for the main application
 */
export function generateWebApplicationStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: DEFAULT_SEO_CONFIG.siteName,
    description: DEFAULT_SEO_CONFIG.defaultDescription,
    url: DEFAULT_SEO_CONFIG.siteUrl,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'JSON Formatting and Beautification',
      'JSON Validation and Error Detection', 
      'Interactive Tree View Navigation',
      'Syntax Highlighting',
      'Real-time Collaboration',
      'JSON Sharing and Publishing',
      'Multiple Export Formats',
      'API Integration',
      'Large File Processing',
      'Mobile-Responsive Interface'
    ],
    creator: {
      '@type': 'Organization',
      name: DEFAULT_SEO_CONFIG.siteName
    }
  };
}

/**
 * Safe JSON-LD rendering helper
 */
export function renderJsonLd(data: object): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

/**
 * Additional structured data templates for enhanced SEO
 */
export const STRUCTURED_DATA_TEMPLATES = {
  /**
   * Organization structured data
   */
  organization: {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: DEFAULT_SEO_CONFIG.siteName,
    url: DEFAULT_SEO_CONFIG.siteUrl,
    logo: `${DEFAULT_SEO_CONFIG.siteUrl}/logo.png`,
    sameAs: [
      'https://twitter.com/jsonviewer',
      'https://github.com/jsonviewer'
    ],
  },

  /**
   * Generate breadcrumb structured data
   */
  breadcrumbs: (items: Array<{ name: string; url: string }>) => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }),

  /**
   * Generate FAQ page structured data
   */
  faqPage: (faqs: Array<{ question: string; answer: string }>) => ({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }),
};

/**
 * Comprehensive page-specific SEO configurations
 */
export const PAGE_SEO = {
  home: {
    title: 'JSON Viewer - Free Online JSON Formatter, Editor & Validator',
    description: 'Free online JSON viewer, formatter, and editor with syntax highlighting, tree view, and instant sharing. Validate, beautify, and visualize JSON data with our powerful web-based tool. No installation required. Process large files, real-time collaboration.',
    keywords: [
      // Primary keywords
      'json viewer', 'json formatter', 'json editor', 'json validator', 'json beautifier',
      // Long-tail keywords
      'free json viewer online', 'json formatter online free', 'json tree viewer', 'validate json online',
      'json syntax checker', 'prettify json online', 'json visualizer tool', 'format json code',
      // Use case keywords
      'api response viewer', 'json debugging tool', 'json file viewer', 'parse json online',
      'json minifier', 'json compare tool', 'json diff viewer', 'json schema validator',
      // Technical keywords
      'json pretty print', 'json lint', 'json parser online', 'json syntax highlighting',
      'json data visualization', 'rest api testing', 'json mock data', 'json templates'
    ],
    ogImage: '/og-image.png'
  },
  library: {
    title: 'Public JSON Library - Browse Shared JSON Examples & Templates',
    description: 'Discover and explore thousands of shared JSON examples from the community. Find real-world JSON structures, API responses, configurations, database schemas, and templates for every use case.',
    keywords: ['json examples', 'json templates', 'shared json', 'json library', 'api examples', 'json schemas', 'json samples', 'community json', 'open source json'],
    ogImage: '/og-library.png'
  },
  edit: {
    title: 'JSON Editor - Create, Edit & Validate JSON Online',
    description: 'Professional online JSON editor with real-time syntax highlighting, auto-completion, validation, and error detection. Create, edit, and format JSON documents with powerful features.',
    keywords: ['json editor', 'json creator', 'online json editor', 'json maker', 'json validation', 'json syntax highlighting', 'json auto-complete'],
    ogImage: '/og-editor.png'
  },
  format: {
    title: 'JSON Formatter - Beautify, Minify & Pretty Print JSON',
    description: 'Format and beautify JSON online with our free tool. Minify JSON for production, prettify for readability, or validate syntax. Supports large files and complex structures.',
    keywords: ['json formatter', 'json beautifier', 'json minifier', 'prettify json', 'json pretty print', 'format json online', 'json validator'],
    ogImage: '/og-formatter.png'
  },
  compare: {
    title: 'JSON Compare - Diff, Compare & Merge JSON Files',
    description: 'Compare two JSON files and see differences highlighted with our advanced diff tool. Perfect for debugging API changes, configuration comparisons, and data validation.',
    keywords: ['json compare', 'json diff', 'compare json files', 'json difference', 'json merge', 'api diff', 'json debugging'],
    ogImage: '/og-compare.png'
  },
  saved: {
    title: 'My JSON Library - Manage Private & Public Documents',
    description: 'Access and manage all your saved JSON documents. Edit metadata, share publicly, publish to community library, or keep private. Full control over your JSON collection.',
    keywords: ['saved json', 'my json documents', 'json management', 'private json library', 'json collection'],
    ogImage: '/og-saved.png',
    noIndex: true
  },
  viewer: {
    title: 'JSON Document Viewer - Interactive JSON Explorer',
    description: 'View shared JSON documents with interactive tree navigation, syntax highlighting, and powerful search. Explore complex JSON structures with ease.',
    keywords: ['json viewer', 'shared json', 'json explorer', 'json document', 'interactive json'],
    ogImage: '/og-viewer.png'
  },
  embed: {
    title: 'Embedded JSON Viewer - Integrate JSON Viewing',
    description: 'Embeddable JSON viewer component for your website or application. Clean, fast, and feature-rich JSON visualization.',
    keywords: ['embedded json viewer', 'json widget', 'json component', 'json embed'],
    ogImage: '/og-embed.png'
  }
} as const;