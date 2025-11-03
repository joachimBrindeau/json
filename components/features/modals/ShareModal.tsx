'use client';

import { useCallback, useMemo, useState, useEffect } from 'react';
import { useBackendStore } from '@/lib/store/backend';
import { Controller } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { FormInput, FormTextarea, FormSelect } from '@/components/shared/form-fields';
import { Copy, Check, Globe, Lock, Users, Eye, CheckCircle2, Loader2 } from 'lucide-react';
import { useClipboard } from '@/hooks/use-clipboard';
import { TagManagementSection } from '@/components/features/shared/TagManagementSection';
import { SocialShareButtons } from '@/components/shared/social-share-buttons';
import { DOCUMENT_CATEGORIES } from '@/lib/constants/categories';
import { logger } from '@/lib/logger';
import { apiClient } from '@/lib/api/client';
import { showValidationErrorToast, showInfoToast } from '@/lib/utils/toast-helpers';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { useValidatedForm } from '@/hooks/use-validated-form';
import { shareFormSchema, type ShareFormData } from '@/lib/validation/schemas';

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
  shareId,
  currentTitle,
  currentVisibility = 'private',
  onUpdated,
}: ShareModalProps) {
  // Use shareId from props only; do not infer from store to avoid anonymous uploads masking unsaved state
  const effectiveShareId = shareId;
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [isPublic, setIsPublic] = useState(currentVisibility === 'public');
  // Local success flag to reflect immediate save completion while props propagate
  const [didSave, setDidSave] = useState(false);

  // Reset transient state each time the modal opens to avoid stale success UI
  useEffect(() => {
    if (open) {
      setDidSave(false);
      setIsSaving(false);
      setIsUpdating(false);
    }
  }, [open]);

  // Use clipboard hook for copy functionality
  const { copy, copied } = useClipboard({
    successMessage: 'Copied!',
    successDescription: 'Share link copied to clipboard',
  });

  // Initialize form with react-hook-form + Zod validation
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

  // Watch category for tag filtering
  const category = form.watch('category');
  const title = form.watch('title');

  // Load existing metadata when modal opens for published documents
  useEffect(() => {
    const loadPublishedMetadata = async () => {
      if (!open || !effectiveShareId) {
        return;
      }

      // Reset states when opening
      setIsSaving(false);
      setIsUpdating(false);
      // Use currentVisibility prop to set initial state (respects user's button choice)
      setIsPublic(currentVisibility === 'public');

      try {
        setIsLoadingMetadata(true);
        setDidSave(false);

        // Fetch published document metadata
        const response = await apiClient.get<{
          document: {
            shareId: string;
            title: string;
            description?: string | null;
            category?: string | null;
            tags?: string[] | null;
            visibility: string;
            publishedAt?: string | null;
          };
        }>(`/api/json/${effectiveShareId}`);

        // Pre-populate form with existing metadata
        form.reset({
          title: response.document.title || currentTitle || '',
          description: response.document.description || '',
          category: (response.document.category || '') as any,
          tags: response.document.tags || [],
          // Use currentVisibility prop instead of API response to respect user's choice
          visibility: currentVisibility,
        });

        // Keep the visibility state from currentVisibility prop (user's button choice)
        // Don't override with API response
        setIsPublic(currentVisibility === 'public');
      } catch (error) {
        // If error, fall back to current title (document might not exist yet)
        logger.debug(
          { err: error, shareId: effectiveShareId },
          'Could not load metadata - document may not exist yet'
        );
        form.reset({
          title: currentTitle || '',
          description: '',
          category: '',
          tags: [],
          visibility: currentVisibility,
        });
      } finally {
        setIsLoadingMetadata(false);
      }
    };

    loadPublishedMetadata();
  }, [open, effectiveShareId, currentTitle, currentVisibility, form]);

  // Stop saving state when shareId becomes available
  useEffect(() => {
    if (effectiveShareId && isSaving) {
      setIsSaving(false);
      setDidSave(true);
    }
  }, [effectiveShareId, isSaving]);
  // Debug: log relevant state on each render in dev
  useEffect(() => {
    try {
      console.log('[DEBUG] ShareModal: render', {
        open,
        effectiveShareId,
        title,
        didSave,
        isSaving,
        isUpdating,
      });
    } catch {}
  });
  useEffect(() => {
    try {
      console.log('[DEBUG] ShareModal: title changed', title);
    } catch {}
  }, [title]);

  const shareUrl = useMemo(() => {
    if (!effectiveShareId) return 'Creating share link...';
    return typeof window !== 'undefined'
      ? `${window.location.origin}/library/${effectiveShareId}`
      : '';
  }, [effectiveShareId]);

  const shareTitle = 'Check out this JSON visualization';
  const shareDescription =
    'Interactive JSON Sea visualization - explore JSON data in a beautiful graph format';

  const copyToClipboard = useCallback(() => {
    copy(shareUrl);
  }, [copy, shareUrl]);

  // Setup mutations with centralized error handling
  const publishMutation = useApiMutation(
    async (data: Omit<ShareFormData, 'visibility'>) =>
      apiClient.post(`/api/json/${effectiveShareId}/publish`, data),
    {
      successMessage: 'Published successfully!',
      onSuccess: () => {
        onUpdated?.();
        onOpenChange(false);
      },
    }
  );

  const unpublishMutation = useApiMutation(
    async () => apiClient.delete(`/api/json/${effectiveShareId}/publish`),
    {
      successMessage: 'Made private',
      onSuccess: () => {
        onUpdated?.();
        onOpenChange(false);
      },
    }
  );

  const handleSave = useCallback(async () => {
    try {
      console.log('[DEBUG] ShareModal: handleSave start', {
        open,
        eff: effectiveShareId,
        title: (form.getValues().title || '').trim(),
      });
    } catch {}
    // Validate form before submission
    const isValid = await form.trigger();
    try {
      console.log('[DEBUG] ShareModal: validation result', isValid);
    } catch {}
    if (!isValid) {
      showValidationErrorToast('Validation failed', 'Please fix the errors before saving');
      return;
    }

    const formData = form.getValues();

    if (isPublic && !formData.title.trim()) {
      showValidationErrorToast('Title required', 'Public JSONs require a title');
      return;
    }

    setIsUpdating(true);
    try {
      // If we don't have a shareId yet, we need to save/create the JSON first
      if (!effectiveShareId) {
        // For new documents without a shareId, we need to save with title first
        if (!formData.title.trim()) {
          showValidationErrorToast('Title required', 'Please enter a title to save your JSON');
          return;
        }

        setIsSaving(true);
        showInfoToast('Saving JSON with title', {
          description: 'Creating your document and share link...',
        });

        // Save directly via store to ensure upload happens even if parent wiring changes
        try {
          console.log('[DEBUG] ShareModal: handleSave invoked with title', formData.title.trim());
        } catch {}
        try {
          const { useBackendStore } = await import('@/lib/store/backend');
          const storeState = useBackendStore.getState() as any;
          const { uploadJson, currentJson } = storeState;

          console.log('[DEBUG] ShareModal: currentJson length', (currentJson || '').length);
          const blob = new Blob([currentJson || ''], { type: 'application/json' });
          const file = new File([blob], 'untitled.json', { type: 'application/json' });
          await uploadJson(file, formData.title.trim());
          setIsSaving(false);
          setDidSave(true);
          // Parent may still want to react (e.g., refresh library)
          onUpdated?.(formData.title.trim());
        } catch (e) {
          setIsSaving(false);

          console.log('[DEBUG] ShareModal: save failed', e);
          showValidationErrorToast('Save failed', e instanceof Error ? e.message : 'Unknown error');
        }
        return;
      }

      if (isPublic) {
        // Publish to public library - exclude visibility from API payload
        const { visibility, ...publishData } = formData;
        await publishMutation.mutate(publishData);
      } else {
        // Make private
        await unpublishMutation.mutate();
      }
    } finally {
      setIsUpdating(false);
    }
  }, [isPublic, effectiveShareId, form, publishMutation, unpublishMutation]);

  // Allow modal to open even without shareId - it can handle creating one

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isPublic ? (
              <Globe className="h-5 w-5 text-blue-500" />
            ) : (
              <Lock className="h-4 w-4 text-muted-foreground" />
            )}
            Share your JSON
          </DialogTitle>
          <DialogDescription>
            {isPublic
              ? 'Make your JSON discoverable in the public library'
              : 'Share a private link to your JSON'}
            {(didSave || (effectiveShareId && !isSaving)) && (
              <span className="ml-2 text-green-700" data-testid="share-success-inline">
                Your JSON is saved and ready to share!
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {(didSave || (effectiveShareId && !isSaving)) && (
          <div className="flex items-center gap-2 p-2 mb-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md">
            <CheckCircle2 className="h-4 w-4" />
            <span>Your JSON is saved and ready to share!</span>
          </div>
        )}

        <div className="space-y-6">
          {/* Loading indicator */}
          {isLoadingMetadata && (
            <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading existing metadata...</span>
            </div>
          )}

          {/* Already published indicator */}
          {effectiveShareId && !isLoadingMetadata && currentVisibility === 'public' && (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
              <CheckCircle2 className="h-4 w-4" />
              <span>This document is already published - you can update its metadata below</span>
            </div>
          )}

          {/* Title - Always visible */}
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

          {/* Public/Private Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                {isPublic ? (
                  <Globe className="h-4 w-4 text-blue-500" />
                ) : (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="font-medium">{isPublic ? 'Public' : 'Private'}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {isPublic
                  ? 'Anyone can discover this JSON in the public library'
                  : 'Only people with the link can access this JSON'}
              </p>
            </div>
            <Switch
              checked={isPublic}
              onCheckedChange={setIsPublic}
              disabled={isLoadingMetadata}
              aria-label="Toggle public/private visibility"
            />
          </div>

          {/* Info box explaining the current mode */}
          <div
            className={`p-3 rounded-lg border ${isPublic ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}
          >
            <div className="flex items-start gap-2">
              {isPublic ? (
                <>
                  <Globe className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-900">
                    <p className="font-medium mb-1">Public Link</p>
                    <p className="text-blue-700">
                      Your JSON will be listed in the public library where anyone can discover it.
                      You can add a description, category, and tags to help others find it.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-gray-900">
                    <p className="font-medium mb-1">Private Link</p>
                    <p className="text-gray-700">
                      Your JSON will not appear in the public library. Only people with the direct
                      link can access it. Perfect for sharing sensitive data or work-in-progress
                      documents.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Share URL */}
          <div className="space-y-2">
            <Label htmlFor="link">Share link</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="link"
                value={isSaving ? 'Creating your share link...' : shareUrl}
                readOnly
                className="font-mono text-sm"
                disabled={isSaving}
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={copyToClipboard}
                disabled={isSaving || !effectiveShareId}
                title="Copy share link"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            {isSaving && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving your JSON and generating share link...</span>
              </div>
            )}
            {(didSave || (effectiveShareId && !isSaving)) && (
              <div
                className="flex items-center gap-2 text-sm text-green-600"
                data-testid="share-success"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Your JSON is saved and ready to share!</span>
              </div>
            )}
          </div>

          {/* Public Library Metadata - only show when public */}
          {isPublic && (
            <div className="space-y-4 p-4 border rounded-lg bg-blue-50/50">
              <div className="flex items-center gap-2 text-blue-900">
                <Users className="h-4 w-4" />
                <span className="font-medium">Public Library Details</span>
              </div>
              <p className="text-sm text-blue-700 -mt-2">
                Help others discover your JSON by adding details below
              </p>
              {/* Description */}
              <FormTextarea
                id="description"
                label="Description"
                placeholder="Optional: Describe what this JSON represents..."
                maxLength={1000}
                rows={3}
                disabled={isLoadingMetadata}
                error={form.formState.errors.description?.message as string}
                {...form.register('description')}
              />

              {/* Category */}
              <Controller
                name="category"
                control={form.control}
                render={({ field }) => (
                  <FormSelect
                    label="Category"
                    placeholder="Select a category"
                    value={field.value}
                    onValueChange={field.onChange}
                    options={DOCUMENT_CATEGORIES.map((cat) => ({ value: cat, label: cat }))}
                    disabled={isLoadingMetadata}
                    error={form.formState.errors.category?.message as string}
                  />
                )}
              />

              {/* Tags */}
              <Controller
                name="tags"
                control={form.control}
                render={({ field }) => (
                  <TagManagementSection
                    selectedTags={field.value}
                    onTagsChange={field.onChange}
                    category={category}
                    maxTags={10}
                    disabled={isLoadingMetadata}
                  />
                )}
              />
              {form.formState.errors.tags && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.tags.message as string}
                </p>
              )}

              {/* Preview */}
              <div className="bg-white border rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-700 mb-2">
                  <Eye className="h-4 w-4" />
                  <span className="font-medium text-sm">Library Preview</span>
                </div>
                <div className="text-sm">
                  <div className="font-medium text-gray-900">{title || 'Untitled JSON'}</div>
                  {form.watch('description') && (
                    <div className="text-gray-600 mt-1 text-xs">{form.watch('description')}</div>
                  )}
                  <div className="flex items-center gap-1 mt-2">
                    {category && (
                      <Badge variant="outline" className="text-xs">
                        {category}
                      </Badge>
                    )}
                    {form
                      .watch('tags')
                      .slice(0, 3)
                      .map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    {form.watch('tags').length > 3 && (
                      <span className="text-xs text-muted-foreground">
                        +{form.watch('tags').length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Social Share Buttons - always visible */}
          <SocialShareButtons url={shareUrl} title={shareTitle} description={shareDescription} />

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUpdating}
              className="order-2 sm:order-1"
              data-testid="share-cancel-button"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                try {
                  console.log('[DEBUG] ShareModal: save button clicked');
                } catch {}
                void handleSave();
              }}
              disabled={isUpdating || isSaving || isLoadingMetadata}
              className="order-1 sm:order-2"
              data-testid="share-save-button"
            >
              {isUpdating || isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isSaving ? 'Saving...' : 'Updating...'}
                </>
              ) : !effectiveShareId ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Save & Generate Link
                </>
              ) : isPublic ? (
                <>
                  <Globe className="h-4 w-4 mr-2" />
                  Publish & Share
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Make Private & Share
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
