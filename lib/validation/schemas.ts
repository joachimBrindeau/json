/**
 * Zod validation schemas for form validation
 *
 * These schemas provide type-safe validation for forms throughout the application.
 * They match existing validation logic while enabling progressive migration to react-hook-form.
 */

import { z } from 'zod';
import { DOCUMENT_CATEGORIES } from '@/lib/constants/categories';

/**
 * Common field validators
 */

/** Title validation: required, 1-200 characters */
export const titleSchema = z
  .string()
  .min(1, 'Title is required')
  .max(200, 'Title must be 200 characters or less')
  .trim();

/** Description validation: optional, max 1000 characters (share modal) */
export const descriptionSchema = z
  .string()
  .max(1000, 'Description must be 1000 characters or less')
  .optional()
  .default('');

/** Short description validation: optional, max 300 characters (publish modal) */
export const shortDescriptionSchema = z
  .string()
  .max(300, 'Description must be 300 characters or less')
  .optional()
  .default('');

/** Rich content validation: optional, no max length specified in current implementation */
export const richContentSchema = z
  .string()
  .optional()
  .default('');

/** Category validation: optional, must be from predefined list */
export const categorySchema = z
  .enum(DOCUMENT_CATEGORIES)
  .optional()
  .or(z.literal(''))
  .default('');

/** Tags validation: optional array, max 10 tags */
export const tagsSchema = z
  .array(z.string())
  .max(10, 'Maximum 10 tags allowed')
  .optional()
  .default([]);

/** Visibility validation */
export const visibilitySchema = z
  .enum(['public', 'private'])
  .default('private');

/**
 * Share Modal Form Schema
 *
 * Used for sharing JSONs with optional public library publishing
 *
 * @example
 * ```tsx
 * const form = useValidatedForm(shareFormSchema);
 * ```
 */
export const shareFormSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  category: categorySchema,
  tags: tagsSchema,
  visibility: visibilitySchema,
});

/**
 * Type inference for ShareForm
 */
export type ShareFormData = z.infer<typeof shareFormSchema>;

/**
 * Publish Modal Form Schema
 *
 * Used for publishing JSONs to the public library with rich content
 * Extends share form with additional richContent field
 *
 * @example
 * ```tsx
 * const form = useValidatedForm(publishFormSchema);
 * ```
 */
export const publishFormSchema = z.object({
  title: titleSchema,
  description: shortDescriptionSchema, // Publish modal uses 300 char limit
  richContent: richContentSchema,
  category: categorySchema,
  tags: tagsSchema,
});

/**
 * Type inference for PublishForm
 */
export type PublishFormData = z.infer<typeof publishFormSchema>;

/**
 * Validation helpers for manual validation (during migration)
 */

/**
 * Validate title field manually
 * @param title - The title to validate
 * @returns Validation result with error message if invalid
 */
export function validateTitle(title: string): { valid: boolean; error?: string } {
  try {
    titleSchema.parse(title);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.issues[0]?.message };
    }
    return { valid: false, error: 'Invalid title' };
  }
}

/**
 * Validate tags array manually
 * @param tags - The tags to validate
 * @returns Validation result with error message if invalid
 */
export function validateTags(tags: string[]): { valid: boolean; error?: string } {
  try {
    tagsSchema.parse(tags);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.issues[0]?.message };
    }
    return { valid: false, error: 'Invalid tags' };
  }
}
