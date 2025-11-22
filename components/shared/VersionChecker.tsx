'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';

interface VersionInfo {
  version: string;
  buildId: string;
  versionHash: string;
}

export function VersionChecker() {
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') {
      return;
    }

    // Prevent infinite reload loops - check if we just reloaded
    const lastReloadTime = sessionStorage.getItem('last-reload-time');
    const now = Date.now();
    if (lastReloadTime) {
      const timeSinceReload = now - parseInt(lastReloadTime, 10);
      // If we reloaded less than 5 seconds ago, skip version check to prevent loops
      if (timeSinceReload < 5000) {
        logger.info({ timeSinceReload }, 'Skipping version check - recent reload detected');
        return;
      }
    }

    const checkVersion = async () => {
      try {
        // Fetch current version from API
        const response = await fetch('/api/version', {
          cache: 'no-store',
        });

        if (!response.ok) {
          logger.warn('Failed to fetch version from API');
          return;
        }

        const data: VersionInfo = await response.json();
        const APP_VERSION = data.versionHash; // Use versionHash for cache busting

        const storedVersion = localStorage.getItem('app-version');

        if (storedVersion && storedVersion !== APP_VERSION) {
          logger.info(
            { oldVersion: storedVersion, newVersion: APP_VERSION },
            'Version update detected'
          );

          // Clear caches if available
          if ('caches' in window) {
            caches
              .keys()
              .then((names) => {
                Promise.all(names.map((name) => caches.delete(name)));
              })
              .catch((err) => logger.error({ err }, 'Cache clear error'));
          }

          // Update stored version
          localStorage.setItem('app-version', APP_VERSION);

          // Mark reload time to prevent loops
          sessionStorage.setItem('last-reload-time', now.toString());

          // Reload page to get fresh content
          setTimeout(() => {
            window.location.reload();
          }, 100);
        } else if (!storedVersion) {
          // First visit - store version
          localStorage.setItem('app-version', APP_VERSION);
        }
      } catch (error) {
        logger.error({ err: error }, 'Version check error');
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
