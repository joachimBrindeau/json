import { z } from 'zod';

/**
 * Common field validators
 */

// Share ID validation (nanoid format)
export const shareIdSchema = z
  .string()
  .min(1, 'Share ID is required')
  .max(50, 'Share ID is too long')
  .regex(/^[A-Za-z0-9_-]+$/, 'Share ID contains invalid characters');

// Document ID validation (UUID or custom ID)
export const documentIdSchema = z
  .string()
  .min(1, 'Document ID is required')
  .max(50, 'Document ID is too long');

// User ID validation
export const userIdSchema = z
  .string()
  .min(1, 'User ID is required')
  .max(50, 'User ID is too long');

// Title validation
export const titleSchema = z
  .string()
  .min(1, 'Title is required')
  .max(200, 'Title is too long')
  .trim();

// Description validation
export const descriptionSchema = z
  .string()
  .max(1000, 'Description is too long')
  .trim()
  .optional();

// Tag validation
export const tagSchema = z
  .string()
  .min(1, 'Tag cannot be empty')
  .max(50, 'Tag is too long')
  .regex(/^[a-zA-Z0-9-_\s]+$/, 'Tag contains invalid characters')
  .transform(tag => tag.trim().toLowerCase());

// Email validation
export const emailSchema = z
  .string()
  .email('Invalid email format')
  .min(1, 'Email is required')
  .max(100, 'Email is too long')
  .transform(email => email.toLowerCase().trim());

// Password validation
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password is too long')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain at least one lowercase letter, uppercase letter, and number'
  );

/**
 * Pagination validators
 */
export const paginationSchema = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1, 'Page must be at least 1')
    .max(10000, 'Page number is too high')
    .default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(20),
});

/**
 * Search and filter validators
 */
export const searchQuerySchema = z
  .string()
  .max(100, 'Search query is too long')
  .trim()
  .optional()
  .transform(query => query || undefined);

export const sortFieldSchema = z.enum([
  'recent',
  'title',
  'size',
  'updated',
  'created',
  'popularity'
]);

/**
 * JSON-specific validators
 */

// JSON content validation (checks for valid JSON structure)
export const jsonContentSchema = z
  .unknown()
  .refine(
    (data) => {
      try {
        if (typeof data === 'string') {
          JSON.parse(data);
        }
        return true;
      } catch {
        return false;
      }
    },
    { message: 'Invalid JSON format' }
  );

// File upload validation
export const fileUploadSchema = z.object({
  file: z.any().refine(
    (file) => file instanceof File,
    { message: 'Invalid file' }
  ),
  title: titleSchema.optional(),
});

// JSON document metadata validation
export const jsonMetadataSchema = z.object({
  originalFilename: z.string().optional(),
  uploadedAt: z.string().datetime().optional(),
  largeArrays: z.array(z.object({
    path: z.string(),
    length: z.number(),
  })).optional(),
  deepObjects: z.array(z.object({
    path: z.string(),
    depth: z.number(),
  })).optional(),
  paths: z.array(z.string()).optional(),
});

/**
 * API Request validators
 */

// JSON upload request
export const jsonUploadRequestSchema = z.object({
  file: z.any().refine(
    (file) => file instanceof File,
    { message: 'File is required' }
  ),
  title: titleSchema.optional(),
  description: descriptionSchema,
  tags: z.array(tagSchema).max(10, 'Too many tags').optional(),
  visibility: z.enum(['private', 'public']).default('private'),
});

// JSON document update request
export const jsonDocumentUpdateSchema = z.object({
  title: titleSchema.optional(),
  description: descriptionSchema,
  tags: z.array(tagSchema).max(10, 'Too many tags').optional(),
  visibility: z.enum(['private', 'public']).optional(),
});

// JSON document creation request
export const jsonDocumentCreateSchema = z.object({
  title: titleSchema,
  content: jsonContentSchema,
  description: descriptionSchema,
  tags: z.array(tagSchema).max(10, 'Too many tags').optional(),
  visibility: z.enum(['private', 'public']).default('private'),
});

// Library query request
export const libraryQuerySchema = z.object({
  search: searchQuerySchema,
  sort: sortFieldSchema.default('recent'),
  tags: z
    .string()
    .transform((tags) => 
      tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : []
    )
    .pipe(z.array(tagSchema))
    .optional(),
  visibility: z.enum(['private', 'public', 'all']).default('private'),
  ...paginationSchema.shape,
});

// Public library query (more restrictive)
export const publicLibraryQuerySchema = libraryQuerySchema.extend({
  visibility: z.literal('public'),
});

/**
 * Authentication validators
 */

// User registration
export const userRegistrationSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name is too long')
    .trim(),
});

// User login
export const userLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

// Password reset request
export const passwordResetRequestSchema = z.object({
  email: emailSchema,
});

// Password reset confirmation
export const passwordResetSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: passwordSchema,
});

/**
 * Analytics validators
 */

