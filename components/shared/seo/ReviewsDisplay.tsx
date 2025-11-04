'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import { APPLICATION_REVIEWS, calculateAggregateRating } from '@/lib/seo/reviews';

/**
 * Reviews Display Component
 * Displays reviews on the page (required for Google review snippets)
 * 
 * Principles:
 * - DRY: Uses centralized review data
 * - KISS: Simple, clean display
 * - SOLID: Single responsibility - only displays reviews
 */
export function ReviewsDisplay() {
  const aggregateRating = calculateAggregateRating(APPLICATION_REVIEWS);

  return (
    <section className="py-16 bg-muted/30" aria-labelledby="reviews-heading">
      <div className="container mx-auto px-6">
        <header className="max-w-3xl mx-auto text-center mb-12">
          <h2 id="reviews-heading" className="text-3xl md:text-4xl font-bold mb-4">
            What Users Say
          </h2>
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.round(aggregateRating.ratingValue)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'fill-gray-300 text-gray-300'
                    }`}
                    aria-hidden="true"
                  />
                ))}
              </div>
              <span className="text-2xl font-bold">{aggregateRating.ratingValue}</span>
              <span className="text-muted-foreground">
                ({aggregateRating.reviewCount} reviews)
              </span>
            </div>
          </div>
          <p className="text-xl text-muted-foreground">
            Trusted by developers worldwide for JSON processing and validation
          </p>
        </header>

        <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {APPLICATION_REVIEWS.map((review, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-2">
                  <CardTitle className="text-lg">{review.author.name}</CardTitle>
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < review.reviewRating.ratingValue
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'fill-gray-300 text-gray-300'
                        }`}
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                </div>
                {review.author.url && (
                  <Badge variant="outline" className="text-xs">
                    <a
                      href={review.author.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      Verified User
                    </a>
                  </Badge>
                )}
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  {review.reviewBody}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(review.datePublished).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

