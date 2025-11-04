'use client';

import { useState, useCallback } from 'react';
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
  onUpdated?: (title?: string) => void;
  onClose: () => void;
}

export function useShareModalState({
  shareId,
  currentVisibility,
  form,
  onUpdated,
  onClose,
}: UseShareModalStateProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublic, setIsPublic] = useState(currentVisibility === 'public');
  const [didSave, setDidSave] = useState(false);

  // Setup mutations
  const publishMutation = useApiMutation(
    async (data: Omit<ShareFormData, 'visibility'>) =>
      apiClient.post(`/api/json/${shareId}/publish`, data),
    {
      successMessage: 'Published successfully!',
      onSuccess: () => {
        onUpdated?.();
        onClose();
      },
    }
  );

  const unpublishMutation = useApiMutation(
    async () => apiClient.delete(`/api/json/${shareId}/publish`),
    {
      successMessage: 'Made private',
      onSuccess: () => {
        onUpdated?.();
        onClose();
      },
    }
  );

  // Save handler for new documents
  const saveNewDocument = useCallback(
    async (title: string): Promise<string> => {
      setIsSaving(true);
      showInfoToast('Saving JSON with title', {
        description: 'Creating your document and share link...',
      });

      try {
        const { useBackendStore } = await import('@/lib/store/backend');
        const storeState = useBackendStore.getState() as any;
        const { uploadJson, currentJson } = storeState;

        const blob = new Blob([currentJson || ''], { type: 'application/json' });
        const file = new File([blob], 'untitled.json', { type: 'application/json' });
        const document = await uploadJson(file, title);
        
        setIsSaving(false);
        setDidSave(true);
        onUpdated?.(title);
        
        // Return the new shareId so parent can update if needed
        // Don't auto-close - let user see the generated link
        return document.shareId;
      } catch (e) {
        setIsSaving(false);
        showValidationErrorToast(
          'Save failed',
          e instanceof Error ? e.message : 'Unknown error'
        );
        throw e;
      }
    },
    [onUpdated]
  );

  // Main save handler
  const handleSave = useCallback(async () => {
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

    // Handle new document creation
    if (!shareId) {
      if (!formData.title.trim()) {
        showValidationErrorToast('Title required', 'Please enter a title to save your JSON');
        return;
      }
      setIsUpdating(true);
      try {
        const newShareId = await saveNewDocument(formData.title.trim());
        // Store will be updated by uploadJson, but we return the shareId for reference
        // The ShareModal will read from store via useBackendStore hook
      } finally {
        setIsUpdating(false);
      }
      return;
    }

    // Handle existing document updates
    setIsUpdating(true);
    try {
      if (isPublic) {
        const { visibility, ...publishData } = formData;
        await publishMutation.mutate(publishData);
      } else {
        await unpublishMutation.mutate();
      }
    } finally {
      setIsUpdating(false);
    }
  }, [shareId, isPublic, form, saveNewDocument, publishMutation, unpublishMutation]);

  return {
    isUpdating,
    isSaving,
    isPublic,
    didSave,
    setIsPublic,
    handleSave,
  };
}

