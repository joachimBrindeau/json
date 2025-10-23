/**
 * Shared TypeScript types for authentication system
 *
 * This file contains all shared types used across the authentication modules.
 * Import these types instead of using 'any' or duplicating type definitions.
 */

import type { User as PrismaUser } from '@prisma/client';

/**
 * Authentication user object
 * Used in NextAuth callbacks and session
 */
export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
}

/**
 * Extended session object with user data
 * Used in session callback and client-side session access
 */
export interface AuthSession {
  user: AuthUser;
  expires: string;
}

/**
 * Login context types
 * Used to customize login modal messaging based on user action
 */
export type LoginContext = 'default' | 'save' | 'share' | 'library' | 'profile' | 'admin';

/**
 * OAuth provider types
 * Supported OAuth providers in the application
 */
export type OAuthProvider = 'github' | 'google';

/**
 * User update data for account linking
 * Used when updating user information from OAuth providers
 */
export interface UserUpdateData {
  image?: string;
  name?: string;
  lastLoginAt?: Date;
}

/**
 * Login form data
 * Used in login modal component
 */
export interface LoginFormData {
  email: string;
  password: string;
}

/**
 * Signup form data
 * Used in signup modal component
 */
export interface SignupFormData {
  email: string;
  password: string;
  name?: string;
}

/**
 * Password validation result
 * Used in password strength validation
 */
export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
}

/**
 * Authentication error types
 * Standardized error types for authentication failures
 */
export type AuthErrorType =
  | 'CredentialsSignin'
  | 'OAuthSignin'
  | 'OAuthCallback'
  | 'OAuthCreateAccount'
  | 'EmailCreateAccount'
  | 'Callback'
  | 'OAuthAccountNotLinked'
  | 'EmailSignin'
  | 'CredentialsSignup'
  | 'SessionRequired'
  | 'Default';

/**
 * Authentication error object
 * Used for structured error handling
 */
export interface AuthError {
  type: AuthErrorType;
  message: string;
  code?: string;
}

/**
 * Session user type (for client-side usage)
 * Matches NextAuth session.user structure
 */
export interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
}

/**
 * Extended JWT token with custom claims
 * Used in JWT callback
 */
export interface ExtendedJWT {
  id?: string;
  email?: string;
  name?: string;
  image?: string;
  sub?: string;
}

/**
 * Account linking result
 * Returned from linkOAuthAccount function
 */
export interface AccountLinkingResult {
  userId: string | null;
  isNewAccount: boolean;
  wasLinked: boolean;
}
