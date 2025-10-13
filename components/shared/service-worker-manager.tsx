'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';

export function ServiceWorkerManager() {
  useEffect(() => {
    // Only register service worker in production and on client side
    if (typeof window === 'undefined' || 
        !('serviceWorker' in navigator) || 
        process.env.NODE_ENV !== 'production') {
      return;
    }

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');

        // Check for updates
        registration.update().catch(err => logger.error({ err }, 'Service worker update check failed'));

        // Check for updates periodically
        const intervalId = setInterval(() => {
          registration.update().catch(err => logger.error({ err }, 'Service worker periodic update failed'));
        }, 60 * 60 * 1000); // Every hour
        
        // Cleanup
        return () => clearInterval(intervalId);
      } catch (error) {
        logger.error({ err: error }, 'Service Worker registration failed');
      }
    };
    
    registerServiceWorker();
  }, []);
  
  return null;
}