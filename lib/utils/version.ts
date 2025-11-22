// Version management for cache busting
// This file tracks the application version and build timestamp

import { readFileSync } from 'fs';
import { join } from 'path';
import { logger } from '@/lib/logger';
import { config } from '@/lib/config';

// Read version from package.json dynamically
function getPackageVersion(): string {
  try {
    const packageJsonPath = join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    return packageJson.version || '1.0.0';
  } catch {
    // Fallback if package.json can't be read (e.g., in browser or during build)
    return '1.0.1';
  }
}

// Only read on server-side, use fallback on client
export const APP_VERSION =
  typeof window === 'undefined' ? getPackageVersion() : '1.0.1';
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
      caches.keys().then((names) => {
        names.forEach((name) => caches.delete(name));
      });
    }

    // Clear localStorage except for user preferences
    const preserveKeys = ['theme', 'user-preferences'];
    const preserved: Record<string, string> = {};

    preserveKeys.forEach((key) => {
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
