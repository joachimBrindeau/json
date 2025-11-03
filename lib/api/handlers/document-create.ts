import { ValidationError } from '@/lib/utils/app-errors';
import { isValidCategory, getCategoryValidationError } from '@/lib/constants/categories';
import { sanitizeString } from '@/lib/utils/sanitize';

export interface CreateDocumentInputPayload {
  title?: string;
  description?: string;
  content?: any;
  category?: string;
  tags?: string[];
  richContent?: string;
}

export function validateAndBuildCreateInput(data: CreateDocumentInputPayload) {
  // Validate required fields
  if (!data.title?.trim()) {
    throw new ValidationError('Title is required', [
      { field: 'title', message: 'Title is required' },
    ]);
  }

  // Validate category if provided
  if (data.category && !isValidCategory(data.category)) {
    throw new ValidationError(getCategoryValidationError(), [
      { field: 'category', message: 'Invalid category value' },
    ]);
  }

  return {
    title: sanitizeString(data.title).slice(0, 200),
    description: data.description ? sanitizeString(data.description) : '',
    content: data.content || '{}',
    category: data.category || undefined,
    tags: Array.isArray(data.tags)
      ? data.tags.map((t) => sanitizeString(t).slice(0, 50)).filter(Boolean)
      : [],
    richContent: data.richContent ? sanitizeString(data.richContent) : '',
  };
}
