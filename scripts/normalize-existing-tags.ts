#!/usr/bin/env tsx

/**
 * Script to normalize existing tags in the database
 * This will clean up any existing duplicates and apply normalization rules
 */

import { prisma } from '../lib/db';
import { normalizeTag, validateTag } from '../lib/tags/tag-utils';

async function normalizeExistingTags() {
  console.log('Starting tag normalization process...');

  try {
    // Fetch all public documents with tags
    const documents = await prisma.jsonDocument.findMany({
      where: {
        visibility: 'public',
        tags: {
          isEmpty: false,
        },
      },
      select: {
        id: true,
        shareId: true,
        title: true,
        tags: true,
      },
    });

    console.log(`Found ${documents.length} documents with tags to process`);

    // Track statistics
    let totalTags = 0;
    let normalizedCount = 0;
    let duplicatesRemoved = 0;
    let invalidTagsRemoved = 0;

    // Process each document
    for (const doc of documents) {
      const originalTags = doc.tags;
      totalTags += originalTags.length;

      // Normalize and validate tags
      const normalizedSet = new Set<string>();
      const validTags: string[] = [];

      for (const tag of originalTags) {
        const normalized = normalizeTag(tag);

        // Validate the tag
        const validation = validateTag(tag);

        if (validation.isValid && normalized) {
          // Check if we already have this normalized version
          if (!normalizedSet.has(normalized)) {
            validTags.push(normalized);
            normalizedSet.add(normalized);

            // Track if this was actually normalized
            if (tag !== normalized) {
              normalizedCount++;
            }
          } else {
            duplicatesRemoved++;
          }
        } else {
          console.log(
            `Removing invalid tag "${tag}" from document ${doc.shareId}: ${validation.errors.join(', ')}`
          );
          invalidTagsRemoved++;
        }
      }

      // Update document if tags changed
      if (JSON.stringify(validTags.sort()) !== JSON.stringify(originalTags.sort())) {
        await prisma.jsonDocument.update({
          where: { id: doc.id },
          data: { tags: validTags },
        });

        console.log(
          `Updated document ${doc.shareId} (${doc.title}): ${originalTags.length} tags → ${validTags.length} tags`
        );
      }
    }

    // Generate tag statistics
    const updatedDocs = await prisma.jsonDocument.findMany({
      where: {
        visibility: 'public',
        tags: {
          isEmpty: false,
        },
      },
      select: {
        tags: true,
      },
    });

    // Count unique tags after normalization
    const uniqueTags = new Set<string>();
    updatedDocs.forEach((doc) => {
      doc.tags.forEach((tag) => uniqueTags.add(tag));
    });

    console.log('\n=== Tag Normalization Complete ===');
    console.log(`Total tags processed: ${totalTags}`);
    console.log(`Tags normalized: ${normalizedCount}`);
    console.log(`Duplicate tags removed: ${duplicatesRemoved}`);
    console.log(`Invalid tags removed: ${invalidTagsRemoved}`);
    console.log(`Unique tags in system: ${uniqueTags.size}`);

    // Show most popular tags
    const tagCounts = new Map<string, number>();
    updatedDocs.forEach((doc) => {
      doc.tags.forEach((tag) => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    const topTags = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);

    console.log('\n=== Top 20 Tags ===');
    topTags.forEach(([tag, count], index) => {
      console.log(`${index + 1}. ${tag} (${count} uses)`);
    });
  } catch (error) {
    console.error('Error during tag normalization:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
normalizeExistingTags()
  .then(() => {
    console.log('\nTag normalization completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to normalize tags:', error);
    process.exit(1);
  });
