'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import type { Session } from 'next-auth';

interface AuthSessionProviderProps {
  children: ReactNode;
  session?: Session | null;
}

export function AuthSessionProvider({ children, session }: AuthSessionProviderProps) {
  return (
    <SessionProvider
      session={session}
      // Refetch session every 5 minutes
      refetchInterval={5 * 60}
      // Refetch session when window gains focus
      refetchOnWindowFocus={true}
      // Only refetch if session is older than 1 minute
      refetchWhenOffline={false}
    >
      {children}
    </SessionProvider>
  );
}
