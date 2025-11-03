/**
 * Centralized exports for API utilities
 * Import everything you need from '@/lib/api'
 */

// Core utilities
export * from './utils';
export * from './validators';
export * from './responses';

// Re-export commonly used utilities with shorter names for convenience
export {
  // Authentication
  withAuth,

  // Validation
  validateRequest,

  // Error handling
  handleApiError,

  // Rate limiting
  withRateLimit,

  // CORS
  withCors,

  // Middleware composition
  composeMiddleware,

  // Utility functions
  parsePaginationParams,
  validateSortParam,
  sanitizeString,
  getClientIp,
  hashSensitiveData,
} from './utils';

export {
  // Success responses
  success,
  created,
  accepted,
  noContent,

  // Error responses
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  unprocessableEntity,
  tooManyRequests,
  internalServerError,
  serviceUnavailable,

  // Pagination
  paginated,

  // Streaming
  stream,
  jsonStream,
  download,
  serverSentEvents,

  // CORS
  corsOptions,

  // Health checks
  healthCheck,

  // Utilities
  withCommonHeaders,
  formatSSEData,
} from './responses';

export {
  // Common field validators
  shareIdSchema,
  documentIdSchema,
  userIdSchema,
  titleSchema,
  descriptionSchema,
  tagSchema,
  emailSchema,
  passwordSchema,

  // Pagination and search
  paginationSchema,
  searchQuerySchema,
  sortFieldSchema,

  // JSON validation
  jsonContentSchema,
  jsonMetadataSchema,

  // Request schemas
  jsonUploadRequestSchema,
  jsonDocumentUpdateSchema,
  jsonDocumentCreateSchema,
  libraryQuerySchema,
  publicLibraryQuerySchema,

  // Authentication schemas
  userRegistrationSchema,
  userLoginSchema,
  passwordResetRequestSchema,
  passwordResetSchema,

  // File validation
  fileUploadSchema,
  fileValidationSchema,

  // Analytics
  analyticsQuerySchema,
  tagAnalyticsSchema,

  // Embedding and sharing
  embedConfigSchema,
  shareSettingsSchema,

  // Advanced features
  jsonAnalysisOptionsSchema,
  streamingOptionsSchema,
  healthCheckSchema,

  // Utility validators
  genericIdSchema,
  urlSchema,
  jsonPathSchema,
  isoDateSchema,
  hexColorSchema,
  semverSchema,

  // Route parameters
  routeParamsSchema,
  optionalRouteParamsSchema,

  // Webhooks
  extensionSubmissionSchema,

  // Zod exports
  zod,
  type ZodSchema,
  type ZodError,
} from './validators';

// Type exports from responses
export type {
  ApiSuccessResponse,
  ApiErrorResponse,
  ApiResponse,
  PaginatedResponse,
  StreamResponse,
  DownloadResponse,
} from './responses';

// Type exports from utils
export type { ApiError, PaginationParams, ValidationResult } from './utils';
