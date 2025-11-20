import type { PAGE_SEO } from './constants';

/**
 * Type definitions for SEO infrastructure
 */

export type PageKey = keyof typeof PAGE_SEO;

export interface SEOMetadataInput {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  ogType?: 'website' | 'article';
  canonicalUrl?: string;
  noIndex?: boolean;
  publishedAt?: string;
  modifiedAt?: string;
  author?: string;
  richContent?: string;
  articleTags?: string[];
  articleSection?: string;
}

export interface DatabaseSEOSettings {
  id: string;
  pageKey: string;
  title: string;
  description: string;
  keywords: string[];
  ogImage?: string | null;
  isActive: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SEOSettingsInput {
  title: string;
  description: string;
  keywords: string[];
  ogImage?: string;
  isActive?: boolean;
  priority?: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface ArticleStructuredDataInput {
  title: string;
  description?: string;
  url: string;
  publishedAt?: string;
  author?: string;
  richContent?: string;
}

export interface WebApplicationStructuredDataInput {
  name?: string;
  description?: string;
  url?: string;
  featureList?: string[];
  applicationCategory?: string;
}

/**
 * Review types for structured data
 * Following schema.org Review specification
 */
export interface ReviewRating {
  ratingValue: number; // 1-5
  bestRating?: number; // Default: 5
  worstRating?: number; // Default: 1
}

export interface Review {
  author: {
    name: string;
    url?: string;
  };
  reviewRating: ReviewRating;
  reviewBody: string;
  datePublished: string; // ISO 8601 date
}

export interface AggregateRating {
  ratingValue: number; // Average rating (1-5)
  reviewCount: number; // Total number of reviews
  bestRating?: number; // Default: 5
  worstRating?: number; // Default: 1
}

export interface ReviewStructuredDataInput {
  aggregateRating: AggregateRating;
  reviews: Review[];
}

/**
 * HowTo types for structured data
 * Following schema.org HowTo specification
 */
export interface HowToStep {
  name: string;
  text: string;
  image?: string;
  url?: string;
}

export interface HowToInput {
  name: string;
  description: string;
  image?: string;
  totalTime?: string; // ISO 8601 duration (e.g., "PT15M")
  steps: HowToStep[];
  supply?: Array<{ name: string }>;
  tool?: Array<{ name: string }>;
}
