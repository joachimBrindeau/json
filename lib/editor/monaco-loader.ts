/**
 * Monaco Editor Loader Configuration
 * 
 * Ensures Monaco is properly initialized before use to prevent
 * race conditions that require page refreshes.
 */

import { loader } from '@monaco-editor/react';

// Track initialization state
let isLoaderConfigured = false;
let isMonacoInitialized = false;
let initializationPromise: Promise<void> | null = null;

/**
 * Internal function to wait for Monaco to be available
 * This is called after loader configuration
 */
async function waitForMonacoAvailability(): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  let attempts = 0;
  const maxAttempts = 20;
  const delay = 100;
  
  while (attempts < maxAttempts) {
    // Check if Monaco is available via multiple methods
    const monacoAvailable = 
      (window as any).monaco?.editor || 
      (window as any).require?.config ||
      (typeof (window as any).monaco !== 'undefined');
    
    if (monacoAvailable) {
      isMonacoInitialized = true;
      return;
    }
    
    await new Promise((resolve) => setTimeout(resolve, delay));
    attempts++;
  }
  
  // If we've exhausted attempts, check one more time
  if ((window as any).monaco?.editor || (window as any).require?.config) {
    isMonacoInitialized = true;
    return;
  }
  
  throw new Error('Monaco editor failed to initialize after waiting');
}

/**
 * Configure Monaco loader with proper initialization
 * This should be called once before any Monaco editor is used
 * 
 * Note: We configure the loader and ensure Monaco is ready before
 * any editor component tries to mount.
 */
export async function configureMonacoLoader(): Promise<void> {
  // If already initialized, return immediately
  if (isMonacoInitialized) {
    return Promise.resolve();
  }

  // If already configuring, return existing promise
  if (initializationPromise) {
    return initializationPromise;
  }

  // Create initialization promise
  initializationPromise = (async () => {
    try {
      // Configure loader to use CDN (default behavior)
      // This ensures Monaco is loaded from a reliable source
      if (loader && typeof loader.config === 'function') {
        loader.config({
          paths: {
            vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.54.0/min/vs',
          },
        });
      }

      isLoaderConfigured = true;

      // Pre-initialize Monaco to ensure it's ready before components mount
      // This prevents race conditions where the editor tries to use Monaco
      // before it's fully loaded
      if (loader && typeof loader.init === 'function') {
        try {
          // Initialize Monaco - this loads the Monaco editor files
          await loader.init();
          isMonacoInitialized = true;
        } catch (initError) {
          // If init fails, it might be because Monaco is already initializing
          // or @monaco-editor/react will handle it. We'll wait for it to be ready.
          console.warn('Monaco loader.init() failed, will wait for availability:', initError);
          // Don't mark as initialized yet - waitForMonacoReady will handle it
        }
      }
    } catch (error) {
      // Reset on error so we can retry
      isLoaderConfigured = false;
      isMonacoInitialized = false;
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
 * ensure the loader is configured and wait for Monaco to be available.
 */
export async function waitForMonacoReady(): Promise<void> {
  // Ensure loader is configured first
  await configureMonacoLoader();

  // If already initialized, return immediately
  if (isMonacoInitialized) {
    return;
  }

  // Wait for Monaco to be available (using internal function to avoid circular dependency)
  await waitForMonacoAvailability();
}

/**
 * Check if Monaco loader is configured
 */
export function isMonacoLoaderConfigured(): boolean {
  return isLoaderConfigured;
}

/**
 * Check if Monaco is fully initialized and ready to use
 */
export function isMonacoReady(): boolean {
  return isMonacoInitialized;
}
