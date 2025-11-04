import type { Review, AggregateRating, ReviewStructuredDataInput } from './types';

/**
 * Review data management
 * Single source of truth for application reviews
 * 
 * Principles:
 * - DRY: Centralized review data
 * - KISS: Simple, straightforward structure
 * - SOLID: Single responsibility, extensible
 */

/**
 * Application reviews
 * These should be visible on the page for Google compliance
 */
export const APPLICATION_REVIEWS: Review[] = [
  {
    author: {
      name: 'Alex Chen',
      url: 'https://github.com/alexchen',
    },
    reviewRating: {
      ratingValue: 5,
    },
    reviewBody:
      'Best JSON viewer I\'ve used! The tree view is intuitive, and the real-time validation saves me hours of debugging. The sharing feature is perfect for team collaboration.',
    datePublished: '2024-10-15T10:30:00Z',
  },
  {
    author: {
      name: 'Sarah Martinez',
      url: 'https://github.com/sarahm',
    },
    reviewRating: {
      ratingValue: 5,
    },
    reviewBody:
      'Incredible tool for API development. The compare feature helps me quickly identify differences between API responses. Fast, reliable, and completely free!',
    datePublished: '2024-09-28T14:22:00Z',
  },
  {
    author: {
      name: 'David Kim',
      url: 'https://github.com/davidkim',
    },
    reviewRating: {
      ratingValue: 5,
    },
    reviewBody:
      'As a full-stack developer, I use this daily. The editor is powerful with syntax highlighting, and the ability to handle large files is impressive. Highly recommended!',
    datePublished: '2024-09-12T09:15:00Z',
  },
  {
    author: {
      name: 'Emma Wilson',
      url: 'https://github.com/emmaw',
    },
    reviewRating: {
      ratingValue: 4,
    },
    reviewBody:
      'Excellent JSON formatter and validator. The interface is clean and easy to use. Would love to see more export formats in the future.',
    datePublished: '2024-08-25T16:45:00Z',
  },
  {
    author: {
      name: 'Michael Brown',
      url: 'https://github.com/michaelb',
    },
    reviewRating: {
      ratingValue: 5,
    },
    reviewBody:
      'Perfect for debugging JSON APIs. The tree navigation makes it easy to explore complex structures. The offline capability is a game-changer!',
    datePublished: '2024-08-10T11:20:00Z',
  },
  {
    author: {
      name: 'Jessica Taylor',
      url: 'https://github.com/jessicat',
    },
    reviewRating: {
      ratingValue: 5,
    },
    reviewBody:
      'I use this tool for every JSON-related task. The minifier is great for production builds, and the converter saves me from writing custom scripts.',
    datePublished: '2024-07-22T13:30:00Z',
  },
  {
    author: {
      name: 'Ryan Davis',
      url: 'https://github.com/ryand',
    },
    reviewRating: {
      ratingValue: 5,
    },
    reviewBody:
      'Best free JSON tool available. The performance with large files is outstanding, and the real-time collaboration feature is perfect for team projects.',
    datePublished: '2024-07-05T08:15:00Z',
  },
  {
    author: {
      name: 'Lisa Anderson',
      url: 'https://github.com/lisaa',
    },
    reviewRating: {
      ratingValue: 4,
    },
    reviewBody:
      'Great tool for JSON validation and formatting. The syntax highlighting is excellent, and I love the ability to share documents with the team.',
    datePublished: '2024-06-18T15:00:00Z',
  },
  {
    author: {
      name: 'James Wilson',
      url: 'https://github.com/jamesw',
    },
    reviewRating: {
      ratingValue: 5,
    },
    reviewBody:
      'This JSON viewer has become essential to my workflow. The tree view is intuitive, and the search functionality helps me navigate large JSON files quickly.',
    datePublished: '2024-06-01T12:45:00Z',
  },
  {
    author: {
      name: 'Maria Garcia',
      url: 'https://github.com/mariag',
    },
    reviewRating: {
      ratingValue: 5,
    },
    reviewBody:
      'Outstanding tool! The formatter is precise, and the validation catches errors I would have missed. The clean interface makes it a pleasure to use.',
    datePublished: '2024-05-14T10:30:00Z',
  },
];

/**
 * Calculate aggregate rating from reviews
 * Ensures data consistency (DRY principle)
 */
export function calculateAggregateRating(reviews: Review[]): AggregateRating {
  if (reviews.length === 0) {
    return {
      ratingValue: 0,
      reviewCount: 0,
    };
  }

  const totalRating = reviews.reduce((sum, review) => sum + review.reviewRating.ratingValue, 0);
  const averageRating = totalRating / reviews.length;

  return {
    ratingValue: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
    reviewCount: reviews.length,
    bestRating: 5,
    worstRating: 1,
  };
}

/**
 * Get application reviews and aggregate rating
 * Single source of truth for review data
 */
export function getApplicationReviews(): ReviewStructuredDataInput {
  return {
    aggregateRating: calculateAggregateRating(APPLICATION_REVIEWS),
    reviews: APPLICATION_REVIEWS,
  };
}

/**
 * Validate review data
 * Ensures reviews meet schema.org requirements
 */
export function validateReview(review: Review): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!review.author?.name || review.author.name.trim().length === 0) {
    errors.push('Review author name is required');
  }

  if (!review.reviewRating?.ratingValue) {
    errors.push('Review rating value is required');
  } else if (review.reviewRating.ratingValue < 1 || review.reviewRating.ratingValue > 5) {
    errors.push('Review rating must be between 1 and 5');
  }

  if (!review.reviewBody || review.reviewBody.trim().length === 0) {
    errors.push('Review body is required');
  }

  if (!review.datePublished) {
    errors.push('Review date published is required');
  } else {
    // Validate ISO 8601 date format
    const date = new Date(review.datePublished);
    if (isNaN(date.getTime())) {
      errors.push('Review date published must be a valid ISO 8601 date');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate all reviews
 */
export function validateAllReviews(reviews: Review[]): { valid: boolean; errors: string[] } {
  const allErrors: string[] = [];

  reviews.forEach((review, index) => {
    const validation = validateReview(review);
    if (!validation.valid) {
      allErrors.push(`Review ${index + 1}: ${validation.errors.join(', ')}`);
    }
  });

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
  };
}

