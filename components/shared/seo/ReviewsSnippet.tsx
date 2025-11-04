'use client';

import { Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { calculateAggregateRating, APPLICATION_REVIEWS } from '@/lib/seo/reviews';

/**
 * Compact Reviews Snippet Component
 * Displays reviews in a compact format for all pages
 * 
 * Principles:
 * - DRY: Uses centralized review data
 * - KISS: Simple, compact display
 * - SOLID: Single responsibility - shows reviews compactly
 */
export function ReviewsSnippet() {
  const aggregateRating = calculateAggregateRating(APPLICATION_REVIEWS);
  // Show top 3 reviews in compact format
  const topReviews = APPLICATION_REVIEWS.slice(0, 3);

  return (
    <section className="py-8 bg-muted/20 border-t" aria-labelledby="reviews-snippet-heading">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h3 id="reviews-snippet-heading" className="text-lg font-semibold">
                User Reviews
              </h3>
              <div className="flex items-center gap-1.5">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.round(aggregateRating.ratingValue)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'fill-gray-300 text-gray-300'
                      }`}
                      aria-hidden="true"
                    />
                  ))}
                </div>
                <span className="text-sm font-semibold">{aggregateRating.ratingValue}</span>
                <span className="text-xs text-muted-foreground">
                  ({aggregateRating.reviewCount} reviews)
                </span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="flex gap-4 pb-4 min-w-max">
              {topReviews.map((review, index) => (
                <Card key={index} className="min-w-[280px] flex-shrink-0">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{review.author.name}</span>
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < review.reviewRating.ratingValue
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'fill-gray-300 text-gray-300'
                            }`}
                            aria-hidden="true"
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {review.reviewBody}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

