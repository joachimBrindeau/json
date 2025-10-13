/**
 * Prisma error handling utilities
 * Maps Prisma-specific errors to AppError instances
 */

import {
  AppError,
  DatabaseError,
  ConflictError,
  NotFoundError,
  ValidationError,
  ErrorCode,
} from '@/lib/utils/app-errors';
import { Prisma } from '@prisma/client';

/**
 * Prisma error code mapping
 * Reference: https://www.prisma.io/docs/reference/api-reference/error-reference
 */
const PRISMA_ERROR_CODES = {
  // Common errors
  P2000: 'Value too long for column',
  P2001: 'Record not found',
  P2002: 'Unique constraint violation',
  P2003: 'Foreign key constraint violation',
  P2004: 'Database constraint violation',
  P2005: 'Invalid value for field type',
  P2006: 'Invalid value provided',
  P2007: 'Data validation error',
  P2008: 'Failed to parse query',
  P2009: 'Failed to validate query',
  P2010: 'Raw query failed',
  P2011: 'Null constraint violation',
  P2012: 'Missing required value',
  P2013: 'Missing required argument',
  P2014: 'Required relation violation',
  P2015: 'Related record not found',
  P2016: 'Query interpretation error',
  P2017: 'Records not connected',
  P2018: 'Required connected records not found',
  P2019: 'Input error',
  P2020: 'Value out of range',
  P2021: 'Table does not exist',
  P2022: 'Column does not exist',
  P2023: 'Inconsistent column data',
  P2024: 'Connection pool timeout',
  P2025: 'Record not found for operation',
  P2026: 'Unsupported database feature',
  P2027: 'Multiple errors on database',
  P2028: 'Transaction API error',
  P2030: 'Fulltext index not found',
  P2033: 'Number out of range',
  P2034: 'Transaction conflict',
} as const;

/**
 * Type guard to check if error is Prisma error
 */
export function isPrismaError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError ||
    error instanceof Prisma.PrismaClientUnknownRequestError ||
    error instanceof Prisma.PrismaClientRustPanicError ||
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientValidationError
  );
}

/**
 * Extract field name from Prisma meta information
 */
function extractFieldName(meta?: Record<string, unknown>): string | undefined {
  if (!meta) return undefined;

  // Handle target field (unique/foreign key violations)
  if (meta.target && Array.isArray(meta.target)) {
    return meta.target.join(', ');
  }

  // Handle field_name (general field errors)
  if (typeof meta.field_name === 'string') {
    return meta.field_name;
  }

  // Handle column name
  if (typeof meta.column === 'string') {
    return meta.column;
  }

  return undefined;
}

/**
 * Extract model name from Prisma meta information
 */
function extractModelName(meta?: Record<string, unknown>): string | undefined {
  if (!meta) return undefined;

  if (typeof meta.model_name === 'string') {
    return meta.model_name;
  }

  if (typeof meta.table === 'string') {
    return meta.table;
  }

  return undefined;
}

/**
 * Maps Prisma errors to AppError instances
 */
