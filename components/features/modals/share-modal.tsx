'use client';

import { useCallback, useMemo, useState, useEffect } from 'react';
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
import {
  showValidationErrorToast,
  showInfoToast,
} from '@/lib/utils/toast-helpers';
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
  onUpdated
}: ShareModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [isPublic, setIsPublic] = useState(currentVisibility === 'public');

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
      if (!open || !shareId) {
        return;
      }

      // Reset states when opening
      setIsSaving(false);
      setIsUpdating(false);
      setIsPublic(currentVisibility === 'public');

      try {
        setIsLoadingMetadata(true);

        // Fetch published document metadata
        const response = await apiClient.get<{ document: {
          shareId: string;
          title: string;
          description?: string | null;
          category?: string | null;
          tags?: string[] | null;
          visibility: string;
          publishedAt?: string | null;
        } }>(`/api/json/${shareId}`);

        // Pre-populate form with existing metadata
        form.reset({
          title: response.document.title || currentTitle || '',
          description: response.document.description || '',
          category: response.document.category || '',
          tags: response.document.tags || [],
          visibility: response.document.visibility as 'public' | 'private',
        });

        // Update visibility state
        setIsPublic(response.document.visibility === 'public');

      } catch (error) {
        // If error, fall back to current title (document might not exist yet)
        logger.debug({ err: error, shareId }, 'Could not load metadata - document may not exist yet');
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
  }, [open, shareId, currentTitle, currentVisibility, form]);

  // Stop saving state when shareId becomes available
  useEffect(() => {
    if (shareId && isSaving) {
      setIsSaving(false);
    }
  }, [shareId, isSaving]);

  const shareUrl = useMemo(() => {
    if (!shareId) return 'Creating share link...';
    return typeof window !== 'undefined' ? `${window.location.origin}/library/${shareId}` : '';
  }, [shareId]);

  const shareTitle = 'Check out this JSON visualization';
  const shareDescription = 'Interactive JSON Sea visualization - explore JSON data in a beautiful graph format';

  const copyToClipboard = useCallback(() => {
    copy(shareUrl);
  }, [copy, shareUrl]);


  // Setup mutations with centralized error handling
  const publishMutation = useApiMutation(
    async (data: Omit<ShareFormData, 'visibility'>) =>
      apiClient.post(`/api/json/${shareId}/publish`, data),
    {
      successMessage: 'Published successfully!',
      onSuccess: () => {
        onUpdated?.();
        onOpenChange(false);
      },
    }
  );

  const unpublishMutation = useApiMutation(
    async () => apiClient.delete(`/api/json/${shareId}/publish`),
    {
      successMessage: 'Made private',
      onSuccess: () => {
        onUpdated?.();
        onOpenChange(false);
      },
    }
  );

  const handleSave = useCallback(async () => {
    // Validate form before submission
    const isValid = await form.trigger();
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
      if (!shareId) {
        // For new documents without a shareId, we need to save with title first
        if (!formData.title.trim()) {
          showValidationErrorToast('Title required', 'Please enter a title to save your JSON');
          return;
        }

        setIsSaving(true);
        showInfoToast('Saving JSON with title', {
          description: 'Creating your document and share link...',
        });

        // Signal the parent to save the JSON with the provided title
        // Don't close the modal - let the parent update the shareId and refresh this modal
        onUpdated?.(formData.title.trim());
        return;
      }

      if (isPublic) {
        // Publish to public library - exclude visibility from API payload
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { visibility, ...publishData } = formData;
        await publishMutation.mutate(publishData);
      } else {
        // Make private
        await unpublishMutation.mutate();
      }
    } finally {
      setIsUpdating(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPublic, shareId, form, publishMutation, unpublishMutation]);

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
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Loading indicator */}
          {isLoadingMetadata && (
            <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading existing metadata...</span>
            </div>
          )}

          {/* Already published indicator */}
          {shareId && !isLoadingMetadata && currentVisibility === 'public' && (
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
            error={form.formState.errors.title?.message}
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
                <span className="font-medium">
                  {isPublic ? 'Public' : 'Private'}
                </span>
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
            />
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
                disabled={isSaving || !shareId}
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
            {shareId && !isSaving && (
              <div className="flex items-center gap-2 text-sm text-green-600">
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
                <span className="font-medium">Set optional fields</span>
              </div>
{/* Description */}
              <FormTextarea
                id="description"
                label="Description"
                placeholder="Optional: Describe what this JSON represents..."
                maxLength={1000}
                rows={3}
                disabled={isLoadingMetadata}
                error={form.formState.errors.description?.message}
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
                    options={DOCUMENT_CATEGORIES.map(cat => ({ value: cat, label: cat }))}
                    disabled={isLoadingMetadata}
                    error={form.formState.errors.category?.message}
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
                <p className="text-sm text-red-500">{form.formState.errors.tags.message}</p>
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
                    {category && <Badge variant="outline" className="text-xs">{category}</Badge>}
                    {form.watch('tags').slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                    {form.watch('tags').length > 3 && (
                      <span className="text-xs text-muted-foreground">+{form.watch('tags').length - 3} more</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Social Share Buttons - always visible */}
          <SocialShareButtons
            url={shareUrl}
            title={shareTitle}
            description={shareDescription}
          />

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              disabled={isUpdating}
              className="order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isUpdating || isSaving || isLoadingMetadata || !title?.trim()}
              className="order-1 sm:order-2"
            >
              {(isUpdating || isSaving) ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isSaving ? 'Saving...' : 'Updating...'}
                </>
              ) : !shareId ? (
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