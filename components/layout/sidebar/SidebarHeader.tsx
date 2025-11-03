'use client';

import { memo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileJson, X } from 'lucide-react';

interface SidebarHeaderProps {
  isMobile: boolean;
  onClose?: () => void;
}

function SidebarHeaderComponent({ isMobile, onClose }: SidebarHeaderProps) {
  return (
    <div className="flex h-16 items-center justify-between border-b px-6">
      <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <FileJson className="h-6 w-6 text-primary transition-transform hover:scale-110" />
        <span className="text-xl font-semibold text-foreground">JSON Viewer</span>
      </Link>

      {/* Close button for mobile */}
      {isMobile && onClose && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="lg:hidden hover:bg-accent transition-colors min-h-[44px] min-w-[44px] h-11 w-11"
        >
          <X className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}

export const SidebarHeader = memo(SidebarHeaderComponent);
