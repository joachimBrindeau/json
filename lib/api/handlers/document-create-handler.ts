import { NextRequest } from 'next/server';
import { Session } from 'next-auth';
import { validateAndBuildCreateInput } from '@/lib/api/handlers/document-create';
import { createJsonDocument } from '@/lib/db/queries/documents';
import { created } from '@/lib/api/responses';
import { ValidationError } from '@/lib/utils/app-errors';

export interface CreateDocumentOptions {
  visibility?: 'public' | 'private';
  forceVisibility?: 'public' | 'private'; // Force a specific visibility, ignoring input
}

/**
 * Shared handler for creating documents in library routes
 * Consolidates the common POST logic between public and private library endpoints
 */
export async function handleCreateDocument(
  request: NextRequest,
  session: Session,
  options: CreateDocumentOptions = {}
): Promise<Response> {
  const data = await request.json();
  const input = validateAndBuildCreateInput(data);

  // Determine visibility
  let visibility: 'public' | 'private';
  if (options.forceVisibility) {
    visibility = options.forceVisibility;
  } else {
    visibility = options.visibility || data.visibility || 'private';
  }

  // Create the document
  const result = await createJsonDocument({
    userId: session.user.id,
    ...input,
    visibility,
  });

  if (!result.success) {
    throw new ValidationError(result.error || 'Failed to create document');
  }

  return created(result.data, { message: 'Document created successfully' });
}

