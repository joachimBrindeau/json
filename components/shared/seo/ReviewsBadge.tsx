'use client';

import { Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { calculateAggregateRating, APPLICATION_REVIEWS } from '@/lib/seo/reviews';

/**
 * Compact Reviews Badge Component
 * Displays aggregate rating for all pages
 * 
 * Principles:
 * - DRY: Uses centralized review data
 * - KISS: Simple, minimal display
 * - SOLID: Single responsibility - shows rating
 */
export function ReviewsBadge() {
  const aggregateRating = calculateAggregateRating(APPLICATION_REVIEWS);

  return (
    <Badge
      variant="secondary"
      className="flex items-center gap-1.5 px-2 py-1 bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800"
      aria-label={`${aggregateRating.ratingValue} out of 5 stars based on ${aggregateRating.reviewCount} reviews`}
    >
      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" aria-hidden="true" />
      <span className="font-semibold">{aggregateRating.ratingValue}</span>
      <span className="text-xs opacity-75">({aggregateRating.reviewCount})</span>
    </Badge>
  );
}