// Analytics query
export const analyticsQuerySchema = z.object({
  documentId: documentIdSchema.optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  groupBy: z.enum(['day', 'week', 'month']).default('day'),
  ...paginationSchema.shape,
});

// Tag analytics
export const tagAnalyticsSchema = z.object({
  tag: tagSchema.optional(),
  period: z.enum(['7d', '30d', '90d', '1y']).default('30d'),
  ...paginationSchema.shape,
});

/**
 * Embedding and sharing validators
 */

// Embed configuration
export const embedConfigSchema = z.object({
  theme: z.enum(['light', 'dark', 'auto']).default('light'),
  showToolbar: z.boolean().default(true),
  showLineNumbers: z.boolean().default(true),
  readOnly: z.boolean().default(true),
  height: z.number().min(200).max(2000).default(400),
  width: z.number().min(300).max(2000).optional(),
});

// Share settings
export const shareSettingsSchema = z.object({
  shareId: shareIdSchema,
  expiresAt: z.string().datetime().optional(),
  passwordProtected: z.boolean().default(false),
  password: z.string().min(4, 'Password too short').optional(),
  allowDownload: z.boolean().default(true),
  allowCopy: z.boolean().default(true),
});

/**
 * API route parameter validators
 */

// Route parameters for [id] routes
export const routeParamsSchema = z.object({
  id: z.string().min(1, 'ID parameter is required'),
});

// Dynamic route parameters with optional fields
export const optionalRouteParamsSchema = z.object({
  id: z.string().optional(),
  slug: z.string().optional(),
});

/**
 * Webhook validators
 */

// Extension submission webhook
export const extensionSubmissionSchema = z.object({
  url: z.string().url('Invalid URL'),
  title: titleSchema,
  description: descriptionSchema,
  tags: z.array(tagSchema).max(5, 'Too many tags'),
  submitterEmail: emailSchema.optional(),
});

/**
 * Advanced JSON processing validators
 */

// JSON analysis options
export const jsonAnalysisOptionsSchema = z.object({
  maxChunkSize: z.number().min(1024).max(10 * 1024 * 1024).default(1024 * 1024), // 1MB default
  trackPaths: z.boolean().default(true),
  findLargeArrays: z.boolean().default(true),
  maxDepthAnalysis: z.number().min(1).max(100).default(50),
  timeout: z.number().min(1000).max(60000).default(30000), // 30s default
});

// Streaming options
export const streamingOptionsSchema = z.object({
  chunkSize: z.number().min(1024).max(1024 * 1024).default(64 * 1024), // 64KB
  compression: z.enum(['none', 'gzip', 'deflate']).default('gzip'),
  format: z.enum(['json', 'jsonl', 'csv']).default('json'),
});

/**
 * Health check validators
 */

// Health check response
export const healthCheckSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  timestamp: z.string().datetime(),
  version: z.string(),
  services: z.object({
    database: z.enum(['up', 'down']),
    redis: z.enum(['up', 'down']).optional(),
    storage: z.enum(['up', 'down']).optional(),
  }),
});

/**
 * Export validators for common validation patterns
 */

// Generic ID validator that accepts multiple formats
export const genericIdSchema = z.union([
  shareIdSchema,
  documentIdSchema,
  userIdSchema,
]);

// File size and type validation
export const fileValidationSchema = z.object({
  size: z.number().max(2 * 1024 * 1024 * 1024, 'File too large (max 2GB)'), // 2GB max
  type: z.enum(['application/json', 'text/plain', 'text/json']),
  name: z.string().max(255, 'Filename too long'),
});

// URL validation for external resources
export const urlSchema = z
  .string()
  .url('Invalid URL format')
  .max(2000, 'URL too long')
  .refine(
    (url) => {
      try {
        const parsed = new URL(url);
        return ['http:', 'https:'].includes(parsed.protocol);
      } catch {
        return false;
      }
    },
    { message: 'Only HTTP and HTTPS URLs are allowed' }
  );

/**
 * Validation helper functions
 */

// Validates that a string is a valid JSON path
export const jsonPathSchema = z
  .string()
  .refine(
    (path) => {
      // Basic JSON path validation (can be extended)
      return /^(\$\.?|\$\[|\.)[\w\[\]\.'"$-]*$/.test(path) || path === '$';
    },
    { message: 'Invalid JSON path format' }
  );

// Validates ISO date strings
export const isoDateSchema = z
  .string()
  .refine(
    (date) => {
      return !isNaN(Date.parse(date));
    },
    { message: 'Invalid date format' }
  );

// Validates hex color codes
export const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color format');

// Validates semantic version strings
export const semverSchema = z
  .string()
  .regex(/^\d+\.\d+\.\d+(-[a-zA-Z0-9-]+)?(\+[a-zA-Z0-9-]+)?$/, 'Invalid semantic version format');

export {
  z as zod,
  type ZodSchema,
  type ZodError,
} from 'zod';