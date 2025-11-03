/**
 * Standardized application error classes
 * Provides consistent error handling across the application
 */

import { NextResponse } from 'next/server';
import * as responses from '@/lib/api/responses';

export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',

  // Resource Errors
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  RESOURCE_DELETED = 'RESOURCE_DELETED',

  // Validation Errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  INVALID_JSON = 'INVALID_JSON',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',

  // Rate Limiting & Quotas
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',

  // Database Errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  DATABASE_CONNECTION_ERROR = 'DATABASE_CONNECTION_ERROR',
  QUERY_TIMEOUT = 'QUERY_TIMEOUT',

  // External Service Errors
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',

  // General
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface ErrorMetadata {
  [key: string]: unknown;
}

/**
 * Base application error class
 */
export class AppError extends Error {
  public readonly isOperational: boolean;

  constructor(
    message: string,
    public readonly code: ErrorCode,
    public readonly statusCode: number = 500,
    public readonly metadata?: ErrorMetadata,
    isOperational = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      metadata: this.metadata,
      stack: process.env.NODE_ENV === 'development' ? this.stack : undefined,
    };
  }

  /**
   * Converts AppError to NextResponse using standardized response helpers
   */
  toResponse(): NextResponse {
    const baseOptions = {
      code: this.code,
      details: this.metadata ? JSON.stringify(this.metadata, null, 2) : undefined,
      metadata: this.metadata,
    };

    // Map status codes to appropriate response helpers
    switch (this.statusCode) {
      case 400:
        return responses.badRequest(this.message, baseOptions);

      case 401:
        return responses.unauthorized(this.message, baseOptions);

      case 403:
        return responses.forbidden(this.message, baseOptions);

      case 404:
        return responses.notFound(this.message, baseOptions);

      case 409:
        return responses.conflict(this.message, baseOptions);

      case 413:
        return responses.error(this.message, {
          ...baseOptions,
          status: 413,
        });

      case 422:
        return responses.unprocessableEntity(this.message, baseOptions);

      case 429: {
        const retryAfter = this.metadata?.retryAfter as number | undefined;
        return responses.tooManyRequests(this.message, {
          ...baseOptions,
          retryAfter,
        });
      }

      case 500:
        return responses.internalServerError(this.message, baseOptions);

      case 502:
        return responses.error(this.message, {
          ...baseOptions,
          status: 502,
        });

      case 503: {
        const retryAfter = this.metadata?.retryAfter as number | undefined;
        return responses.serviceUnavailable(this.message, {
          ...baseOptions,
          retryAfter,
        });
      }

      default:
        return responses.error(this.message, {
          ...baseOptions,
          status: this.statusCode,
        });
    }
  }
}

/**
 * Authentication error (401)
 */
export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required', metadata?: ErrorMetadata) {
    super(message, ErrorCode.UNAUTHORIZED, 401, metadata);
  }
}

/**
 * Authorization error (403)
 */
export class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions', metadata?: ErrorMetadata) {
    super(message, ErrorCode.FORBIDDEN, 403, metadata);
  }
}

/**
 * Resource not found error (404)
 */
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string, metadata?: ErrorMetadata) {
    const message = id ? `${resource} with id '${id}' not found` : `${resource} not found`;
    super(message, ErrorCode.NOT_FOUND, 404, { resource, id, ...metadata });
  }
}

/**
 * Resource already exists error (409)
 */
export class ConflictError extends AppError {
  constructor(message = 'Resource already exists', metadata?: ErrorMetadata) {
    super(message, ErrorCode.ALREADY_EXISTS, 409, metadata);
  }
}

/**
 * Validation error (400)
 */
export class ValidationError extends AppError {
  constructor(
    message: string,
    public readonly validationErrors?: Array<{ field: string; message: string }>,
    metadata?: ErrorMetadata
  ) {
    super(message, ErrorCode.VALIDATION_ERROR, 400, {
      validationErrors,
      ...metadata,
    });
  }
}

/**
 * Rate limit exceeded error (429)
 */
export class RateLimitError extends AppError {
  constructor(
    public readonly retryAfter?: number,
    message = 'Rate limit exceeded',
    metadata?: ErrorMetadata
  ) {
    super(message, ErrorCode.RATE_LIMIT_EXCEEDED, 429, {
      retryAfter,
      ...metadata,
    });
  }
}

/**
 * Database error (500)
 */
export class DatabaseError extends AppError {
  constructor(message: string, originalError?: Error, metadata?: ErrorMetadata) {
    super(message, ErrorCode.DATABASE_ERROR, 500, {
      originalError: originalError?.message,
      ...metadata,
    });
  }
}

/**
 * External service error (502)
 */
export class ExternalServiceError extends AppError {
  constructor(service: string, message?: string, metadata?: ErrorMetadata) {
    super(message || `External service '${service}' error`, ErrorCode.EXTERNAL_SERVICE_ERROR, 502, {
      service,
      ...metadata,
    });
  }
}

/**
 * Invalid JSON error (400)
 */
export class InvalidJsonError extends AppError {
  constructor(details?: string, metadata?: ErrorMetadata) {
    super('Invalid JSON format', ErrorCode.INVALID_JSON, 400, {
      validationErrors: details ? [{ field: 'content', message: details }] : undefined,
      ...metadata,
    });
  }
}

/**
 * File too large error (413)
 */
export class FileTooLargeError extends AppError {
  constructor(
    public readonly maxSize: number,
    public readonly actualSize: number,
    metadata?: ErrorMetadata
  ) {
    super(
      `File size (${actualSize} bytes) exceeds maximum allowed size (${maxSize} bytes)`,
      ErrorCode.FILE_TOO_LARGE,
      413,
      { maxSize, actualSize, ...metadata }
    );
  }
}

/**
 * Type guard to check if error is operational
 */
export function isOperationalError(error: Error): boolean {
  return error instanceof AppError && error.isOperational;
}

/**
 * Converts unknown errors to AppError
 */
export function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(
      error.message,
      ErrorCode.INTERNAL_ERROR,
      500,
      { originalError: error.name },
      false
    );
  }

  return new AppError(
    'An unknown error occurred',
    ErrorCode.UNKNOWN_ERROR,
    500,
    { error: String(error) },
    false
  );
}
