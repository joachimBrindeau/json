import { DEFAULT_SEO_CONFIG } from './constants';
import type {
  ArticleStructuredDataInput,
  BreadcrumbItem,
  FAQItem,
  WebApplicationStructuredDataInput,
  ReviewStructuredDataInput,
  AggregateRating,
  Review,
  HowToInput,
} from './types';

/**
 * Consolidated structured data generation
 * Single source of truth for all JSON-LD schemas
 */

/**
 * Generate AggregateRating structured data
 * Following schema.org specification
 */
export function generateAggregateRatingStructuredData(rating: AggregateRating) {
  return {
    '@type': 'AggregateRating',
    ratingValue: rating.ratingValue.toString(),
    reviewCount: rating.reviewCount.toString(),
    bestRating: (rating.bestRating || 5).toString(),
    worstRating: (rating.worstRating || 1).toString(),
  };
}

/**
 * Generate Review structured data
 * Following schema.org specification
 */
export function generateReviewStructuredData(review: Review) {
  return {
    '@type': 'Review',
    author: {
      '@type': 'Person',
      name: review.author.name,
      ...(review.author.url && { url: review.author.url }),
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: review.reviewRating.ratingValue.toString(),
      bestRating: (review.reviewRating.bestRating || 5).toString(),
      worstRating: (review.reviewRating.worstRating || 1).toString(),
    },
    reviewBody: review.reviewBody,
    datePublished: review.datePublished,
  };
}

/**
 * Generate Review structured data for SoftwareApp
 * Combines aggregate rating and individual reviews
 */
export function generateSoftwareAppReviewStructuredData(reviewData: ReviewStructuredDataInput) {
  return {
    aggregateRating: generateAggregateRatingStructuredData(reviewData.aggregateRating),
    review: reviewData.reviews.map((review) => generateReviewStructuredData(review)),
  };
}

/**
 * Generate WebApplication structured data
 * Now supports optional review data
 */
export function generateWebApplicationStructuredData(
  overrides?: WebApplicationStructuredDataInput,
  reviewData?: ReviewStructuredDataInput
) {
  const baseSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: overrides?.name || DEFAULT_SEO_CONFIG.siteName,
    description: overrides?.description || DEFAULT_SEO_CONFIG.defaultDescription,
    url: overrides?.url || DEFAULT_SEO_CONFIG.siteUrl,
    applicationCategory: overrides?.applicationCategory || 'DeveloperApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList:
      overrides?.featureList || [
        'JSON Formatting and Beautification',
        'JSON Validation and Error Detection',
        'Interactive Tree View Navigation',
        'Syntax Highlighting',
        'Real-time Collaboration',
        'JSON Sharing and Publishing',
        'Multiple Export Formats',
        'API Integration',
        'Large File Processing',
        'Mobile-Responsive Interface',
      ],
    creator: {
      '@type': 'Organization',
      name: DEFAULT_SEO_CONFIG.siteName,
    },
  };

  // Add review data if provided
  if (reviewData) {
    return {
      ...baseSchema,
      ...generateSoftwareAppReviewStructuredData(reviewData),
    };
  }

  return baseSchema;
}

/**
 * Generate Article structured data
 */
export function generateArticleStructuredData(data: ArticleStructuredDataInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: data.title,
    description: data.description || DEFAULT_SEO_CONFIG.defaultDescription,
    url: data.url,
    datePublished: data.publishedAt,
    author: data.author
      ? {
          '@type': 'Person',
          name: data.author,
        }
      : {
          '@type': 'Organization',
          name: DEFAULT_SEO_CONFIG.siteName,
        },
    publisher: {
      '@type': 'Organization',
      name: DEFAULT_SEO_CONFIG.siteName,
      logo: {
        '@type': 'ImageObject',
        url: `${DEFAULT_SEO_CONFIG.siteUrl}/icon.svg`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': data.url,
    },
    ...(data.richContent && { articleBody: data.richContent }),
  };
}

/**
 * Generate Organization structured data
 */
