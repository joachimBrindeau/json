'use client';

/**
 * OAuth Error Handler Component
 * 
 * Detects and handles OAuth authentication errors and success states from NextAuth callback URLs.
 * NextAuth redirects users back with error query parameters when OAuth fails.
 * 
 * Responsibilities:
 * - Handle OAuth errors from callback URL (error query parameter)
 * - Clean up URL parameters after handling errors
 * - Refresh session after successful OAuth authentication
 * - Handle callback URL redirects securely
 * 
 * Error types handled:
 * - OAuthSignin: Error in OAuth sign-in process
 * - OAuthCallback: Error in OAuth callback
 * - OAuthCreateAccount: Error creating account from OAuth
 * - OAuthAccountNotLinked: OAuth account email doesn't match existing account
 * - Configuration: OAuth provider configuration error
 * - AccessDenied: User denied access to OAuth provider
 * - Default: Generic OAuth error
 */

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { OAUTH_ERROR_MESSAGES } from '@/lib/auth/constants';

/**
 * Inner component that uses useSearchParams (requires Suspense)
 */
function OAuthErrorHandlerInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const { toast } = useToast();

  useEffect(() => {
    const error = searchParams?.get('error');
    const errorDescription = searchParams?.get('errorDescription');
    const callbackUrl = searchParams?.get('callbackUrl');
    // Check if we're coming from an OAuth callback by looking for callbackUrl or error param
    const isOAuthCallback = !!(error || callbackUrl);

    // Handle OAuth errors
    if (error) {
      // Get error message from centralized constants
      const errorMessage = OAUTH_ERROR_MESSAGES[error] || errorDescription || OAUTH_ERROR_MESSAGES.Default;

      // Log the error for debugging
      logger.error(
        {
          error,
          errorDescription,
          errorMessage,
          callbackUrl,
          searchParams: Object.fromEntries(searchParams?.entries() || []),
        },
        'OAuth authentication error detected'
      );

      // Show error toast
      toast({
        title: 'Authentication Error',
        description: errorMessage,
        variant: 'destructive',
        duration: 5000,
      });

      // Clean up URL by removing error parameters
      // This prevents the error from showing again on refresh
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.delete('error');
      currentUrl.searchParams.delete('errorDescription');
      currentUrl.searchParams.delete('callbackUrl');
      
      // Navigate to clean URL
      const cleanPath = currentUrl.pathname + (currentUrl.search || '');
      router.replace(cleanPath);
    } else if (isOAuthCallback && status === 'authenticated' && session) {
      // Only handle success case if we're coming from an OAuth callback
      // This prevents running on every page load for authenticated users
      
      // Successfully authenticated - refresh session to ensure it's up to date
      update().catch((err) => {
        logger.error({ err }, 'Failed to refresh session after OAuth sign-in');
      });

      // Handle callback URL redirect if present
      // Note: NextAuth's redirect callback already handles most redirects,
      // but we handle callbackUrl query param here as a fallback
      if (callbackUrl) {
        try {
          const callback = new URL(callbackUrl, window.location.origin);
          // Security: Only allow same-origin redirects
          if (callback.origin === window.location.origin && callbackUrl !== window.location.pathname) {
            // Clean up callback URL from query params before redirect
            const currentUrl = new URL(window.location.href);
            currentUrl.searchParams.delete('callbackUrl');
            // Use setTimeout to avoid conflicts with NextAuth's redirect callback
            setTimeout(() => {
              router.replace(callbackUrl);
            }, 100);
          }
        } catch (err) {
          // Invalid callback URL - log and ignore
          logger.warn({ err, callbackUrl }, 'Invalid callback URL after OAuth sign-in');
        }
      }
    }
  }, [searchParams, status, session, router, toast, update]);

  // This component doesn't render anything
  return null;
}

/**
 * OAuth Error Handler with Suspense boundary
 * 
 * Wraps the inner component in Suspense because useSearchParams requires it
 * in Next.js App Router when used in client components.
 */
export function OAuthErrorHandler() {
  return (
    <Suspense fallback={null}>
      <OAuthErrorHandlerInner />
    </Suspense>
  );
}
