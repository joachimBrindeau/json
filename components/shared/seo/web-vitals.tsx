'use client';

import { useEffect } from 'react';
import type { Metric } from 'web-vitals';
import { logger } from '@/lib/logger';

// Extend global window interface for gtag
// Note: This extends the gtag type already declared in analytics.tsx

export function WebVitals() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Only run in production
    if (process.env.NODE_ENV !== 'production') return;

    const reportWebVitals = async () => {
      if ('web-vital' in window) return;

      const { onCLS, onFCP, onINP, onLCP, onTTFB } = await import('web-vitals');

      const sendToInternal = (metric: Metric) => {
        // Only send key metrics to internal endpoint
        if (!['CLS', 'LCP', 'TTFB'].includes(metric.name)) return;
        const body = {
          name: metric.name,
          value: metric.value,
          id: metric.id,
          delta: metric.delta,
          rating: metric.rating,
          url: typeof window !== 'undefined' ? window.location.href : undefined,
          route: typeof window !== 'undefined' ? window.location.pathname : undefined,
          navigationType:
            performance && 'navigation' in performance
              ? (performance as any).navigation?.type
              : undefined,
          timestamp: Date.now(),
        };
        try {
          // Prefer sendBeacon; fallback to fetch with keepalive
          const blob = new Blob([JSON.stringify(body)], { type: 'application/json' });
          const ok = navigator.sendBeacon?.('/api/analytics/web-vitals', blob);
          if (!ok) {
            fetch('/api/analytics/web-vitals', {
              method: 'POST',
              body: JSON.stringify(body),
              headers: { 'Content-Type': 'application/json', 'x-sample-rate': '1' },
              keepalive: true,
            }).catch(() => {});
          }
        } catch {
          // ignore
        }
      };

      // Log metrics and send to analytics in production
      const logMetric = (metric: Metric) => {
        // Log web vitals metrics with structured logging
        logger.info(
          {
            name: metric.name,
            value: Math.round(metric.value),
            id: metric.id,
            delta: metric.delta,
            rating: metric.rating,
          },
          'Web vitals metric'
        );

        // Internal endpoint
        sendToInternal(metric);

        // Example: Send to Google Analytics
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', metric.name, {
            value: Math.round(metric.value),
            metric_id: metric.id,
            metric_delta: metric.delta,
          });
        }
      };

      onCLS(logMetric);
      onFCP(logMetric);
      onINP(logMetric);
      onLCP(logMetric);
      onTTFB(logMetric);
    };

    reportWebVitals();
  }, []);

  return null;
}
