'use client';

import { useEffect } from 'react';

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
        registration.update().catch(console.error);
        
        // Check for updates periodically
        const intervalId = setInterval(() => {
          registration.update().catch(console.error);
        }, 60 * 60 * 1000); // Every hour
        
        // Cleanup
        return () => clearInterval(intervalId);
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    };
    
    registerServiceWorker();
  }, []);
  
  return null;
}