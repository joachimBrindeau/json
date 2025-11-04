'use client';

import { useMemo, useEffect } from 'react';
import { BaseModal } from '@/components/shared/BaseModal';
import { FormInput } from '@/components/shared/FormFields';
import { Globe, Lock, CheckCircle2, Loader2 } from 'lucide-react';
import { SocialShareButtons } from '@/components/shared/SocialShareButtons';
import { useValidatedForm } from '@/hooks/use-validated-form';
import { shareFormSchema } from '@/lib/validation/schemas';
import { useBackendStore } from '@/lib/store/backend';
import { VisibilityToggle } from './share-modal/VisibilityToggle';
import { VisibilityInfo } from './share-modal/VisibilityInfo';
import { ShareLinkInput } from './share-modal/ShareLinkInput';
import { PublicMetadataSection } from './share-modal/PublicMetadataSection';
import { useShareModalState } from './share-modal/useShareModalState';
import { useShareModalMetadata } from './share-modal/useShareModalMetadata';

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareId: string;
  currentTitle?: string;
  currentVisibility?: 'public' | 'private';
  onUpdated?: (title?: string) => void;
}

export function ShareModal({
  open,
  onOpenChange,
  shareId: shareIdProp,
  currentTitle,
  currentVisibility = 'private',
  onUpdated,
}: ShareModalProps) {
  // Get shareId from store if prop is empty (for new documents)
  const storeShareId = useBackendStore((s) => s.shareId);
  const currentDocument = useBackendStore((s) => s.currentDocument);
  
  // Use prop shareId if provided, otherwise fall back to store
  // After save, store will have the new shareId
  const shareId = shareIdProp || storeShareId || currentDocument?.shareId || '';

  const form = useValidatedForm(shareFormSchema, {
    defaultValues: {
      title: currentTitle || '',
      description: '',
      category: '',
      tags: [],
      visibility: currentVisibility,
    },
    mode: 'onChange',
  });

  const category = form.watch('category');
  const title = form.watch('title');

  const { isLoading: isLoadingMetadata } = useShareModalMetadata({
    open,
    shareId,
    currentTitle,
    currentVisibility,
    form,
  });

  const {
    isUpdating,
    isSaving,
    isPublic,
    didSave,
    setIsPublic,
    handleSave,
  } = useShareModalState({
    shareId,
    currentVisibility,
    form,
    onUpdated,
    onClose: () => onOpenChange(false),
  });

  // Sync public state with visibility - check document from store if available
  // This handles both initial load and updates after save
  useEffect(() => {
    if (open) {
      // If we have a currentDocument, use its visibility (most accurate)
      // Otherwise fall back to currentVisibility prop
      const actualVisibility = currentDocument?.visibility || currentVisibility;
      setIsPublic(actualVisibility === 'public');
    }
  }, [open, currentVisibility, setIsPublic, currentDocument?.visibility]);

  const shareUrl = useMemo(() => {
    if (!shareId) return 'Creating share link...';
    return typeof window !== 'undefined' ? `${window.location.origin}/library/${shareId}` : '';
  }, [shareId]);

  const shareTitle = 'Check out this JSON visualization';
  const shareDescription =
    'Interactive JSON Sea visualization - explore JSON data in a beautiful graph format';

  // Determine actual visibility for display (use document if available, else state)
  const actualVisibility = currentDocument?.visibility || (isPublic ? 'public' : 'private');
  const isActuallyPublic = actualVisibility === 'public';

  const modalIcon = isActuallyPublic ? (
    <Globe className="h-5 w-5 text-blue-500" />
  ) : (
    <Lock className="h-4 w-4 text-muted-foreground" />
  );

  const modalDescription = isActuallyPublic
    ? 'Make your JSON discoverable in the public library'
    : 'Share a private link to your JSON';

  // Get primary action label based on state
  const getPrimaryActionLabel = () => {
    if (isUpdating || isSaving) {
      return isSaving ? 'Saving...' : 'Updating...';
    }
    if (!shareId) {
      return 'Save & Generate Link';
    }
    // Use actual visibility state, not just isPublic toggle
    if (isPublic) {
      return actualVisibility === 'public' ? 'Update Public Details' : 'Publish & Share';
    }
    return actualVisibility === 'public' ? 'Make Private' : 'Update Private Details';
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Share your JSON"
      description={modalDescription}
      icon={modalIcon}
      className="sm:max-w-2xl"
      maxHeight="90vh"
      closeOnEscape={!isUpdating}
      closeOnOverlayClick={!isUpdating}
      primaryAction={{
        label: getPrimaryActionLabel(),
        onClick: () => void handleSave(),
        loading: isUpdating || isSaving,
        disabled: isUpdating || isSaving || isLoadingMetadata,
        variant: 'default',
        testId: 'share-save-button',
      }}
      secondaryAction={{
        label: 'Cancel',
        onClick: () => onOpenChange(false),
        variant: 'outline',
        testId: 'share-cancel-button',
      }}
    >
      {isLoadingMetadata && (
        <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading existing metadata...</span>
        </div>
      )}

      <div className="space-y-4">
        <FormInput
          id="title"
          label="Title"
          required
          placeholder="e.g., E-commerce Product API Response"
          maxLength={200}
          className="font-medium"
          disabled={isLoadingMetadata}
          error={form.formState.errors.title?.message as string}
          {...form.register('title')}
        />

        <VisibilityToggle
          isPublic={isPublic}
          onToggle={setIsPublic}
          disabled={isLoadingMetadata}
        />

        <ShareLinkInput
          shareUrl={shareUrl}
          isSaving={isSaving}
          didSave={didSave}
          hasShareId={!!shareId}
        />

        <VisibilityInfo isPublic={isPublic} />

        {isPublic && (
          <PublicMetadataSection
            form={form}
            category={category}
            disabled={isLoadingMetadata}
          />
        )}

        {(didSave || (shareId && !isSaving)) && (
          <SocialShareButtons url={shareUrl} title={shareTitle} description={shareDescription} />
        )}
      </div>
    </BaseModal>
  );
}
