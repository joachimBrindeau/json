import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { success, badRequest } from '@/lib/api/responses';
import { withAuth } from '@/lib/api/utils';
import { withValidationHandler } from '@/lib/api/middleware';

/**
 * Schema for anonymous data migration request
 */
const migrateAnonymousSchema = z.object({
  anonymousJsonIds: z.array(z.string()).optional().default([]),
  anonymousSessionId: z.string().optional(),
});

/**
 * POST migrate anonymous JSON documents to authenticated user
 *
 * This endpoint is called when a user signs up or logs in and has
 * anonymous JSON documents that need to be associated with their account.
 *
 * The migration process:
 * 1. Validates the user is authenticated
 * 2. Finds all anonymous documents matching the provided IDs
 * 3. Updates the documents to associate them with the user
 * 4. Marks them as no longer anonymous
 *
 * @param request - Contains anonymousJsonIds array
 * @returns Success response with migration count
 */
export const POST = withAuth(async (request: NextRequest, session) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const { anonymousJsonIds, anonymousSessionId } = migrateAnonymousSchema.parse(body);

    // If no IDs provided, return early
    if (!anonymousJsonIds || anonymousJsonIds.length === 0) {
      logger.info({ userId: session.user.id }, 'No anonymous documents to migrate');
      return success({
        migratedCount: 0,
        message: 'No documents to migrate',
      });
    }

    logger.info(
      {
        userId: session.user.id,
        email: session.user.email,
        anonymousJsonIds,
        anonymousSessionId,
        count: anonymousJsonIds.length,
      },
      'Starting anonymous data migration'
    );

    // Find all anonymous documents matching the provided IDs
    // We need to be careful here - only migrate documents that are:
    // 1. Actually anonymous (isAnonymous = true)
    // 2. Not already owned by another user
    // 3. Match the provided IDs
    const documentsToMigrate = await prisma.jsonDocument.findMany({
      where: {
        OR: [
          // Match by document ID
          {
            id: {
              in: anonymousJsonIds,
            },
            isAnonymous: true,
            userId: null,
          },
          // Match by shareId (in case IDs are shareIds)
          {
            shareId: {
              in: anonymousJsonIds,
            },
            isAnonymous: true,
            userId: null,
          },
        ],
      },
      select: {
        id: true,
        shareId: true,
        title: true,
        size: true,
      },
    });

    if (documentsToMigrate.length === 0) {
      logger.info(
        { userId: session.user.id, providedIds: anonymousJsonIds },
        'No matching anonymous documents found to migrate'
      );
      return success({
        migratedCount: 0,
        message: 'No matching documents found',
      });
    }

    // Extract the IDs of documents we found
    const documentIds = documentsToMigrate.map((doc) => doc.id);

    // Perform the migration in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update all matching documents
      const updateResult = await tx.jsonDocument.updateMany({
        where: {
          id: {
            in: documentIds,
          },
          isAnonymous: true,
          userId: null,
        },
        data: {
          userId: session.user.id,
          isAnonymous: false,
          updatedAt: new Date(),
        },
      });

      return updateResult;
    });

    const migratedCount = result.count;

    logger.info(
      {
        userId: session.user.id,
        email: session.user.email,
        migratedCount,
        documentIds,
        totalSize: documentsToMigrate.reduce((sum, doc) => sum + Number(doc.size), 0),
      },
      'Successfully migrated anonymous documents'
    );

    return success({
      migratedCount,
      message: `Successfully migrated ${migratedCount} document${migratedCount !== 1 ? 's' : ''}`,
      documents: documentsToMigrate.map((doc) => ({
        id: doc.id,
        shareId: doc.shareId,
        title: doc.title,
      })),
    });
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      logger.warn(
        {
          userId: session.user.id,
          errors: error.issues,
        },
        'Invalid migration request data'
      );
      return badRequest('Invalid request data', {
        details: 'Invalid request schema',
        metadata: { issues: error.issues },
      });
    }

    // Log and handle other errors
    logger.error(
      {
        err: error,
        userId: session.user.id,
        email: session.user.email,
      },
      'Failed to migrate anonymous documents'
    );

    // Return a generic error to the client
    // Don't expose internal error details
    return badRequest('Failed to migrate documents. Please try again.');
  }
});
