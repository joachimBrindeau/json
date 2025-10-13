/**
 * Centralized type definitions for API requests and responses
 */

import { ErrorCode } from '@/lib/utils/app-errors';

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string;
  timestamp?: string;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationMeta;
}

/**
 * Error response
 */
export interface ErrorResponse {
  success: false;
  error: string;
  code?: ErrorCode;
  details?: string;
  validationErrors?: Array<{
    field: string;
    message: string;
  }>;
  timestamp: string;
}

/**
 * Document metadata
 */
export interface DocumentMetadata {
  id: string;
  shareId: string;
  title?: string;
  description?: string;
  tags?: string[];
  category?: string;
  size: number;
  nodeCount: number;
  maxDepth: number;
  complexity: 'Low' | 'Medium' | 'High';
  visibility: 'private' | 'public';
  viewCount: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Document with content
 */
export interface Document extends DocumentMetadata {
  content: unknown;
}

/**
 * User profile
 */
export interface UserProfile {
  id: string;
  name?: string;
  email?: string;
  image?: string;
  emailVerified?: boolean;
  createdAt: string;
}

/**
 * Document with author
 */
export interface PublicDocument extends DocumentMetadata {
  author?: {
    name?: string;
    image?: string;
  };
  preview?: string;
  richContent?: string;
}

/**
 * Upload response
 */
export interface UploadResponse extends ApiResponse {
  document: DocumentMetadata;
}

/**
 * Analysis response
 */
export interface AnalysisResponse extends ApiResponse {
  analysis: {
    size: number;
    nodeCount: number;
    maxDepth: number;
    complexity: 'Low' | 'Medium' | 'High';
    keys?: string[];
    types?: Record<string, number>;
  };
}

/**
 * Share response
 */
export interface ShareResponse extends ApiResponse {
  shareId: string;
  url: string;
}

/**
 * Library query parameters
 */
export interface LibraryQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  tags?: string[];
  category?: string;
  sort?: 'recent' | 'popular' | 'title' | 'size';
  visibility?: 'private' | 'public';
}

/**
 * System stats
 */
export interface SystemStats {
  database: {
    status: 'connected' | 'disconnected';
    totalDocuments: number;
    totalUsers: number;
    storageUsed: number;
  };
  cache?: {
    status: 'connected' | 'disconnected';
    hitRate?: number;
  };
  performance: {
    avgResponseTime: number;
    requestsPerMinute: number;
  };
}

/**
 * Tag analytics
 */
export interface TagAnalytics {
  tag: string;
  count: number;
  percentage: number;
  trend: 'rising' | 'falling' | 'stable';
  recentUsage: number;
}

/**
 * User stats for admin
 */
export interface UserStats {
  id: string;
  name?: string;
  email?: string;
  emailVerified: boolean;
  documentsCount: number;
  storageUsed: number;
  lastLogin?: string;
  createdAt: string;
}

/**
 * SEO metadata
 */
export interface SeoMetadata {
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
  canonicalUrl?: string;
}

/**
 * Request validation result
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}
