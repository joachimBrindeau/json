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

/**
 * JSON value types
 */
export type JsonPrimitive = string | number | boolean | null;
export type JsonArray = JsonValue[];
export type JsonObject = { [key: string]: JsonValue };
export type JsonValue = JsonPrimitive | JsonArray | JsonObject;

/**
 * User account information
 */
export interface UserAccount {
  id: string;
  provider: string;
  providerAccountId: string;
  type: string;
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
  token_type?: string;
  scope?: string;
  id_token?: string;
  session_state?: string;
}

/**
 * User accounts response
 */
export interface UserAccountsResponse extends ApiResponse {
  accounts: UserAccount[];
  hasPassword: boolean;
}

/**
 * Analytics event parameters
 */
export interface AnalyticsEventParams {
  event_category?: string;
  event_label?: string;
  value?: number;
  [key: string]: string | number | boolean | undefined;
}

/**
 * Form data types for modals
 */
export interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignupFormData {
  email: string;
  password: string;
  confirmPassword: string;
  name?: string;
}

export interface ShareFormData {
  visibility: 'private' | 'public';
  expiresAt?: string;
  allowComments?: boolean;
}

export interface PublishFormData {
  title: string;
  description?: string;
  tags?: string[];
  category?: string;
  visibility: 'private' | 'public';
}

/**
 * Export format options
 */
export type ExportFormat = 'json' | 'csv' | 'yaml' | 'xml';

export interface ExportOptions {
  format: ExportFormat;
  filename?: string;
  pretty?: boolean;
  includeMetadata?: boolean;
}

/**
 * Convert page input/output formats
 */
export type InputFormat = 'json' | 'yaml' | 'xml' | 'csv' | 'toml' | 'properties' | 'js';
export type OutputFormat = 'json' | 'yaml' | 'xml' | 'csv' | 'toml' | 'properties' | 'typescript' | 'javascript';

/**
 * Monaco editor change event
 */
export interface MonacoChangeEvent {
  changes: Array<{
    range: {
      startLineNumber: number;
      startColumn: number;
      endLineNumber: number;
      endColumn: number;
    };
    rangeLength: number;
    text: string;
  }>;
}

/**
 * JSON processing result
 */
export interface JsonProcessingResult {
  success: boolean;
  data?: JsonValue;
  error?: string;
  stats?: {
    size: number;
    nodeCount: number;
    maxDepth: number;
  };
}

/**
 * Debounced function type
 */
export type DebouncedFunction<T extends (...args: unknown[]) => unknown> = {
  (...args: Parameters<T>): void;
  cancel: () => void;
};
