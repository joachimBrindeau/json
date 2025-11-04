import { DEFAULT_SEO_CONFIG } from './constants';
import type {
  ArticleStructuredDataInput,
  BreadcrumbItem,
  FAQItem,
  WebApplicationStructuredDataInput,
  ReviewStructuredDataInput,
  AggregateRating,
  Review,
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
    logo: `${DEFAULT_SEO_CONFIG.siteUrl}/logo.png`,
    sameAs: ['https://twitter.com/jsonviewer', 'https://github.com/jsonviewer'],
  };
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
  breadcrumbs: generateBreadcrumbStructuredData,
  faqPage: generateFAQPageStructuredData,
  aggregateRating: generateAggregateRatingStructuredData,
  review: generateReviewStructuredData,
  softwareAppReviews: generateSoftwareAppReviewStructuredData,
  render: renderJsonLd,
};

