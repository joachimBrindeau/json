'use client';

import { useMemo, useEffect, useState } from 'react';
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
  // Single source of truth: prefer currentDocument.shareId (most accurate)
  // Fall back to prop, then store shareId
  const currentDocument = useBackendStore((s) => s.currentDocument);
  const shareId = currentDocument?.shareId || shareIdProp || '';

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
  form.watch('title'); // Needed for form reactivity

  const { isLoading: isLoadingMetadata } = useShareModalMetadata({
    open,
    shareId,
    currentTitle,
    currentVisibility,
    form,
  });

  // Initialize isPublic from currentDocument or prop (single initialization)
  const initialVisibility = currentDocument?.visibility || currentVisibility;
  const [isPublic, setIsPublic] = useState(initialVisibility === 'public');

  // Sync visibility when modal opens or document changes
  useEffect(() => {
    if (open) {
      const actualVisibility = currentDocument?.visibility || currentVisibility;
      setIsPublic(actualVisibility === 'public');
    }
  }, [open, currentVisibility, currentDocument?.visibility]);

  const {
    isUpdating,
    isSaving,
    didSave,
    handleSave,
  } = useShareModalState({
    shareId,
    currentVisibility: initialVisibility,
    form,
    isPublic,
    setIsPublic,
    onUpdated,
    onClose: () => onOpenChange(false),
  });

  const shareUrl = useMemo(() => {
    if (!shareId) return 'Creating share link...';
    return typeof window !== 'undefined' ? `${window.location.origin}/library/${shareId}` : '';
  }, [shareId]);

  const shareTitle = 'Check out this JSON visualization';
  const shareDescription =
    'Interactive JSON Sea visualization - explore JSON data in a beautiful graph format';

  // Determine actual visibility for display
  const actualVisibility = currentDocument?.visibility || (isPublic ? 'public' : 'private');
  const isActuallyPublic = actualVisibility === 'public';

  // Dynamic modal title based on context
  const modalTitle = isActuallyPublic
    ? 'Share Public JSON'
    : 'Share Private JSON';

  const modalIcon = isActuallyPublic ? (
    <Globe className="h-5 w-5 text-blue-500" />
  ) : (
    <Lock className="h-5 w-5 text-muted-foreground" />
  );

  const modalDescription = isActuallyPublic
    ? 'Manage your public JSON sharing settings'
    : 'Share a private link to your JSON';

  // Improved button labels - clear and specific
  const getPrimaryActionLabel = () => {
    if (isUpdating) {
      return 'Updating...';
    }
    // For existing documents - check if visibility is changing
    const currentDocVisibility = currentDocument?.visibility === 'public';
    if (isPublic && !currentDocVisibility) {
      return 'Publish to Library';
    }
    if (!isPublic && currentDocVisibility) {
      return 'Make Private';
    }
    return 'Update Settings';
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title={modalTitle}
      description={modalDescription}
      icon={modalIcon}
      className="sm:max-w-2xl lg:max-w-3xl"
      maxHeight="90vh"
      closeOnEscape={!isUpdating}
      closeOnOverlayClick={!isUpdating}
      primaryAction={{
        label: getPrimaryActionLabel(),
        onClick: () => void handleSave(),
        loading: isUpdating,
        disabled: isUpdating || isLoadingMetadata,
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
        <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-lg mb-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading settings...</span>
        </div>
      )}

      {/* Core Actions - Always Visible */}
      <div className="space-y-4">
        <FormInput
          id="title"
          label="Title"
          required
          placeholder="Give your JSON a name"
          maxLength={200}
          className="font-medium"
          disabled={isLoadingMetadata}
          error={form.formState.errors.title?.message as string}
          {...form.register('title', {
            onBlur: () => form.trigger('title'),
          })}
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

        {/* Success Feedback */}
        {didSave && (
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg border border-green-200">
            <CheckCircle2 className="h-4 w-4" />
            <span className="font-medium">Settings saved successfully!</span>
          </div>
        )}

        {/* Advanced Options - Separated visually */}
        <div className="border-t pt-4 space-y-4">
          <VisibilityInfo isPublic={isPublic} />

          {isPublic && (
            <PublicMetadataSection
              form={form}
              category={category}
              disabled={isLoadingMetadata}
            />
          )}

          {/* Social Share - Only show if link is ready */}
          {shareId && shareUrl && (
            <div className="pt-2">
              <SocialShareButtons url={shareUrl} title={shareTitle} description={shareDescription} />
            </div>
          )}
        </div>
      </div>
    </BaseModal>
  );
}
