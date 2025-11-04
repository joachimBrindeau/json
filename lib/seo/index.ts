import { Metadata } from 'next';
import { DEFAULT_SEO_CONFIG, PAGE_SEO } from './constants';
import { getCanonicalUrl, getOgImageUrl } from './url-utils';
import type { SEOMetadataInput } from './types';

type SEOProps = SEOMetadataInput;

/**
 * Centralized SEO functions and exports
 * Re-exports from organized modules for backward compatibility
 */

// Re-export constants
export { DEFAULT_SEO_CONFIG, PAGE_SEO } from './constants';

// Re-export types
export type {
  PageKey,
  SEOMetadataInput,
  SEOSettingsInput,
  Review,
  AggregateRating,
  ReviewStructuredDataInput,
  ReviewRating,
} from './types';

// Re-export structured data functions
export {
  generateArticleStructuredData,
  generateWebApplicationStructuredData,
  generateOrganizationStructuredData,
  generateBreadcrumbStructuredData,
  generateFAQPageStructuredData,
  generateAggregateRatingStructuredData,
  generateReviewStructuredData,
  generateSoftwareAppReviewStructuredData,
  renderJsonLd,
  StructuredDataGenerator,
} from './structured-data';

// Re-export review functions
export {
  getApplicationReviews,
  calculateAggregateRating,
  validateReview,
  validateAllReviews,
  APPLICATION_REVIEWS,
} from './reviews';

// Re-export review components
export { ReviewsBadge } from '@/components/shared/seo/ReviewsBadge';
export { ReviewsSnippet } from '@/components/shared/seo/ReviewsSnippet';
export { ReviewsDisplay } from '@/components/shared/seo/ReviewsDisplay';

// Re-export validation
export { validateSEOSettings, SEO_VALIDATION_RULES } from './validation';

// Re-export URL utilities
export { getCanonicalUrl, getOgImageUrl } from './url-utils';

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
  author,
}: SEOMetadataInput = {}): Metadata {
  const fullTitle = title
    ? `${title} | ${DEFAULT_SEO_CONFIG.siteName}`
    : DEFAULT_SEO_CONFIG.defaultTitle;
  const fullDescription = description || DEFAULT_SEO_CONFIG.defaultDescription;
  const fullKeywords: string[] = [...DEFAULT_SEO_CONFIG.keywords, ...(keywords || [])];
  // Use centralized URL utility for canonical URLs and OG images
  const fullCanonicalUrl = canonicalUrl || DEFAULT_SEO_CONFIG.siteUrl;
  const fullOgImage = getOgImageUrl(ogImage);

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
        rating: 'general',
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
 * Legacy structured data templates for backward compatibility
 * @deprecated Use StructuredDataGenerator from './structured-data' instead
 */
import {
  generateOrganizationStructuredData,
  generateBreadcrumbStructuredData,
  generateFAQPageStructuredData,
} from './structured-data';

export const STRUCTURED_DATA_TEMPLATES = {
  organization: generateOrganizationStructuredData(),
  breadcrumbs: generateBreadcrumbStructuredData,
  faqPage: generateFAQPageStructuredData,
};
