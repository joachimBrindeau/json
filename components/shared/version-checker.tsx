'use client';

import { useEffect } from 'react';

export function VersionChecker() {
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') {
      return;
    }

    const APP_VERSION = '1.0.1';
    
    const checkVersion = () => {
      try {
        const storedVersion = localStorage.getItem('app-version');
        
        if (storedVersion && storedVersion !== APP_VERSION) {
          console.log(`Version update detected: ${storedVersion} -> ${APP_VERSION}`);
          
          // Clear caches if available
          if ('caches' in window) {
            caches.keys().then(names => {
              Promise.all(names.map(name => caches.delete(name)));
            }).catch(err => console.error('Cache clear error:', err));
          }
          
          // Update stored version
          localStorage.setItem('app-version', APP_VERSION);
          
          // Reload page to get fresh content
          setTimeout(() => {
            window.location.reload();
          }, 100);
        } else if (!storedVersion) {
          // First visit - store version
          localStorage.setItem('app-version', APP_VERSION);
        }
      } catch (error) {
        console.error('Version check error:', error);
      }
    };

    // Run check
    checkVersion();
    
    // Check on visibility change
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkVersion();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  return null;
}