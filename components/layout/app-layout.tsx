'use client';

import { Sidebar } from '@/components/sidebar';
import { ReactNode } from 'react';

interface AppLayoutProps {
  children: ReactNode;
  shareId?: string;
}

export function AppLayout({ children, shareId }: AppLayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar shareId={shareId} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