export function mapPrismaError(error: unknown): AppError {
  // Return AppError as-is
  if (error instanceof AppError) {
    return error;
  }

  // Handle Prisma validation errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    return new ValidationError('Invalid data provided to database', undefined, {
      prismaError: error.message,
    });
  }

  // Handle Prisma initialization errors
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return new DatabaseError('Database connection failed', error, {
      errorCode: error.errorCode,
    });
  }

  // Handle Prisma rust panic errors
  if (error instanceof Prisma.PrismaClientRustPanicError) {
    return new DatabaseError('Database engine error', error, {
      errorCode: ErrorCode.DATABASE_ERROR,
    });
  }

  // Handle known Prisma request errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const code = error.code;
    const meta = error.meta;
    const message = PRISMA_ERROR_CODES[code as keyof typeof PRISMA_ERROR_CODES] || error.message;

    switch (code) {
      // Record not found errors
      case 'P2001':
      case 'P2015':
      case 'P2018':
      case 'P2025': {
        const modelName = extractModelName(meta) || 'Record';
        return new NotFoundError(modelName, undefined, {
          prismaCode: code,
          prismaMessage: message,
          meta,
        });
      }

      // Unique constraint violations
      case 'P2002': {
        const fieldName = extractFieldName(meta) || 'field';
        const modelName = extractModelName(meta) || 'Resource';
        return new ConflictError(`${modelName} with this ${fieldName} already exists`, {
          prismaCode: code,
          prismaMessage: message,
          field: fieldName,
          meta,
        });
      }

      // Foreign key constraint violations
      case 'P2003':
      case 'P2014':
      case 'P2017': {
        const fieldName = extractFieldName(meta);
        return new ValidationError(
          `Invalid reference: ${fieldName ? `field '${fieldName}'` : 'related record not found'}`,
          fieldName ? [{ field: fieldName, message: 'Related record does not exist' }] : undefined,
          {
            prismaCode: code,
            prismaMessage: message,
            meta,
          }
        );
      }

      // Null constraint violations
      case 'P2011':
      case 'P2012': {
        const fieldName = extractFieldName(meta);
        return new ValidationError(
          `Required field missing: ${fieldName || 'unknown field'}`,
          fieldName ? [{ field: fieldName, message: 'This field is required' }] : undefined,
          {
            prismaCode: code,
            prismaMessage: message,
            meta,
          }
        );
      }

      // Value validation errors
      case 'P2000':
      case 'P2005':
      case 'P2006':
      case 'P2007':
      case 'P2019':
      case 'P2020':
      case 'P2033': {
        const fieldName = extractFieldName(meta);
        return new ValidationError(
          message,
          fieldName ? [{ field: fieldName, message }] : undefined,
          {
            prismaCode: code,
            prismaMessage: message,
            meta,
          }
        );
      }

      // Connection and timeout errors
      case 'P2024': {
        return new DatabaseError('Database connection timeout', error, {
          prismaCode: code,
          prismaMessage: message,
          errorCode: ErrorCode.QUERY_TIMEOUT,
        });
      }

      // Transaction conflicts
      case 'P2034': {
        return new DatabaseError('Transaction conflict - please retry', error, {
          prismaCode: code,
          prismaMessage: message,
          retryable: true,
        });
      }

      // Generic database constraint violations
      case 'P2004':
      case 'P2023':
      case 'P2027': {
        return new DatabaseError(message, error, {
          prismaCode: code,
          meta,
        });
      }

      // All other known errors
      default: {
        return new DatabaseError(message || 'Database operation failed', error, {
          prismaCode: code,
          prismaMessage: message,
          meta,
        });
      }
    }
  }

  // Handle unknown Prisma errors
  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    return new DatabaseError('Unknown database error', error, {
      errorCode: ErrorCode.DATABASE_ERROR,
    });
  }

  // Handle generic errors
  if (error instanceof Error) {
    return new DatabaseError(error.message, error);
  }

  // Fallback for unknown error types
  return new DatabaseError('An unknown database error occurred', undefined, {
    error: String(error),
  });
}

/**
 * Wrapper for Prisma operations that automatically maps errors
 * @example
 * const user = await withPrismaErrorHandling(() =>
 *   prisma.user.findUniqueOrThrow({ where: { id } })
 * );
 */
export async function withPrismaErrorHandling<T>(
  operation: () => Promise<T>
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw mapPrismaError(error);
  }
}

/**
 * Type-safe Prisma query wrapper with automatic error mapping
 * Useful for maintaining type safety while handling errors
 * @example
 * const users = await safePrismaQuery(
 *   prisma.user.findMany({ where: { active: true } })
 * );
 */
export async function safePrismaQuery<T>(query: Promise<T>): Promise<T> {
  try {
    return await query;
  } catch (error) {
    throw mapPrismaError(error);
  }
}
