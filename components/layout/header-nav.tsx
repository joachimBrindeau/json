'use client';

import { useState, useCallback, memo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Check, X, Menu, Loader2, Edit2 } from 'lucide-react';
import { useBackendStore } from '@/lib/store/backend';
import { useToast } from '@/hooks/use-toast';

import { DynamicBreadcrumb } from '@/components/layout/dynamic-breadcrumb';
import { UserMenu } from '@/components/layout/user-menu';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useLoginModal } from '@/hooks/use-login-modal';

interface HeaderNavProps {
  onMobileMenuToggle?: () => void;
}

function HeaderNavComponent({ onMobileMenuToggle }: HeaderNavProps) {
  const { toast } = useToast();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { openModal } = useLoginModal();
  const {
    currentJson,
    currentDocument,
    shareId,
    updateTitle,
    isUploading,
    uploadProgress,
    isDirty,
    showLibraryHint,
    updateSession,
    migrateAnonymousData,
  } = useBackendStore();

  // Update store session when NextAuth session changes
  useEffect(() => {
    updateSession();
    if (session && status === 'authenticated') {
      migrateAnonymousData();
    }
  }, [session, status, updateSession, migrateAnonymousData]);


  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('');

  const showToast = useCallback(
    (title: string, description: string, variant?: string) => {
      toast({
        title,
        description,
        variant: variant as 'default' | 'destructive' | null | undefined,
      });
    },
    [toast]
  );


  const handleEditTitle = useCallback(() => {
    setEditTitle(currentDocument?.title || 'Untitled');
    setIsEditingTitle(true);
  }, [currentDocument?.title]);

  const handleSaveTitle = useCallback(async () => {
    if (!editTitle.trim()) {
      showToast('Error', 'Title cannot be empty', 'destructive');
      return;
    }

    try {
      await updateTitle(editTitle.trim());
      showToast('Success', `Title updated to "${editTitle.trim()}"`);
      setIsEditingTitle(false);
    } catch (error) {
      showToast(
        'Error',
        error instanceof Error ? error.message : 'Failed to update title',
        'destructive'
      );
    }
  }, [editTitle, updateTitle, showToast]);

  const handleCancelEdit = useCallback(() => {
    setIsEditingTitle(false);
    setEditTitle('');
  }, []);




  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="px-2">
        <div className="flex h-16 items-center justify-between" data-testid="navigation-menu">
          {/* Mobile menu button */}
          <div className="flex items-center gap-4">
            {onMobileMenuToggle && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onMobileMenuToggle}
                className="lg:hidden hover:bg-accent transition-colors min-h-[44px] min-w-[44px] h-11 w-11"
                aria-label="Toggle mobile menu"
              >
                <Menu className="h-6 w-6" />
              </Button>
            )}
            
          {/* Left side - Breadcrumb navigation */}
            <DynamicBreadcrumb
              currentTitle={currentDocument?.title || (pathname === '/' && currentDocument ? 'Untitled' : undefined)}
              onTitleEdit={pathname === '/' && currentDocument ? handleEditTitle : undefined}
              isEditingTitle={isEditingTitle}
              shareId={shareId}
              editTitleComponent={
                isEditingTitle ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="h-6 w-48 text-sm"
                      placeholder="Enter title..."
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveTitle();
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleSaveTitle}
                      className="h-6 w-6 p-0"
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCancelEdit}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : undefined
              }
            />

            {/* Document info badges - Hidden on mobile */}
            {currentDocument && pathname === '/' && (
              <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline" className="text-xs">
                  {currentDocument.nodeCount.toLocaleString()} nodes
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {(currentDocument.size / 1024).toFixed(1)} KB
                </Badge>
                <Badge variant="outline" className="text-xs capitalize">
                  {currentDocument.complexity.toLowerCase()}
                </Badge>
              </div>
            )}
          </div>

          {/* Right side - Action buttons */}
          <div className="flex items-center gap-2">
            {isUploading && (
              <div className="hidden sm:flex items-center gap-2 text-sm text-blue-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="hidden md:inline">Uploading... {uploadProgress}%</span>
                <span className="md:hidden">{uploadProgress}%</span>
              </div>
            )}

            

            
            
            {/* User menu / Sign in button */}
            <div className="ml-2">
              <UserMenu />
            </div>
          </div>
        </div>
      </div>



    </header>
  );
}

// Export memoized component
export const HeaderNav = memo(HeaderNavComponent);

// Mobile-first header wrapper component
export function MobileAwareHeader({ onMobileMenuToggle }: { onMobileMenuToggle?: () => void }) {
  return <HeaderNav onMobileMenuToggle={onMobileMenuToggle} />;
}
