'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { ReactNode, useEffect, useRef } from 'react';
import type { Session } from 'next-auth';
import { useBackendStore } from '@/lib/store/backend';

interface AuthSessionProviderProps {
  children: ReactNode;
  session?: Session | null;
}

function SessionBridge() {
  const { status } = useSession();
  const prev = useRef<typeof status | null>(null);

  useEffect(() => {
    if (prev.current !== status) {
      // Only clear transient state on an actual login transition
      if (prev.current === 'unauthenticated' && status === 'authenticated') {
        try {
          useBackendStore.setState({
            currentDocument: null,
            shareId: '',
            lastSavedMeta: null,
            isDirty: false,
            isUploading: false,
            uploadProgress: 0,
          });
          useBackendStore.getState().updateSession();
        } catch {}
      }
      prev.current = status;
    }
  }, [status]);
  return null;
}

export function AuthSessionProvider({ children, session }: AuthSessionProviderProps) {
  return (
    <SessionProvider
      session={session}
      // Refetch session every 5 minutes
      refetchInterval={5 * 60}
      // Only refetch on window focus if session is stale (reduces unnecessary re-renders)
      refetchOnWindowFocus={false}
      // Only refetch if session is older than 1 minute
      refetchWhenOffline={false}
    >
      <SessionBridge />
      {children}
    </SessionProvider>
  );
}
