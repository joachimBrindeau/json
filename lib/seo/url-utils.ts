import { DEFAULT_SEO_CONFIG } from './constants';

/**
 * URL utilities for SEO
 * Centralized URL generation and normalization
 */

/**
 * Get canonical URL for a path
 * Normalizes URLs (removes trailing slashes, handles query params)
 */
export function getCanonicalUrl(path: string): string {
  const base = DEFAULT_SEO_CONFIG.siteUrl;
  
  // Normalize path
  let normalizedPath = path;
  
  // Remove leading slash if present (we'll add it)
  if (normalizedPath.startsWith('/')) {
    normalizedPath = normalizedPath.slice(1);
  }
  
  // Handle home page
  if (normalizedPath === '' || normalizedPath === 'home') {
    return base;
  }
  
  // Remove trailing slash
  normalizedPath = normalizedPath.replace(/\/$/, '');
  
  // Remove query parameters (canonical URLs should not include them)
  const pathWithoutQuery = normalizedPath.split('?')[0];
  
  return `${base}/${pathWithoutQuery}`;
}

/**
 * Get full OG image URL
 * Handles both absolute and relative URLs
 */
export function getOgImageUrl(imagePath?: string | null): string {
  if (!imagePath) {
    return `${DEFAULT_SEO_CONFIG.siteUrl}${DEFAULT_SEO_CONFIG.ogImage}`;
  }
  
  // If already absolute URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // If starts with /, it's a relative path
  if (imagePath.startsWith('/')) {
    return `${DEFAULT_SEO_CONFIG.siteUrl}${imagePath}`;
  }
  
  // Otherwise, prepend base URL
  return `${DEFAULT_SEO_CONFIG.siteUrl}/${imagePath}`;
}

/**
 * Build sitemap URL
 */
export function getSitemapUrl(path: string = ''): string {
  const base = DEFAULT_SEO_CONFIG.siteUrl;
  if (path) {
    return `${base}/sitemap-${path}.xml`;
  }
  return `${base}/sitemap.xml`;
}
