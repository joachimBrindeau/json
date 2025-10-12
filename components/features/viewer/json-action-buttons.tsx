'use client';

import { useState, useCallback } from 'react';
import { UnifiedButton } from '@/components/ui/unified-button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Copy, Download, Share2, Code, Save, MoreHorizontal, Trash2 } from 'lucide-react';
import { useBackendStore } from '@/lib/store/backend';
import { useToast } from '@/hooks/use-toast';
import { copyJsonToClipboard, downloadJson } from '@/lib/json';
import { UnifiedShareModal } from '@/components/features/modals/unified-share-modal';
import { EmbedModal } from '@/components/features/modals/embed-modal';
import { useSession } from 'next-auth/react';
import { useLoginModal } from '@/hooks/use-login-modal';

export function JsonActionButtons() {
  const { toast } = useToast();
  const { data: session } = useSession();
  const { openModal } = useLoginModal();
  const {
    currentJson,
    currentDocument,
    shareId,
    shareJson,
    saveJson,
    deleteDocument,
    isDirty,
  } = useBackendStore();

  const [unifiedShareModalOpen, setUnifiedShareModalOpen] = useState(false);
  const [embedModalOpen, setEmbedModalOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleSave = useCallback(async () => {
    if (!currentJson) {
      showToast('No JSON', 'Please enter some JSON to save', 'destructive');
      return;
    }

    if (!session) {
      openModal('save');
      return;
    }

    // If it's a new document (no currentDocument) and has no title, open share modal for title input
    if (!currentDocument) {
      setUnifiedShareModalOpen(true);
      return;
    }

    try {
      setIsSaving(true);
      await saveJson();
      showToast('Saved', currentDocument ? 'JSON updated successfully' : 'JSON saved to library');
    } catch (_) {
      showToast('Error', 'Failed to save JSON', 'destructive');
    } finally {
      setIsSaving(false);
    }
  }, [currentJson, currentDocument, saveJson, showToast, session, openModal]);

  const handleCopyJson = useCallback(() => {
    if (!currentJson) {
      showToast('No JSON', 'Please enter some JSON first', 'destructive');
      return;
    }
    copyJsonToClipboard(currentJson, showToast);
  }, [currentJson, showToast]);

  const handleExport = useCallback(() => {
    if (!currentJson) {
      showToast('No JSON', 'Please enter some JSON first', 'destructive');
      return;
    }
    const filename = currentDocument?.title
      ? `${currentDocument.title.replace(/[^a-z0-9]/gi, '_')}.json`
      : `json-${shareId || Date.now()}.json`;
    downloadJson(currentJson, filename, showToast);
  }, [currentJson, currentDocument?.title, shareId, showToast]);

  const handleShare = useCallback(async () => {
    if (!currentJson) {
      showToast('No JSON', 'Please enter some JSON to share', 'destructive');
      return;
    }

    setIsSharing(true);

    try {
      await shareJson();
      // Only open modal after shareJson completes successfully 
      setUnifiedShareModalOpen(true);
    } catch (error) {
      console.error('Share error:', error);
      // Even if sharing fails, still open the modal - it can handle creating/saving the JSON
      setUnifiedShareModalOpen(true);
      showToast('Info', 'Opening share dialog...', 'default');
    } finally {
      setIsSharing(false);
    }
  }, [currentJson, shareJson, showToast]);

  const handleEmbed = useCallback(() => {
    if (!currentJson) {
      showToast('No JSON', 'Please enter some JSON to embed', 'destructive');
      return;
    }

    if (!session) {
      openModal('share');
      return;
    }

    setEmbedModalOpen(true);
  }, [currentJson, showToast, session, openModal]);

  const handleDelete = useCallback(async () => {
    if (!currentDocument?.shareId) {
      showToast('No document', 'No saved document to delete', 'destructive');
      return;
    }

    if (!session) {
      openModal();
      return;
    }

    // Confirm deletion
    const confirmed = window.confirm(
      `Are you sure you want to delete "${currentDocument.title || 'this document'}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await deleteDocument(currentDocument.shareId);
      showToast('Document deleted', 'The document has been successfully deleted');
    } catch (error) {
      console.error('Delete error:', error);
      showToast('Delete failed', 'Failed to delete the document', 'destructive');
    } finally {
      setIsDeleting(false);
    }
  }, [currentDocument, session, deleteDocument, showToast, openModal]);

  return (
    <>
      {/* Desktop view - show all buttons */}
      <div className="hidden sm:flex items-center gap-1">
        <UnifiedButton
          variant="green"
          size="xs"
          icon={Save}
          text={session ? "Save" : "Sign in"}
          onClick={handleSave}
          disabled={isSaving || !currentJson}
          isLoading={isSaving}
          loadingText="Saving..."
          title={session ? "Save to library" : "Sign in to save"}
        />

        {/* Delete button - only show if document is saved */}
        {currentDocument?.shareId && session && (
          <UnifiedButton
            variant="destructive"
            size="xs"
            icon={Trash2}
            text="Delete"
            onClick={handleDelete}
            disabled={isDeleting}
            isLoading={isDeleting}
            loadingText="Deleting..."
            title="Delete this document"
          />
        )}
        
        <UnifiedButton
          variant="outline"
          size="xs"
          icon={Copy}
          text="Copy"
          onClick={handleCopyJson}
          disabled={!currentJson}
          title="Copy JSON"
        />
        
        <UnifiedButton
          variant="outline"
          size="xs"
          icon={Download}
          text="Export"
          onClick={handleExport}
          disabled={!currentJson}
          title="Export JSON"
        />
        
        <UnifiedButton
          variant="outline"
          size="xs"
          icon={Share2}
          text="Share"
          onClick={handleShare}
          disabled={!currentJson || isSharing}
          isLoading={isSharing}
          loadingText="Sharing..."
          title="Share JSON"
        />
        
        <UnifiedButton
          variant="outline"
          size="xs"
          icon={Code}
          text="Embed"
          onClick={handleEmbed}
          disabled={!currentJson}
          title="Embed JSON"
        />
      </div>

      {/* Mobile view - dropdown menu */}
      <div className="sm:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <UnifiedButton
              variant="outline"
              size="xs"
              icon={MoreHorizontal}
              className="w-7 px-0"
              title="More actions"
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={handleSave}
              disabled={isSaving || !currentJson}
              className="text-sm"
            >
              <Save className="h-3 w-3 mr-2" />
              {session ? "Save to library" : "Sign in to save"}
            </DropdownMenuItem>

            {/* Delete option - only show if document is saved */}
            {currentDocument?.shareId && session && (
              <DropdownMenuItem
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-sm text-red-600 dark:text-red-400"
              >
                <Trash2 className="h-3 w-3 mr-2" />
                {isDeleting ? "Deleting..." : "Delete"}
              </DropdownMenuItem>
            )}
            
            <DropdownMenuItem
              onClick={handleCopyJson}
              disabled={!currentJson}
              className="text-sm"
            >
              <Copy className="h-3 w-3 mr-2" />
              Copy JSON
            </DropdownMenuItem>
            
            <DropdownMenuItem
              onClick={handleExport}
              disabled={!currentJson}
              className="text-sm"
            >
              <Download className="h-3 w-3 mr-2" />
              Export JSON
            </DropdownMenuItem>
            
            <DropdownMenuItem
              onClick={handleShare}
              disabled={!currentJson || isSharing}
              className="text-sm"
            >
              <Share2 className="h-3 w-3 mr-2" />
              Share JSON
            </DropdownMenuItem>
            
            <DropdownMenuItem
              onClick={handleEmbed}
              disabled={!currentJson}
              className="text-sm"
            >
              <Code className="h-3 w-3 mr-2" />
              Embed JSON
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <UnifiedShareModal 
        open={unifiedShareModalOpen} 
        onOpenChange={setUnifiedShareModalOpen} 
        shareId={shareId || ''} 
        currentTitle={currentDocument?.title}
        currentVisibility={currentDocument?.visibility as 'public' | 'private'}
        onUpdated={async (title?: string) => {
          // If this is a save operation without current document, save the JSON now
          if (!currentDocument && title) {
            try {
              setIsSaving(true);
              await saveJson(title);
              // After saving, the store should be updated with new shareId and currentDocument
              // Show success message but keep modal open to display the generated link
              showToast('Saved', `JSON saved as "${title}" - link generated!`);
            } catch (_) {
              showToast('Error', 'Failed to save JSON', 'destructive');
            } finally {
              setIsSaving(false);
            }
          } else {
            // Regular share/update operation
            showToast('Updated', 'JSON sharing settings updated successfully');
          }
        }}
      />
      
      <EmbedModal
        isOpen={embedModalOpen}
        onClose={() => setEmbedModalOpen(false)}
        shareId={shareId || ''}
        jsonPreview={currentJson ? currentJson.slice(0, 500) : undefined}
      />
    </>
  );
}