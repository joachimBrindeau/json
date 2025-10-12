'use client';

import { useEffect } from 'react';
import type { Metric } from 'web-vitals';

// Extend global window interface for gtag
declare global {
  interface Window {
    gtag?: (
      command: 'event',
      action: string,
      parameters: {
        value: number;
        metric_id: string;
        metric_delta: number;
      }
    ) => void;
  }
}

export function WebVitals() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Only run in production
    if (process.env.NODE_ENV !== 'production') return;

    const reportWebVitals = async () => {
      if ('web-vital' in window) return;

      const { onCLS, onFCP, onINP, onLCP, onTTFB } = await import('web-vitals');

      // Log to console in development, send to analytics in production
      const logMetric = (metric: Metric) => {
        // You can send these metrics to your analytics service
        console.log(metric);

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
