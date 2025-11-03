'use client';

import { usePathname, useRouter } from 'next/navigation';
import { memo, useCallback, useState, useEffect, useRef } from 'react';
import { useBackendStore } from '@/lib/store/backend';
import { toastPatterns } from '@/lib/utils/toast-helpers';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useSession } from 'next-auth/react';
import { useLoginModal } from '@/hooks/use-login-modal';
import { useLibraryStats } from '@/hooks/use-library-stats';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { SidebarHeader } from './sidebar/SidebarHeader';
import { NavigationItem } from './sidebar/NavigationItem';
import { QuickActions } from './sidebar/QuickActions';
import { NAVIGATION_ITEMS } from './sidebar/navigation-config';

interface SidebarProps {
  className?: string;
  shareId?: string;
  isMobile?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function SidebarComponent({
  className,
  isMobile = false,
  isOpen = false,
  onOpenChange,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { openModal } = useLoginModal();
  // Use selective subscriptions to prevent unnecessary re-renders
  const uploadJson = useBackendStore((state) => state.uploadJson);
  const showLibraryHint = useBackendStore((state) => state.showLibraryHint);
  const isDirty = useBackendStore((state) => state.isDirty);
  const sidebarScrollPosition = useBackendStore((state) => state.sidebarScrollPosition);
  const setSidebarScrollPosition = useBackendStore((state) => state.setSidebarScrollPosition);
  const { totalJsons } = useLibraryStats();
  const [showNewDraftDialog, setShowNewDraftDialog] = useState(false);

  // Scroll position persistence
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Restore scroll position on mount
  useEffect(() => {
    if (scrollAreaRef.current && sidebarScrollPosition > 0) {
      // Use setTimeout to ensure the component is fully rendered
      setTimeout(() => {
        if (scrollAreaRef.current) {
          scrollAreaRef.current.scrollTop = sidebarScrollPosition;
        }
      }, 0);
    }
  }, [sidebarScrollPosition]);

  // Save scroll position on scroll
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const scrollTop = e.currentTarget.scrollTop;
      // Debounce scroll updates to avoid excessive store updates
      interface WindowWithSidebarTimeout extends Window {
        __sidebarScrollTimeout?: NodeJS.Timeout;
      }
      const win = window as WindowWithSidebarTimeout;
      clearTimeout(win.__sidebarScrollTimeout);
      win.__sidebarScrollTimeout = setTimeout(() => {
        setSidebarScrollPosition(scrollTop);
      }, 150);
    },
    [setSidebarScrollPosition]
  );

  const handleNewDraftClick = useCallback(() => {
    if (isDirty) {
      setShowNewDraftDialog(true);
    } else {
      createNewDraft();
    }
  }, [isDirty]);

  const createNewDraft = useCallback(() => {
    // Clear the document state for a truly new draft
    // This allows creating fresh documents while maintaining proper sharing behavior
    useBackendStore.setState({
      currentDocument: null,
      currentJson: '',
      isDirty: false,
      shareId: '',
    });

    // Navigate to editor page for new draft
    router.push('/edit');
  }, [router]);

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Close mobile sidebar if open
      if (isMobile && onOpenChange) {
        onOpenChange(false);
      }

      try {
        const document = await uploadJson(file);
        toastPatterns.success.uploaded(document.title);
      } catch (error) {
        toastPatterns.error.upload(error);
      }

      // Reset file input
      e.target.value = '';
    },
    [uploadJson, isMobile, onOpenChange]
  );

  // Determine current state for each navigation item
  const isItemCurrent = useCallback(
    (item: (typeof NAVIGATION_ITEMS)[0]) => {
      const p = pathname || '';
      if (item.id === 'viewer') return p === '/view';
      return p.startsWith(item.href);
    },
    [pathname]
  );

  // Handle navigation click (close mobile menu)
  const handleNavClick = useCallback(() => {
    if (isMobile && onOpenChange) {
      onOpenChange(false);
    }
  }, [isMobile, onOpenChange]);

  const sidebarContent = (
    <div
      className={cn(
        'flex h-full w-64 flex-col border-r bg-background transition-all duration-200 ease-in-out',
        className
      )}
    >
      {/* Header */}
      <SidebarHeader
        isMobile={isMobile}
        onClose={onOpenChange ? () => onOpenChange(false) : undefined}
      />

      {/* Navigation */}
      <div ref={scrollAreaRef} className="flex-1 px-4 overflow-auto" onScroll={handleScroll}>
        <div className="flex flex-col gap-2 py-4">
          {NAVIGATION_ITEMS.map((item) => {
            const requiresAuth = item.id === 'saved' || Boolean(item.requiresAuth);
            const isLocked = Boolean(requiresAuth && !session);
            const current = isItemCurrent(item);
            // Always render badge/hint on server, only hide on client if not ready
            // This prevents hydration mismatch
            const showBadge = item.id === 'saved' && Boolean(session);
            const showHint = showLibraryHint && item.id === 'saved';

            return (
              <NavigationItem
                key={item.id}
                id={item.id}
                name={item.name}
                href={item.href}
                icon={item.icon}
                description={item.description}
                current={current}
                isLocked={isLocked}
                showBadge={showBadge}
                badgeCount={totalJsons}
                showHint={showHint}
                onNavClick={handleNavClick}
                onLockedClick={() => {
                  openModal('library');
                  handleNavClick();
                }}
              />
            );
          })}
        </div>

        <Separator className="my-4" />

        {/* Quick Actions */}
        <QuickActions
          onNewDraft={() => {
            handleNewDraftClick();
            handleNavClick();
          }}
          onUploadClick={() => {
            document.getElementById('sidebar-file-upload')?.click();
            handleNavClick();
          }}
        />
        <input
          id="sidebar-file-upload"
          type="file"
          accept=".json,.txt"
          className="hidden"
          onChange={handleUpload}
        />
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={showNewDraftDialog}
        onOpenChange={setShowNewDraftDialog}
        title="Discard Changes"
        description="You have unsaved changes. Creating a new draft will discard them. Are you sure you want to continue?"
        confirmText="Discard Changes"
        cancelText="Keep Editing"
        variant="destructive"
        onConfirm={createNewDraft}
      />
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent side="left" className="p-0 w-64 max-w-64" hideCloseButton={true}>
          {sidebarContent}
        </SheetContent>
      </Sheet>
    );
  }

  return sidebarContent;
}

export const Sidebar = memo(SidebarComponent);