export function generateOrganizationStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: DEFAULT_SEO_CONFIG.siteName,
    url: DEFAULT_SEO_CONFIG.siteUrl,
    logo: `${DEFAULT_SEO_CONFIG.siteUrl}/icon.svg`,
    sameAs: [
      process.env.NEXT_PUBLIC_TWITTER_URL || 'https://twitter.com/jsonviewer',
      process.env.NEXT_PUBLIC_GITHUB_URL || 'https://github.com/jsonviewer',
    ].filter(Boolean),
  };
}

/**
 * Generate WebSite structured data with searchAction
 * This enables Google site search
 */
export function generateWebSiteStructuredData() {
  const siteUrl = DEFAULT_SEO_CONFIG.siteUrl;
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: DEFAULT_SEO_CONFIG.siteName,
    url: siteUrl,
    description: DEFAULT_SEO_CONFIG.defaultDescription,
    publisher: {
      '@type': 'Organization',
      name: DEFAULT_SEO_CONFIG.siteName,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/icon.svg`,
      },
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/library?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Generate WebPage structured data
 */
export function generateWebPageStructuredData(data: {
  name: string;
  url: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
}) {
  const baseSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: data.name,
    url: data.url,
    description: data.description || DEFAULT_SEO_CONFIG.defaultDescription,
    isPartOf: {
      '@type': 'WebSite',
      name: DEFAULT_SEO_CONFIG.siteName,
      url: DEFAULT_SEO_CONFIG.siteUrl,
    },
    about: {
      '@type': 'Thing',
      name: 'JSON Tools',
      description: 'Online JSON viewer, formatter, editor, and validator tools',
    },
  };

  // Add breadcrumbs if provided
  if (data.breadcrumbs && data.breadcrumbs.length > 0) {
    return {
      ...baseSchema,
      breadcrumb: generateBreadcrumbStructuredData(data.breadcrumbs),
    };
  }

  return baseSchema;
}

/**
 * Generate BreadcrumbList structured data
 */
export function generateBreadcrumbStructuredData(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Generate FAQPage structured data
 */
export function generateFAQPageStructuredData(faqs: FAQItem[]) {
  return {
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
  };
}

/**
 * Generate HowTo structured data
 * Following schema.org HowTo specification
 */
export function generateHowToStructuredData(howTo: HowToInput) {
  const baseSchema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: howTo.name,
    description: howTo.description,
    step: howTo.steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      ...(step.image && {
        image: {
          '@type': 'ImageObject',
          url: step.image,
        },
      }),
      ...(step.url && { url: step.url }),
    })),
  };

  // Add optional fields if provided
  if (howTo.image) {
    baseSchema.image = {
      '@type': 'ImageObject',
      url: howTo.image,
    };
  }

  if (howTo.totalTime) {
    baseSchema.totalTime = howTo.totalTime;
  }

  if (howTo.supply && howTo.supply.length > 0) {
    baseSchema.supply = howTo.supply.map((item) => ({
      '@type': 'HowToSupply',
      name: item.name,
    }));
  }

  if (howTo.tool && howTo.tool.length > 0) {
    baseSchema.tool = howTo.tool.map((item) => ({
      '@type': 'HowToTool',
      name: item.name,
    }));
  }

  return baseSchema;
}

/**
 * Safe JSON-LD rendering helper
 * Escapes special characters for safe embedding in HTML
 */
export function renderJsonLd(data: object): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

/**
 * Structured data generator factory
 * Provides consistent API for all structured data types
 */
export const StructuredDataGenerator = {
  webApplication: generateWebApplicationStructuredData,
  article: generateArticleStructuredData,
  organization: generateOrganizationStructuredData,
  webSite: generateWebSiteStructuredData,
  webPage: generateWebPageStructuredData,
  breadcrumbs: generateBreadcrumbStructuredData,
  faqPage: generateFAQPageStructuredData,
  howTo: generateHowToStructuredData,
  aggregateRating: generateAggregateRatingStructuredData,
  review: generateReviewStructuredData,
  softwareAppReviews: generateSoftwareAppReviewStructuredData,
  render: renderJsonLd,
};

