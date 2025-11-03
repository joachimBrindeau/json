/**
 * Authentication constants
 * Shared constants used across authentication modules
 */

import type { LoginContext } from './types';

/**
 * Session configuration
 */
export const SESSION_CONFIG = {
  strategy: 'jwt' as const,
  maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
};

/**
 * Password requirements
 */
export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: false,
  requireLowercase: false,
  requireNumbers: false,
  requireSpecialChars: false,
};

/**
 * bcrypt hashing rounds
 * Higher = more secure but slower
 * 10 rounds is recommended for most applications
 */
export const BCRYPT_ROUNDS = 10;

/**
 * Login context messages
 * Used in login modal to customize messaging based on user action
 */
export const LOGIN_CONTEXT_MESSAGES: Record<string, { title: string; description: string }> = {
  default: {
    title: 'Sign in to JSON Viewer',
    description: 'Sign in to save your JSONs permanently and access advanced features',
  },
  general: {
    title: 'Sign in to JSON Viewer',
    description: 'Sign in to save your JSONs permanently and access advanced features',
  },
  library: {
    title: 'Access Your Library',
    description: 'Sign in to view and manage your saved JSONs',
  },
  save: {
    title: 'Save to Library',
    description: 'Sign in to save this JSON permanently to your library',
  },
  share: {
    title: 'Share Permanently',
    description: 'Sign in to create permanent share links that never expire',
  },
  expire: {
    title: 'Save Before It Expires',
    description: 'This JSON will expire soon. Sign in to save it permanently',
  },
  publish: {
    title: 'Publish to Community',
    description: 'Sign in to publish your JSON to the public community library',
  },
  profile: {
    title: 'Access Your Profile',
    description: 'Sign in to manage your account and preferences',
  },
  admin: {
    title: 'Admin Access Required',
    description: 'Sign in with your admin account to access this feature',
  },
};

/**
 * OAuth provider names
 */
export const OAUTH_PROVIDERS = {
  GITHUB: 'github' as const,
  GOOGLE: 'google' as const,
};

/**
 * Authentication error messages
 */
export const AUTH_ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  MISSING_CREDENTIALS: 'Please enter both email and password',
  DATABASE_UNAVAILABLE: 'Service temporarily unavailable',
  ACCOUNT_NOT_FOUND: 'No account found with this email',
  OAUTH_SIGNIN_FAILED: 'Failed to sign in with OAuth provider',
  SESSION_REQUIRED: 'You must be signed in to access this resource',
  ADMIN_REQUIRED: 'Admin access required',
};
