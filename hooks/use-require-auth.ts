import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useLoginModal } from '@/hooks/use-login-modal';

type LoginContext = 'library' | 'save' | 'share' | 'expire' | 'general' | 'publish';

interface UseRequireAuthOptions {
  redirectTo?: string;
  loginModalSource?: LoginContext;
  onUnauthenticated?: () => void;
}

/**
 * Hook to require authentication for a page
 * Redirects unauthenticated users and shows login modal
 */
export function useRequireAuth(options: UseRequireAuthOptions = {}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { openModal } = useLoginModal();
  const {
    redirectTo = '/',
    loginModalSource = 'save',
    onUnauthenticated,
  } = options;

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      if (onUnauthenticated) {
        onUnauthenticated();
      } else {
        openModal(loginModalSource);
        router.push(redirectTo);
      }
      return;
    }
  }, [session, status, router, openModal, redirectTo, loginModalSource, onUnauthenticated]);

  return {
    session,
    status,
    isAuthenticated: !!session,
    isLoading: status === 'loading',
  };
}

