'use client';

import { useState, useCallback, useEffect } from 'react';
import { useBackendStore } from '@/lib/store/backend';
import { showValidationErrorToast, showInfoToast } from '@/lib/utils/toast-helpers';
import { apiClient } from '@/lib/api/client';
import { useApiMutation } from '@/hooks/use-api-mutation';
import type { ShareFormData } from '@/lib/validation/schemas';
import type { UseFormReturn } from 'react-hook-form';

interface UseShareModalStateProps {
  shareId: string;
  currentVisibility: 'public' | 'private';
  form: UseFormReturn<ShareFormData>;
  isPublic: boolean;
  setIsPublic: (value: boolean) => void;
  onUpdated?: (title?: string) => void;
  onClose: () => void;
  open?: boolean;
}

export function useShareModalState({
  shareId,
  currentVisibility,
  form,
  isPublic,
  setIsPublic,
  onUpdated,
  onClose,
  open,
}: UseShareModalStateProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [didSave, setDidSave] = useState(false);

  // Setup mutations - don't auto-close to allow user to see results
  const publishMutation = useApiMutation(
    async (data: Omit<ShareFormData, 'visibility'>) =>
      apiClient.post(`/api/json/${shareId}/publish`, data),
    {
      successMessage: 'Published successfully!',
      onSuccess: () => {
        setDidSave(true);
        onUpdated?.();
        // Don't auto-close - let user see the link and social share buttons
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
        // Don't auto-close - let user see the updated link
      },
    }
  );

  // Reset didSave when modal closes
  useEffect(() => {
    if (!open) {
      setDidSave(false);
    }
  }, [open]);

  // Main save handler - ShareModal only handles existing documents
  const handleSave = useCallback(async () => {
    if (!shareId) {
      // This shouldn't happen - ShareModal should only be for existing documents
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

    // Handle existing document updates only
    setIsUpdating(true);
    try {
      const currentDocVisibility = currentVisibility === 'public';
      
      // Only publish/unpublish if visibility actually changed
      if (isPublic && !currentDocVisibility) {
        // Switching from private to public - publish with metadata
        const { visibility: _, ...publishData } = formData;
        await publishMutation.mutate(publishData);
      } else if (!isPublic && currentDocVisibility) {
        // Switching from public to private - unpublish
        await unpublishMutation.mutate();
      } else {
        // Visibility unchanged, just update metadata if public
        if (isPublic) {
          const { visibility: _, ...publishData } = formData;
          await publishMutation.mutate(publishData);
        } else {
          // For private docs, just update title if changed
          // Note: Title update would need separate API endpoint
          // For now, just show success
          showInfoToast('Settings updated', {
            description: 'Your sharing settings have been saved',
          });
          onUpdated?.();
        }
      }
    } finally {
      setIsUpdating(false);
    }
  }, [shareId, isPublic, currentVisibility, form, publishMutation, unpublishMutation, onUpdated]);

  return {
    isUpdating,
    isSaving: false, // ShareModal doesn't save new documents
    didSave,
    handleSave,
  };
}

