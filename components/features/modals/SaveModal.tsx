'use client';

import { useState, useEffect } from 'react';
import { BaseModal } from '@/components/shared/BaseModal';
import { FormInput } from '@/components/shared/FormFields';
import { Save, Globe, Lock } from 'lucide-react';
import { useValidatedForm } from '@/hooks/use-validated-form';
import { z } from 'zod';
import { useBackendStore } from '@/lib/store/backend';
import { showValidationErrorToast, showInfoToast } from '@/lib/utils/toast-helpers';
import { VisibilityToggle } from './share-modal/VisibilityToggle';

const saveFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less').trim(),
  visibility: z.enum(['public', 'private']).default('private'),
});

type SaveFormData = z.infer<typeof saveFormSchema>;

interface SaveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTitle?: string;
  onSaved?: (title?: string) => void;
}

export function SaveModal({
  open,
  onOpenChange,
  currentTitle,
  onSaved,
}: SaveModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const currentDocument = useBackendStore((s) => s.currentDocument);
  const currentJson = useBackendStore((s) => s.currentJson);

  // Don't show modal if document already exists
  const isNewDocument = !currentDocument;

  const form = useValidatedForm(saveFormSchema, {
    defaultValues: {
      title: currentTitle || '',
      visibility: 'private',
    },
    mode: 'onChange',
  });

  const [isPublic, setIsPublic] = useState(false);

  // Sync visibility when modal opens
  useEffect(() => {
    if (open && isNewDocument) {
      form.reset({
        title: currentTitle || '',
        visibility: 'private',
      });
      setIsPublic(false);
    }
  }, [open, isNewDocument, currentTitle, form]);

  const handleSave = async () => {
    const isValid = await form.trigger();
    if (!isValid) {
      showValidationErrorToast('Validation failed', 'Please fix the errors before saving');
      return;
    }

    const formData = form.getValues();

    if (!formData.title.trim()) {
      showValidationErrorToast('Title required', 'Please enter a title to save your JSON');
      return;
    }

    if (!currentJson) {
      showValidationErrorToast('No JSON', 'There is no JSON content to save');
      return;
    }

    setIsSaving(true);
    showInfoToast('Saving JSON', {
      description: 'Creating your document...',
    });

    try {
      const { useBackendStore } = await import('@/lib/store/backend');
      const storeState = useBackendStore.getState() as any;
      const { uploadJson } = storeState;

      const blob = new Blob([currentJson || ''], { type: 'application/json' });
      const file = new File([blob], 'untitled.json', { type: 'application/json' });
      const visibility = isPublic ? 'public' : 'private';
      const document = await uploadJson(file, formData.title.trim(), visibility);

      // If creating as public with metadata, we'll need to publish separately
      // But for now, just save the document
      setIsSaving(false);
      onSaved?.(formData.title.trim());
      onOpenChange(false);
    } catch (e) {
      setIsSaving(false);
      showValidationErrorToast(
        'Save failed',
        e instanceof Error ? e.message : 'Unknown error'
      );
    }
  };

  // Don't show if document already exists
  if (!isNewDocument) {
    return null;
  }

  const modalIcon = isPublic ? (
    <Globe className="h-5 w-5 text-blue-500" />
  ) : (
    <Lock className="h-5 w-5 text-muted-foreground" />
  );

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Save JSON"
      description={isPublic ? 'Save and publish your JSON to the public library' : 'Save your JSON to your library'}
      icon={modalIcon}
      className="sm:max-w-lg lg:max-w-xl"
      maxHeight="90vh"
      closeOnEscape={!isSaving}
      closeOnOverlayClick={!isSaving}
      primaryAction={{
        label: isSaving ? 'Saving...' : isPublic ? 'Save & Publish' : 'Save Document',
        onClick: () => void handleSave(),
        loading: isSaving,
        disabled: isSaving,
        variant: 'default',
        testId: 'save-button',
      }}
      secondaryAction={{
        label: 'Cancel',
        onClick: () => onOpenChange(false),
        variant: 'outline',
        testId: 'save-cancel-button',
      }}
    >
      <div className="space-y-4">
        <FormInput
          id="title"
          label="Title"
          required
          placeholder="Give your JSON a name"
          maxLength={200}
          className="font-medium"
          error={form.formState.errors.title?.message as string}
          {...form.register('title', {
            onBlur: () => form.trigger('title'),
          })}
        />

        <VisibilityToggle
          isPublic={isPublic}
          onToggle={setIsPublic}
          disabled={isSaving}
        />

        {isPublic && (
          <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
            <p className="font-medium mb-1">Publishing to Public Library</p>
            <p className="text-xs">
              Your JSON will be visible in the public library. You can add description, tags, and category later via Share settings.
            </p>
          </div>
        )}
      </div>
    </BaseModal>
  );
}

