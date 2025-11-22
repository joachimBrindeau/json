'use client';

import { useState, useCallback, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { showValidationErrorToast, showInfoToast } from '@/lib/utils/toast-helpers';
import { apiClient } from '@/lib/api/client';
import { useApiMutation } from '@/hooks/use-api-mutation';
import type { ShareFormData } from '@/lib/validation/schemas';
import type { UseFormReturn } from 'react-hook-form';

interface UseShareModalProps {
  open: boolean;
  shareId: string;
  currentTitle?: string;
  currentVisibility: 'public' | 'private';
  form: UseFormReturn<ShareFormData>;
  isPublic: boolean;
  setIsPublic: (value: boolean) => void;
  onUpdated?: (title?: string) => void;
}

export function useShareModal({
  open,
  shareId,
  currentTitle,
  currentVisibility,
  form,
  isPublic,
  setIsPublic,
  onUpdated,
}: UseShareModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [didSave, setDidSave] = useState(false);

  // Load metadata when modal opens
  useEffect(() => {
    if (!open) {
      setDidSave(false);
      return;
    }

    if (!shareId) {
      // New document - reset to defaults
      form.reset({
        title: currentTitle || '',
        description: '',
        category: '',
        tags: [],
        visibility: currentVisibility,
      });
      return;
    }

    // Load metadata for existing document
    const loadMetadata = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.get<{
          document: {
            title: string;
            description?: string | null;
            category?: string | null;
            tags?: string[] | null;
            visibility: string;
          };
        }>(`/api/json/${shareId}`);

        // Use document's actual visibility, not prop
        const documentVisibility = (response.document.visibility === 'public' || response.document.visibility === 'private')
          ? (response.document.visibility as 'public' | 'private')
          : currentVisibility;

        const isDocPublic = documentVisibility === 'public';
        setIsPublic(isDocPublic);

        form.reset({
          title: response.document.title || currentTitle || '',
          description: response.document.description || '',
          category: (response.document.category || '') as any,
          tags: response.document.tags || [],
          visibility: documentVisibility,
        });
      } catch (error) {
        logger.debug({ err: error, shareId }, 'Could not load metadata');
        // Fallback to defaults on error
        form.reset({
          title: currentTitle || '',
          description: '',
          category: '',
          tags: [],
          visibility: currentVisibility,
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadMetadata();
  }, [open, shareId, currentTitle, currentVisibility, form, setIsPublic]);

  // Setup mutations
  const publishMutation = useApiMutation(
    async (data: Omit<ShareFormData, 'visibility'>) =>
      apiClient.post(`/api/json/${shareId}/publish`, data),
    {
      successMessage: 'Published successfully!',
      onSuccess: () => {
        setDidSave(true);
        onUpdated?.();
      },
    }
  );

  const unpublishMutation = useApiMutation(
    async () => apiClient.delete(`/api/json/${shareId}/publish`),
    {
      successMessage: 'Made private',
      onSuccess: () => {
        setDidSave(true);
        onUpdated?.();
      },
    }
  );

  // Main save handler
  const handleSave = useCallback(async () => {
    if (!shareId) {
      showValidationErrorToast('No document', 'Please save your document first');
      return;
    }

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

    setIsSaving(true);
    try {
      const currentDocVisibility = currentVisibility === 'public';
      
      // Only publish/unpublish if visibility actually changed
      if (isPublic && !currentDocVisibility) {
        // Switching from private to public - publish with metadata
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { visibility, ...publishData } = formData;
        await publishMutation.mutate(publishData);
      } else if (!isPublic && currentDocVisibility) {
        // Switching from public to private - unpublish
        await unpublishMutation.mutate();
      } else {
        // Visibility unchanged, just update metadata if public
        if (isPublic) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { visibility, ...publishData } = formData;
          await publishMutation.mutate(publishData);
        } else {
          // For private docs, just update title if changed
          showInfoToast('Settings updated', {
            description: 'Your sharing settings have been saved',
          });
          onUpdated?.();
        }
      }
    } finally {
      setIsSaving(false);
    }
  }, [shareId, isPublic, currentVisibility, form, publishMutation, unpublishMutation, onUpdated]);

  return {
    isLoading,
    isSaving,
    didSave,
    handleSave,
  };
}
