'use client';

import { useEffect } from 'react';
import Script from 'next/script';

/**
 * Performance optimizations for Core Web Vitals
 */
export function PerformanceOptimizations() {
  useEffect(() => {
    // Preload critical resources
    const preloadResources = () => {
      // Preload fonts
      const fontLinks = document.querySelectorAll('link[rel="preload"][as="font"]');
      if (fontLinks.length === 0) {
        const geistSans = document.createElement('link');
        geistSans.rel = 'preload';
        geistSans.href = '/fonts/geist-sans.woff2';
        geistSans.as = 'font';
        geistSans.type = 'font/woff2';
        geistSans.crossOrigin = 'anonymous';
        document.head.appendChild(geistSans);
      }

      // Preconnect to external domains
      const preconnectDomains = ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'];
      preconnectDomains.forEach(domain => {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = domain;
        if (domain.includes('gstatic')) {
          link.crossOrigin = 'anonymous';
        }
        document.head.appendChild(link);
      });
    };

    // Optimize images with lazy loading
    const optimizeImages = () => {
      const images = document.querySelectorAll('img:not([loading])');
      images.forEach((img) => {
        img.setAttribute('loading', 'lazy');
        img.setAttribute('decoding', 'async');
      });
    };

    // Resource hints for better performance
    const addResourceHints = () => {
      const hints = [
        { rel: 'dns-prefetch', href: '//jsonviewer.app' },
        { rel: 'preconnect', href: 'https://jsonviewer.app' },
      ];

      hints.forEach(hint => {
        if (!document.querySelector(`link[rel="${hint.rel}"][href="${hint.href}"]`)) {
          const link = document.createElement('link');
          link.rel = hint.rel;
          link.href = hint.href;
          document.head.appendChild(link);
        }
      });
    };

    // Run optimizations
    preloadResources();
    optimizeImages();
    addResourceHints();

    // Cleanup large objects for memory optimization
    const cleanup = () => {
      // Clear any large cached data older than 1 hour
      const clearExpiredCache = () => {
        const cacheKeys = Object.keys(sessionStorage);
        cacheKeys.forEach(key => {
          if (key.startsWith('json-cache-')) {
            try {
              const item = sessionStorage.getItem(key);
              if (item) {
                const parsed = JSON.parse(item);
                const age = Date.now() - (parsed.timestamp || 0);
                if (age > 3600000) { // 1 hour
                  sessionStorage.removeItem(key);
                }
              }
            } catch {
              sessionStorage.removeItem(key);
            }
          }
        });
      };

      clearExpiredCache();
    };

    // Run cleanup periodically
    const cleanupInterval = setInterval(cleanup, 300000); // 5 minutes

    return () => {
      clearInterval(cleanupInterval);
    };
  }, []);

  return (
    <>
      {/* Critical CSS inlining hint */}
      <Script id="critical-css-hint" strategy="afterInteractive">
        {`
          // Hint to inline critical CSS
          if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
              const criticalStyles = document.querySelector('style[data-next-hide-fouc]');
              if (criticalStyles) {
                criticalStyles.media = 'print';
                requestAnimationFrame(() => {
                  criticalStyles.media = 'all';
                });
              }
            });
          }
        `}
      </Script>

      {/* Service Worker for caching */}
      <Script id="sw-registration" strategy="afterInteractive">
        {`
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js')
                .then((registration) => {
                  console.log('SW registered: ', registration);
                })
                .catch((registrationError) => {
                  console.log('SW registration failed: ', registrationError);
                });
            });
          }
        `}
      </Script>
    </>
  );
}

/**
 * Schema.org structured data for performance metrics
 */
export function PerformanceSchema() {
  const performanceData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "JSON Viewer",
    "applicationCategory": "DeveloperApplication",
    "featureList": [
      "Real-time JSON formatting",
      "Instant validation",
      "Zero-latency editing",
      "Progressive loading for large files",
      "Offline functionality"
    ],
    "requirements": "Modern web browser with JavaScript enabled",
    "softwareVersion": "2.0",
    "operatingSystem": "Any",
    "processorRequirements": "Any",
    "memoryRequirements": "Minimal - runs efficiently on low-end devices",
    "storageRequirements": "None - purely web-based application"
  };

  return (
    <Script
      id="performance-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(performanceData)
      }}
    />
  );
}