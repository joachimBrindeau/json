/**
 * OAuth provider configurations for NextAuth
 * Centralizes GitHub and Google provider setup
 */

import GitHubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import { config } from '@/lib/config';
import { logger } from '@/lib/logger';

/**
 * Validates OAuth provider configuration
 * 
 * In production/test mode: Throws error if required credentials are missing
 * This ensures OAuth providers are properly configured before the app starts
 */
function validateProviderConfig(provider: 'github' | 'google') {
  // Skip validation in test mode (test credentials are provided via env defaults)
  if (config.isTest) {
    return;
  }

  // Skip validation during build time (NEXT_PHASE indicates Next.js build phase)
  const skipValidation = process.env.SKIP_ENV_VALIDATION === 'true' || process.env.NEXT_PHASE === 'phase-production-build';
  if (skipValidation) {
    return;
  }

  const providerConfig = config.auth.providers[provider];
  
  if (!providerConfig.clientId || !providerConfig.clientSecret) {
    const error = new Error(
      `Missing OAuth configuration for ${provider}. Please set ${provider.toUpperCase()}_CLIENT_ID and ${provider.toUpperCase()}_CLIENT_SECRET environment variables.`
    );
    logger.error(
      { provider, hasClientId: !!providerConfig.clientId, hasClientSecret: !!providerConfig.clientSecret },
      error.message
    );
    throw error;
  }

  // Validate NEXTAUTH_URL is set (required for OAuth callbacks)
  if (!config.auth.url) {
    logger.error(
      { provider },
      'NEXTAUTH_URL is not configured. OAuth callbacks will fail.'
    );
  }
}

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
  // Explicitly request user:email scope to ensure email is available
  // GitHub default scope includes user:email, but being explicit is better
  // Note: GitHub may still return null email if user has private email settings
  authorization: {
    params: {
      scope: 'read:user user:email',
    },
  },
  profile(profile) {
    // Validate required fields from GitHub
    if (!profile.id) {
      throw new Error('GitHub profile missing required field (id)');
    }

    // Note: GitHub may return null email if user has private email settings
    // This will be handled in the signIn callback (account linking won't work without email)
    // We log a warning but don't throw to allow the flow to continue
    if (!profile.email) {
      logger.warn(
        { githubId: profile.id, login: profile.login },
        'GitHub profile missing email - user may have private email settings'
      );
    }

    return {
      id: String(profile.id),
      name: profile.name || profile.login,
      email: profile.email?.toLowerCase().trim() || null,
      image: profile.avatar_url,
    };
  },
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
      // Use 'select_account' instead of 'consent' for better UX
      // This prompts user to select account but only asks consent if needed
      prompt: 'select_account',
      access_type: 'offline',
      response_type: 'code',
    },
  },
  profile(profile) {
    // Validate required fields from Google
    if (!profile.sub || !profile.email) {
      throw new Error('Google profile missing required fields (sub or email)');
    }

    return {
      id: profile.sub,
      name: profile.name || profile.email.split('@')[0],
      email: profile.email.toLowerCase().trim(),
      image: profile.picture,
    };
  },
});

// Validate provider configurations on server-side only
// This runs at module load time to catch configuration errors early
if (typeof window === 'undefined') {
  validateProviderConfig('github');
  validateProviderConfig('google');
}
