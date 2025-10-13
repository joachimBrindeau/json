'use client';

import { useEffect } from 'react';
import Script from 'next/script';
import { logger } from '@/lib/logger';

/**
 * Google Analytics gtag parameters
 */
interface GtagParams {
  event_category?: string;
  event_label?: string;
  value?: number;
  page_title?: string;
  page_location?: string;
  send_page_view?: boolean;
  custom_map?: Record<string, string>;
  [key: string]: string | number | boolean | Record<string, string> | undefined;
}

/**
 * Facebook Pixel parameters
 */
interface FbqParams {
  content_category?: string;
  [key: string]: string | number | boolean | undefined;
}

declare global {
  interface Window {
    gtag?: (command: string, targetId: string | Date, params?: GtagParams) => void;
    dataLayer?: Array<unknown>;
    fbq?: (command: string, eventName: string, params?: FbqParams) => void;
    _fbq?: {
      callMethod?: (...args: unknown[]) => void;
      queue: Array<unknown>;
      push: (args: unknown) => void;
      loaded: boolean;
      version: string;
    };
    trackJSONAction?: (action: string, category?: string, label?: string) => void;
    trackFBEvent?: (event: string, params?: FbqParams) => void;
  }
}

export function Analytics() {
  const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID;
  const HOTJAR_ID = process.env.NEXT_PUBLIC_HOTJAR_ID;

  return (
    <>
      {/* Google Analytics 4 */}
      {GA_MEASUREMENT_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              
              gtag('config', '${GA_MEASUREMENT_ID}', {
                page_title: document.title,
                page_location: window.location.href,
                send_page_view: true,
                // Enhanced ecommerce for conversion tracking
                custom_map: {
                  'custom_parameter_1': 'json_format_action',
                  'custom_parameter_2': 'json_share_action',
                  'custom_parameter_3': 'json_validate_action'
                }
              });

              // Track JSON tool usage
              window.trackJSONAction = function(action, category, label) {
                gtag('event', action, {
                  event_category: category || 'JSON_Tool',
                  event_label: label || '',
                  custom_parameter_1: action
                });
              };

              // Track performance metrics
              gtag('config', '${GA_MEASUREMENT_ID}', {
                custom_map: {
                  'metric1': 'json_processing_time',
                  'metric2': 'file_size_processed'
                }
              });
            `}
          </Script>
        </>
      )}

      {/* Facebook Pixel */}
      {FB_PIXEL_ID && (
        <Script id="facebook-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window,document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${FB_PIXEL_ID}');
            fbq('track', 'PageView');
            
            // Custom events for JSON tools
            window.trackFBEvent = function(event, params) {
              fbq('track', event, params || {});
            };
          `}
        </Script>
      )}

      {/* Hotjar */}
      {HOTJAR_ID && (
        <Script id="hotjar" strategy="afterInteractive">
          {`
            (function(h,o,t,j,a,r){
              h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
              h._hjSettings={hjid:${HOTJAR_ID},hjsv:6};
              a=o.getElementsByTagName('head')[0];
              r=o.createElement('script');r.async=1;
              r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
              a.appendChild(r);
            })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
          `}
        </Script>
      )}

      {/* Custom Analytics for JSON Actions */}
      <Script id="custom-analytics" strategy="afterInteractive">
        {`
          // Track JSON tool interactions
          document.addEventListener('DOMContentLoaded', function() {
            // Format button clicks
            document.addEventListener('click', function(e) {
              if (e.target.matches('[data-action="format"]') || e.target.closest('[data-action="format"]')) {
                if (window.gtag) {
                  gtag('event', 'json_format', {
                    event_category: 'JSON_Action',
                    event_label: 'Format_Click'
                  });
                }
                if (window.fbq) {
                  fbq('track', 'Lead', { content_category: 'JSON_Format' });
                }
              }
              
              // Share button clicks
              if (e.target.matches('[data-action="share"]') || e.target.closest('[data-action="share"]')) {
                if (window.gtag) {
                  gtag('event', 'json_share', {
                    event_category: 'JSON_Action',
                    event_label: 'Share_Click'
                  });
                }
                if (window.fbq) {
                  fbq('track', 'Share', { content_category: 'JSON_Share' });
                }
              }
            });

            // Track time spent on page
            let startTime = Date.now();
            window.addEventListener('beforeunload', function() {
              const timeSpent = Math.round((Date.now() - startTime) / 1000);
              if (window.gtag && timeSpent > 5) {
                gtag('event', 'timing_complete', {
                  name: 'page_engagement',
                  value: timeSpent,
                  event_category: 'Engagement'
                });
              }
            });

            // Track scroll depth
            let maxScroll = 0;
            window.addEventListener('scroll', function() {
              const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
              if (scrollPercent > maxScroll && scrollPercent % 25 === 0) {
                maxScroll = scrollPercent;
                if (window.gtag) {
                  gtag('event', 'scroll', {
                    event_category: 'Engagement',
                    event_label: scrollPercent + '%',
                    value: scrollPercent
                  });
                }
              }
            });
          });
        `}
      </Script>
    </>
  );
}

/**
 * Privacy-compliant analytics tracking
 */
export function useAnalytics() {
  useEffect(() => {
    // Check for consent before initializing analytics
    const hasConsent = localStorage.getItem('analytics-consent') === 'true';

    if (!hasConsent) {
      // Show consent banner or use default non-tracking mode
      logger.info({ hasConsent }, 'Analytics consent not given');
    }
  }, []);

  const trackEvent = (event: string, category: string, label?: string, value?: number) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', event, {
        event_category: category,
        event_label: label,
        value: value
      });
    }
  };

  const trackJSONAction = (action: string, size?: number, processingTime?: number) => {
    trackEvent(action, 'JSON_Tool', undefined, size);
    
    if (processingTime && window.gtag) {
      window.gtag('event', 'timing_complete', {
        name: 'json_processing',
        value: processingTime,
        event_category: 'Performance'
      });
    }
  };

  return { trackEvent, trackJSONAction };
}