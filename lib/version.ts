// Version management for cache busting
// This file tracks the application version and build timestamp

import { logger } from '@/lib/logger';
import { config } from '@/lib/config';

export const APP_VERSION = '1.0.1'; // Increment this when making breaking changes
export const BUILD_ID = config.app.buildId;
export const BUILD_TIME = new Date().toISOString();

// Generate a unique version hash for cache busting
export function getVersionHash(): string {
  return `${APP_VERSION}-${BUILD_ID}`;
}

// Check if the app needs to reload based on version mismatch
export function checkVersionMismatch(storedVersion: string | null): boolean {
  const currentVersion = getVersionHash();
  return storedVersion !== null && storedVersion !== currentVersion;
}

// Store version in localStorage
export function storeVersion(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('app-version', getVersionHash());
  }
}

// Get stored version from localStorage
export function getStoredVersion(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('app-version');
  }
  return null;
}

// Force refresh if version mismatch detected
export function handleVersionUpdate(): void {
  const storedVersion = getStoredVersion();

  if (checkVersionMismatch(storedVersion)) {
    logger.info({ storedVersion, currentVersion: getVersionHash() }, 'Version update detected');

    // Clear all caches
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
    
    // Clear localStorage except for user preferences
    const preserveKeys = ['theme', 'user-preferences'];
    const preserved: Record<string, string> = {};
    
    preserveKeys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) preserved[key] = value;
    });
    
    localStorage.clear();
    
    // Restore preserved items
    Object.entries(preserved).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });
    
    // Store new version
    storeVersion();
    
    // Force reload
    window.location.reload();
  } else {
    // Store version if not present
    storeVersion();
  }
}