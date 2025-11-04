import { SEO_LIMITS } from './constants';
import type { SEOSettingsInput, ValidationResult } from './types';

/**
 * SEO validation rules and functions
 */

export const SEO_VALIDATION_RULES = {
  title: {
    maxLength: SEO_LIMITS.TITLE_MAX_LENGTH,
    required: true,
  },
  description: {
    maxLength: SEO_LIMITS.DESCRIPTION_MAX_LENGTH,
    required: true,
  },
  keywords: {
    maxCount: SEO_LIMITS.KEYWORDS_MAX_COUNT,
    required: false,
  },
} as const;

/**
 * Validate SEO settings input
 */
export function validateSEOSettings(data: SEOSettingsInput): ValidationResult {
  const errors: string[] = [];

  // Title validation
  if (!data.title || data.title.trim().length === 0) {
    errors.push('Title is required');
  } else if (data.title.length > SEO_VALIDATION_RULES.title.maxLength) {
    errors.push(
      `Title must be ${SEO_VALIDATION_RULES.title.maxLength} characters or less (current: ${data.title.length})`
    );
  }

  // Description validation
  if (!data.description || data.description.trim().length === 0) {
    errors.push('Description is required');
  } else if (data.description.length > SEO_VALIDATION_RULES.description.maxLength) {
    errors.push(
      `Description must be ${SEO_VALIDATION_RULES.description.maxLength} characters or less (current: ${data.description.length})`
    );
  }

  // Keywords validation
  if (data.keywords && data.keywords.length > SEO_VALIDATION_RULES.keywords.maxCount) {
    errors.push(
      `Maximum ${SEO_VALIDATION_RULES.keywords.maxCount} keywords allowed (current: ${data.keywords.length})`
    );
  }

  // Validate keyword format
  if (data.keywords) {
    const invalidKeywords = data.keywords.filter(
      (keyword) => !keyword || keyword.trim().length === 0
    );
    if (invalidKeywords.length > 0) {
      errors.push('Keywords cannot be empty');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate page key
 */
export function validatePageKey(pageKey: string): boolean {
  return typeof pageKey === 'string' && pageKey.trim().length > 0;
}

