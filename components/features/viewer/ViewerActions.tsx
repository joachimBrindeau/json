'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Copy,
  Download,
  Share2,
  Code,
  Save,
  MoreHorizontal,
  Trash2,
  Lock,
  Globe,
  ExternalLink,
  PaintbrushIcon,
  Zap,
  Minimize2,
} from 'lucide-react';
import { useBackendStore } from '@/lib/store/backend';

import {
  toastPatterns,
  showErrorToast,
  showSuccessToast,
  showInfoToast,
} from '@/lib/utils/toast-helpers';
import { copyJsonToClipboard, downloadJson } from '@/lib/json/json-utils';
import { ShareModal } from '@/components/features/modals';
import { EmbedModal } from '@/components/features/modals/embed-modal';
import { ExportModal } from '@/components/features/modals/export-modal';
import { useSession } from 'next-auth/react';
import { useLoginModal } from '@/hooks/use-login-modal';
import { logger } from '@/lib/logger';
import { IconDropdown, type DropdownAction } from '@/components/features/editor/IconDropdown';
import { useToast } from '@/hooks/use-toast';
import { validateJson } from '@/lib/utils/json-validators';

interface ViewerActionsProps {
  /** Editor value for format/minify operations */
  value?: string;
  /** Callback to update editor value */
  onChange?: (value: string) => void;
  /** Additional custom actions to show in magic dropdown */
  customMagicActions?: DropdownAction[];
  /** Whether to show format actions (brush button) */
  enableFormatActions?: boolean;
}

