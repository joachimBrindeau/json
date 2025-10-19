/**
 * OAuth provider configurations for NextAuth
 * Centralizes GitHub and Google provider setup
 */

import GitHubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import { config } from '@/lib/config';

/**
 * GitHub OAuth provider configuration
 * 
 * SECURITY: allowDangerousEmailAccountLinking is SAFE because:
 * - GitHub verifies email ownership
 * - No unverified email/password signup exists
 * - Account linking only for OAuth providers
 * 
 * See: docs/security/AUTHENTICATION_SECURITY.md
 */
export const githubProvider = GitHubProvider({
  clientId: config.auth.providers.github.clientId,
  clientSecret: config.auth.providers.github.clientSecret,
  /**
   * SECURITY: allowDangerousEmailAccountLinking is SAFE in this context because:
   * 
   * 1. OAuth providers (GitHub, Google) verify email ownership before providing access
   * 2. Users cannot sign up with unverified email/password (no credentials signup endpoint)
   * 3. Only verified OAuth providers can trigger account linking
   * 4. Account linking logic in signIn callback ensures proper validation
   * 
   * Prerequisites for safety:
   * - OAuth providers MUST verify email addresses (GitHub and Google both do)
   * - No unverified email/password signup allowed
   * - Account linking only happens for OAuth providers (not credentials)
   * 
   * WARNING: If you add email/password signup without email verification,
   * you MUST remove this flag or implement email verification first!
   * Otherwise, attackers could create accounts with victim's email and
   * hijack their OAuth accounts when they sign in.
   * 
   * See: lib/auth/account-linking.ts for the linking implementation
   */
  allowDangerousEmailAccountLinking: true,
});

/**
 * Google OAuth provider configuration
 * 
 * SECURITY: allowDangerousEmailAccountLinking is SAFE because:
 * - Google verifies email ownership
 * - No unverified email/password signup exists
 * - Account linking only for OAuth providers
 * 
 * See: docs/security/AUTHENTICATION_SECURITY.md
 */
export const googleProvider = GoogleProvider({
  clientId: config.auth.providers.google.clientId,
  clientSecret: config.auth.providers.google.clientSecret,
  /**
   * SECURITY: allowDangerousEmailAccountLinking is SAFE in this context because:
   * 
   * 1. OAuth providers (GitHub, Google) verify email ownership before providing access
   * 2. Users cannot sign up with unverified email/password (no credentials signup endpoint)
   * 3. Only verified OAuth providers can trigger account linking
   * 4. Account linking logic in signIn callback ensures proper validation
   * 
   * Prerequisites for safety:
   * - OAuth providers MUST verify email addresses (GitHub and Google both do)
   * - No unverified email/password signup allowed
   * - Account linking only happens for OAuth providers (not credentials)
   * 
   * WARNING: If you add email/password signup without email verification,
   * you MUST remove this flag or implement email verification first!
   * Otherwise, attackers could create accounts with victim's email and
   * hijack their OAuth accounts when they sign in.
   * 
   * See: lib/auth/account-linking.ts for the linking implementation
   */
  allowDangerousEmailAccountLinking: true,
  authorization: {
    params: {
      scope: 'openid email profile',
      prompt: 'consent',
      access_type: 'offline',
      response_type: 'code'
    }
  },
  profile(profile) {
    return {
      id: profile.sub,
      name: profile.name,
      email: profile.email,
      image: profile.picture,
    };
  },
});

