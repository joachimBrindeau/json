/**
 * Monaco Editor Loader Configuration
 * 
 * Ensures Monaco is properly initialized before use to prevent
 * race conditions that require page refreshes.
 */

import { loader } from '@monaco-editor/react';

// Track initialization state
let isLoaderConfigured = false;
let initializationPromise: Promise<void> | null = null;

/**
 * Configure Monaco loader with proper initialization
 * This should be called once before any Monaco editor is used
 * 
 * Note: We configure the loader but don't call init() as @monaco-editor/react
 * handles initialization internally when the component mounts.
 */
export async function configureMonacoLoader(): Promise<void> {
  // If already configured, return existing promise
  if (isLoaderConfigured && initializationPromise) {
    return initializationPromise;
  }

  // If already configured, return immediately
  if (isLoaderConfigured) {
    return Promise.resolve();
  }

  // Create initialization promise
  initializationPromise = (async () => {
    try {
      // Configure loader to use CDN (default behavior)
      // This ensures Monaco is loaded from a reliable source
      // Only configure if not already configured to avoid conflicts
      if (loader && typeof loader.config === 'function') {
        loader.config({
          paths: {
            vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.54.0/min/vs',
          },
        });
      }

      isLoaderConfigured = true;
    } catch (error) {
      // Reset on error so we can retry
      isLoaderConfigured = false;
      initializationPromise = null;
      throw error;
    }
  })();

  return initializationPromise;
}

/**
 * Wait for Monaco to be fully ready
 * This can be called before using Monaco APIs
 * 
 * The @monaco-editor/react package handles initialization, so we just
 * ensure the loader is configured and wait a bit for any async operations.
 */
export async function waitForMonacoReady(): Promise<void> {
  // Ensure loader is configured first
  await configureMonacoLoader();

  // Wait a few ticks to ensure Monaco is fully initialized
  // This gives time for any async loading to complete
  await new Promise((resolve) => setTimeout(resolve, 50));
  
  // Additional check: wait for Monaco to be available globally if needed
  if (typeof window !== 'undefined') {
    let attempts = 0;
    const maxAttempts = 10;
    while (attempts < maxAttempts) {
      // Check if Monaco is available (it may be set by the loader)
      if ((window as any).monaco || (window as any).require) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 50));
      attempts++;
    }
  }
}

/**
 * Check if Monaco loader is configured
 */
export function isMonacoLoaderConfigured(): boolean {
  return isLoaderConfigured;
}