export function ViewerActions({
  value = '',
  onChange,
  customMagicActions = [],
  enableFormatActions = true,
}: ViewerActionsProps = {}) {
  const { data: session } = useSession();
  const { openModal } = useLoginModal();
  const { toast } = useToast();
  const currentJson = useBackendStore((s) => s.currentJson);
  const currentDocument = useBackendStore((s) => s.currentDocument);
  const shareId = useBackendStore((s) => s.shareId);
  const isDirty = useBackendStore((s) => s.isDirty);
  const shareJson = useBackendStore((s) => s.shareJson);
  const saveJson = useBackendStore((s) => s.saveJson);
  const deleteDocument = useBackendStore((s) => s.deleteDocument);

  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [embedModalOpen, setEmbedModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [shareType, setShareType] = useState<'public' | 'private'>('public');

  // Format handler
  const handleFormat = useCallback(() => {
    if (!value?.trim()) {
      toastPatterns.validation.noJson('format');
      return;
    }

    try {
      const parsed = JSON.parse(value);
      const formatted = JSON.stringify(parsed, null, 2);
      onChange?.(formatted);
      toast({
        title: 'Formatted!',
        description: 'JSON has been formatted successfully',
      });
    } catch (e) {
      toast({
        title: 'Invalid JSON',
        description: (e as Error).message,
        variant: 'destructive',
      });
    }
  }, [value, onChange, toast]);

  // Minify handler
  const handleMinify = useCallback(() => {
    if (!value?.trim()) {
      toastPatterns.validation.noJson('minify');
      return;
    }

    try {
      const parsed = JSON.parse(value);
      const minified = JSON.stringify(parsed);
      onChange?.(minified);
      toast({
        title: 'Minified!',
        description: 'JSON has been minified successfully',
      });
    } catch (e) {
      toast({
        title: 'Invalid JSON',
        description: (e as Error).message,
        variant: 'destructive',
      });
    }
  }, [value, onChange, toast]);

  const handleSave = useCallback(async () => {
    try {
      console.log('[DEBUG] ViewerActions.handleSave: invoked', {
        hasSession: !!session,
        hasCurrentJson: !!currentJson,
        hasCurrentDocument: !!currentDocument,
      });
    } catch {}

    if (!currentJson) {
      toastPatterns.validation.noJson('save');
      return;
    }

    if (!session) {
      openModal('save');
      return;
    }

    // If it's a new document (no currentDocument) and has no title, open share modal for title input
    if (!currentDocument) {
      try {
        console.log('[DEBUG] ViewerActions.handleSave: opening ShareModal');
      } catch {}
      setShareModalOpen(true);
      return;
    }

    try {
      setIsSaving(true);
      await saveJson();
      toastPatterns.success.saved(currentDocument ? 'JSON' : 'JSON to library');
    } catch (error) {
      toastPatterns.error.save(error, 'JSON');
    } finally {
      setIsSaving(false);
    }
  }, [currentJson, currentDocument, saveJson, session, openModal]);

  // E2E reliability: ensure clicking the save button via data-testid always triggers handleSave
  useEffect(() => {
    const handler = (ev: MouseEvent) => {
      const target = ev.target as HTMLElement | null;
      if (!target) return;
      const btn = target.closest('[data-testid="save-button"]');
      if (btn) {
        try {
          console.log('[DEBUG] ViewerActions: global save-button click captured');
        } catch {}
        // Prevent double triggering when our onClick also fires
        if (!isSaving) {
          void handleSave();
        }
      }
    };
    document.addEventListener('click', handler, true);
    return () => document.removeEventListener('click', handler, true);
  }, [handleSave, isSaving]);

  // If authenticated with fresh JSON (no currentDocument), auto-open ShareModal to collect title
  useEffect(() => {
    if (session && currentJson && !currentDocument && !shareModalOpen) {
      try {
        console.log('[DEBUG] ViewerActions: auto-opening ShareModal');
      } catch {}
      setShareModalOpen(true);
    }
  }, [session, currentJson, currentDocument, shareModalOpen]);

  const handleCopyJson = useCallback(() => {
    const source = value?.trim() ? value : currentJson;
    if (!source) {
      toastPatterns.validation.noJson('copy');
      return;
    }
    copyJsonToClipboard(source, (title, desc, variant) => {
      if (variant === 'destructive') {
        showErrorToast(desc || 'Failed to copy', title);
      } else {
        showSuccessToast(title, { description: desc });
      }
    });
  }, [value, currentJson]);

  const handleExport = useCallback(() => {
    const source = value?.trim() ? value : currentJson;
    if (!source) {
      toastPatterns.validation.noJson('export');
      return;
    }
    const filename = currentDocument?.title
      ? `${currentDocument.title.replace(/[^a-z0-9]/gi, '_')}.json`
      : `json-${shareId || Date.now()}.json`;

    downloadJson(source, filename, (title, desc, variant) => {
      if (variant === 'destructive') {
        showErrorToast(desc || 'Failed to export', title);
      } else {
        showSuccessToast(title, { description: desc });
      }
    });
  }, [value, currentJson, currentDocument?.title, shareId]);
  
  const handleOpenExportModal = useCallback(() => {
    const source = value?.trim() ? value : currentJson;
    if (!source) {
      toastPatterns.validation.noJson('export');
      return;
    }
    setExportModalOpen(true);
  }, [value, currentJson]);

  const handleShare = useCallback(
    async (type: 'public' | 'private' = 'public') => {
      if (!currentJson) {
        toastPatterns.validation.noJson('share');
        return;
      }

      setIsSharing(true);
      setShareType(type);

      try {
        await shareJson();
        // Only open modal after shareJson completes successfully
        setShareModalOpen(true);
      } catch (error) {
        logger.error({ err: error }, 'Share error in ViewerActions');
        // Even if sharing fails, still open the modal - it can handle creating/saving the JSON
        setShareModalOpen(true);
        showInfoToast('Opening share dialog...');
      } finally {
        setIsSharing(false);
      }
    },
    [currentJson, shareJson]
  );

  const handleNativeShare = useCallback(async () => {
    if (!currentJson) {
      toastPatterns.validation.noJson('share');
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: currentDocument?.title || 'JSON Document',
          text: 'Check out this JSON document',
          url: shareId ? `${window.location.origin}/share/${shareId}` : window.location.href,
        });
        showSuccessToast('Shared successfully');
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          logger.error({ err: error }, 'Native share error');
          showErrorToast('Failed to share', 'Native share');
        }
      }
    }
  }, [currentJson, currentDocument?.title, shareId]);

  const handleEmbed = useCallback(() => {
    if (!currentJson) {
      toastPatterns.validation.noJson('embed');
      return;
    }

    if (!session) {
      openModal('share');
      return;
    }

    setEmbedModalOpen(true);
  }, [currentJson, session, openModal]);

  const handleDelete = useCallback(async () => {
    if (!currentDocument?.shareId) {
      toastPatterns.validation.noData('delete');
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
      toastPatterns.success.deleted('Document');
    } catch (error) {
      logger.error(
        { err: error, shareId: currentDocument.shareId },
        'Delete error in ViewerActions'
      );
      toastPatterns.error.delete(error, 'document');
    } finally {
      setIsDeleting(false);
    }
  }, [currentDocument, session, deleteDocument, openModal]);

  // Share dropdown actions
  const shareActions: DropdownAction[] = [
    {
      id: 'public',
      label: 'Generate public link',
      icon: Globe,
      onClick: () => handleShare('public'),
      disabled: isSharing,
    },
    {
      id: 'private',
      label: 'Generate private link',
      icon: Lock,
      onClick: () => handleShare('private'),
      disabled: isSharing,
    },
    {
      id: 'embed',
      label: 'Embed in a page',
      icon: Code,
      onClick: handleEmbed,
    },
  ];

  // Magic actions dropdown (Format & Minify + custom actions)
  const hasValidValue = validateJson(value);
  const canUseFormatMinify = !!value && hasValidValue && !!onChange;

  const magicActions: DropdownAction[] = [
    {
      id: 'format',
      label: 'Format',
      icon: Zap,
      onClick: handleFormat,
      disabled: !canUseFormatMinify,
    },
    {
      id: 'minify',
      label: 'Minify',
      icon: Minimize2,
      onClick: handleMinify,
      disabled: !canUseFormatMinify,
    },
    ...customMagicActions,
  ];

  return (
    <>
      {/* Toolbar - visible on all breakpoints */}
      <div className="flex items-center gap-1">
        {session && (
          <Button
            variant="green"
            size="xs"
            icon={Save}
            text="Save"
            onMouseDown={handleSave}
            onClick={handleSave}
            disabled={isSaving || !currentJson}
            isLoading={isSaving}
            loadingText="Saving..."
            title="Save to library"
            data-testid="save-button"
          />
        )}

        {/* Delete button - only show if document is saved */}
        {currentDocument?.shareId && session && (
          <Button
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

        {/* Icon-only buttons for Copy, Export, Magic, and Share */}
        {enableFormatActions && magicActions.length > 0 && (
          <IconDropdown
            icon={PaintbrushIcon}
            tooltip="Format Actions"
            actions={magicActions}
            disabled={!currentJson || !canUseFormatMinify}
            width="w-40"
          />
        )}

        <Button
          variant="outline"
          size="icon"
          onClick={handleCopyJson}
          disabled={!(value?.trim() || currentJson)}
          title="Copy JSON"
          className="h-7 w-7"
        >
          <Copy className="h-3 w-3" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={handleExport}
          disabled={!(value?.trim() || currentJson)}
          title="Download"
          className="h-7 w-7"
          data-testid="download-button"
        >
          <Download className="h-3 w-3" />
        </Button>

        {/* Export options button - opens full export modal */}
        <Button
          variant="outline"
          size="icon"
          onClick={handleOpenExportModal}
          disabled={!(value?.trim() || currentJson)}
          title="Export Options"
          className="h-7 w-7"
          data-testid="export-options"
        >
          <MoreHorizontal className="h-3 w-3" />
        </Button>

        <IconDropdown
          icon={Share2}
          tooltip="Share JSON"
          actions={shareActions}
          disabled={!currentJson || isSharing}
        />
      </div>

      {/* Mobile view dropdown disabled (toolbar available on mobile) */}
      <div className="hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="xs"
              icon={MoreHorizontal}
              className="w-7 px-0"
              title="More actions"
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {session && (
              <DropdownMenuItem
                onClick={handleSave}
                disabled={isSaving || !currentJson}
                className="text-sm"
              >
                <Save className="h-3 w-3 mr-2" />
                Save to library
              </DropdownMenuItem>
            )}

            {/* Delete option - only show if document is saved */}
            {currentDocument?.shareId && session && (
              <DropdownMenuItem
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-sm text-red-600 dark:text-red-400"
              >
                <Trash2 className="h-3 w-3 mr-2" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </DropdownMenuItem>
            )}

            {/* Magic actions for mobile */}
            <DropdownMenuItem
              onClick={handleFormat}
              disabled={!canUseFormatMinify || !currentJson}
              className="text-sm"
            >
              <Zap className="h-3 w-3 mr-2" />
              Format
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={handleMinify}
              disabled={!canUseFormatMinify || !currentJson}
              className="text-sm"
            >
              <Minimize2 className="h-3 w-3 mr-2" />
              Minify
            </DropdownMenuItem>

            {/* Custom magic actions for mobile */}
            {customMagicActions.map((action) => (
              <DropdownMenuItem
                key={action.id}
                onClick={action.onClick}
                disabled={action.disabled || !currentJson}
                className="text-sm"
              >
                <action.icon className="h-3 w-3 mr-2" />
                {action.label}
              </DropdownMenuItem>
            ))}

            <DropdownMenuItem onClick={handleCopyJson} disabled={!currentJson} className="text-sm">
              <Copy className="h-3 w-3 mr-2" />
              Copy JSON
            </DropdownMenuItem>

            <DropdownMenuItem onClick={handleExport} disabled={!currentJson} className="text-sm">
              <Download className="h-3 w-3 mr-2" />
              Export JSON
            </DropdownMenuItem>

            {/* Share options for mobile - use native share if available */}
            <DropdownMenuItem
              onClick={() => handleShare('public')}
              disabled={!currentJson || isSharing}
              className="text-sm"
            >
              <Globe className="h-3 w-3 mr-2" />
              Public link
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => handleShare('private')}
              disabled={!currentJson || isSharing}
              className="text-sm"
            >
              <Lock className="h-3 w-3 mr-2" />
              Private link
            </DropdownMenuItem>

            <DropdownMenuItem onClick={handleEmbed} disabled={!currentJson} className="text-sm">
              <Code className="h-3 w-3 mr-2" />
              Embed
            </DropdownMenuItem>

            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <DropdownMenuItem
                onClick={handleNativeShare}
                disabled={!currentJson}
                className="text-sm"
              >
                <ExternalLink className="h-3 w-3 mr-2" />
                Share
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ShareModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        // Always treat editor-initiated share as a fresh save; publication is managed from Library
        shareId={''}
        currentTitle={currentDocument?.title}
        currentVisibility={shareType}
        onUpdated={async (title?: string) => {
          // If this is a save operation without current document, save the JSON now
          if (!currentDocument && title) {
            try {
              setIsSaving(true);
              try {
                if (process.env.NODE_ENV === 'development') {
                  // eslint-disable-next-line no-console
                  console.log('[DEBUG] ViewerActions: calling saveJson(title)');
                }
              } catch {}
              await saveJson(title);
              // After saving, the store should be updated with new shareId and currentDocument
              // Show success message but keep modal open to display the generated link
              showSuccessToast('Saved', {
                description: `JSON saved as "${title}" - link generated!`,
              });
            } catch (error) {
              toastPatterns.error.save(error, 'JSON');
            } finally {
              setIsSaving(false);
            }
          } else {
            // Regular share/update operation
            toastPatterns.success.updated('JSON sharing settings');
          }
        }}
      />

      <EmbedModal
        isOpen={embedModalOpen}
        onClose={() => setEmbedModalOpen(false)}
        shareId={shareId || ''}
        jsonPreview={currentJson ? currentJson.slice(0, 500) : undefined}
      />

      <ExportModal
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
        jsonData={value?.trim() ? JSON.parse(value) : (currentJson ? JSON.parse(currentJson) : null)}
      />
    </>
  );
}
