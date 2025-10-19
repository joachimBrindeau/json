'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { memo, useCallback, useState, useEffect, useRef } from 'react';
import { useBackendStore } from '@/lib/store/backend';
import { toastPatterns } from '@/lib/utils/toast-helpers';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useSession } from 'next-auth/react';
import { useLoginModal } from '@/hooks/use-login-modal';
import { useLibraryStats } from '@/hooks/use-library-stats';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import {
  FileJson,
  Code2,
  Database,
  Plus,
  Upload,
  ChevronRight,
  Globe,
  X,
  GitCompare,
  ArrowRightLeft
} from 'lucide-react';

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
  onOpenChange 
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
  
  // Ensure client-only state is handled properly for hydration
  const [isClient, setIsClient] = useState(false);
  
  // Scroll position persistence
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Restore scroll position on mount
  useEffect(() => {
    if (isClient && scrollAreaRef.current && sidebarScrollPosition > 0) {
      // Use setTimeout to ensure the component is fully rendered
      setTimeout(() => {
        if (scrollAreaRef.current) {
          scrollAreaRef.current.scrollTop = sidebarScrollPosition;
        }
      }, 0);
    }
  }, [isClient, sidebarScrollPosition]);

  // Save scroll position on scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
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
  }, [setSidebarScrollPosition]);

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

  const navigation = [
    {
      id: 'viewer',
      name: 'View',
      href: '/view',
      icon: Code2,
      current: pathname === '/view',
      description: 'View JSON files',
    },
    {
      id: 'editor',
      name: 'Edit',
      href: '/edit',
      icon: FileJson,
      current: pathname.startsWith('/edit'),
      description: 'Create and edit JSON',
    },
    {
      id: 'format',
      name: 'Format',
      href: '/format',
      icon: FileJson,
      current: pathname.startsWith('/format'),
      description: 'Format and beautify JSON',
    },
    {
      id: 'convert',
      name: 'Convert',
      href: '/convert',
      icon: ArrowRightLeft,
      current: pathname.startsWith('/convert'),
      description: 'Convert between formats',
    },
    {
      id: 'compare',
      name: 'Compare',
      href: '/compare',
      icon: GitCompare,
      current: pathname.startsWith('/compare'),
      description: 'Compare JSON objects',
    },

    {
      id: 'library',
      name: 'Library',
      href: '/library',
      icon: Globe,
      current: pathname.startsWith('/library'),
      description: 'Browse public JSONs',
    },
    {
      id: 'saved',
      name: 'My Library',
      href: '/private',
      icon: Database,
      current: pathname.startsWith('/private'),
      description: 'Your saved JSON files',
      requiresAuth: true,
    },
  ];

  const sidebarContent = (
    <div className={cn('flex h-full w-64 flex-col border-r bg-background transition-all duration-200 ease-in-out', className)}>
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b px-6">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <FileJson className="h-6 w-6 text-primary transition-transform hover:scale-110" />
          <span className="text-xl font-semibold text-foreground">
            JSON Viewer
          </span>
        </Link>
        
        {/* Close button for mobile */}
        {isMobile && onOpenChange && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="lg:hidden hover:bg-accent transition-colors min-h-[44px] min-w-[44px] h-11 w-11"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <div 
        ref={scrollAreaRef} 
        className="flex-1 px-4 overflow-auto" 
        onScroll={handleScroll}
      >
        <div className="space-y-2 py-4">

          {navigation.map((item) => {
            const Icon = item.icon;
            const requiresAuth = item.id === 'saved' || item.requiresAuth;
            const isLocked = requiresAuth && !session;
            
            const handleNavClick = () => {
              if (isMobile && onOpenChange) {
                onOpenChange(false);
              }
            };

            if (isLocked) {
              return (
                <div key={item.id}>
                  <Button
                    variant="ghost"
                    className={cn(
                      'w-full justify-start gap-3 px-3 py-6 h-auto cursor-pointer select-none',
                      'opacity-75 hover:opacity-90 hover:bg-accent/50 transition-all duration-200',
                      'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                    )}
                    onClick={() => {
                      openModal('saved');
                      handleNavClick();
                    }}
                  >
                    <Icon className="h-5 w-5" />
                    <div className="flex flex-col items-start gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.name}</span>
                        {item.id === 'saved' && session && isClient && totalJsons > 0 && (
                          <Badge
                            variant="secondary"
                            className="text-xs px-1.5 py-0 h-4 min-w-[16px] rounded-[3px] flex items-center justify-center"
                          >
                            {totalJsons}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-red-800 hover:text-red-900 bg-red-50 px-2 py-1 rounded-[3px]">
                        Sign in to access
                      </span>
                    </div>
                  </Button>
                  {isClient && showLibraryHint && item.id === 'saved' && (
                    <div className="px-3 py-2 text-xs text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 rounded-md mx-2 mt-1">
                      💡 Sign in to save JSONs permanently
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link key={item.id} href={item.href} onClick={handleNavClick} data-testid={`nav-${item.id}`} prefetch={true}>
                <div
                  className={cn(
                    'inline-flex items-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background',
                    'focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
                    '[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
                    'w-full justify-start gap-3 px-3 py-6 h-auto select-none transition-all duration-200',
                    'hover:scale-[1.02] hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    item.current ? 'bg-secondary text-secondary-foreground shadow-sm border border-border/50' : 'hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <div className="flex flex-col items-start gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.name}</span>
                    {item.id === 'saved' && session && isClient && totalJsons > 0 && (
                      <Badge
                        variant="secondary"
                        className="text-xs px-1.5 py-0 h-4 min-w-[16px] rounded-[3px] flex items-center justify-center"
                      >
                        {totalJsons}
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{item.description}</span>
                </div>
                {item.current && <ChevronRight className="ml-auto h-4 w-4" />}
              </div>
              </Link>
            );
          })}
        </div>

        <Separator className="my-4" />

        {/* Quick Actions */}
        <div className="space-y-2 py-2">
          <div className="pb-2">
            <h2 className="mb-2 px-2 text-sm font-semibold tracking-tight text-muted-foreground">
              Quick Actions
            </h2>
          </div>

          <div className="w-full">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2 transition-all duration-200 hover:scale-[1.02] hover:shadow-sm"
              onClick={() => {
                handleNewDraftClick();
                if (isMobile && onOpenChange) onOpenChange(false);
              }}
            >
              <Plus className="h-4 w-4 transition-transform group-hover:scale-110" />
              New draft
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 transition-all duration-200 hover:scale-[1.02] hover:shadow-sm group"
            onClick={() => {
              document.getElementById('sidebar-file-upload')?.click();
              if (isMobile && onOpenChange) onOpenChange(false);
            }}
          >
            <Upload className="h-4 w-4 transition-transform group-hover:scale-110" />
            New upload
          </Button>
          <input
            id="sidebar-file-upload"
            type="file"
            accept=".json,.txt"
            className="hidden"
            onChange={handleUpload}
          />
        </div>
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
