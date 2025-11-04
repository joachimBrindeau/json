'use client';

import { useState, useEffect, useRef } from 'react';
import { Controller } from 'react-hook-form';
import { BaseModal } from '@/components/shared/BaseModal';
import { Badge } from '@/components/ui/badge';
import { toastPatterns, showErrorToast } from '@/lib/utils/toast-helpers';
import { useFormSubmit } from '@/hooks/use-form-submit';
import { useValidatedForm } from '@/hooks/use-validated-form';
import { publishFormSchema, PublishFormData } from '@/lib/validation/schemas';
import dynamic from 'next/dynamic';
const RichTextEditor = dynamic(
  () => import('@/components/features/editor').then((m) => m.RichTextEditor),
  {
    ssr: false,
    loading: () => <div className="text-xs text-muted-foreground p-2">Loading editor...</div>,
  }
);
import { TagManagementSection } from '@/components/features/shared/TagManagementSection';
import { FormInput, FormTextarea, FormSelect, FormRichText } from '@/components/shared/FormFields';
import { Globe, Users, Eye, Loader2 } from 'lucide-react';
import { logger } from '@/lib/logger';
import { apiClient } from '@/lib/api/client';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { DOCUMENT_CATEGORIES } from '@/lib/constants/categories';

interface PublishModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareId: string;
  currentTitle?: string;
  onPublished?: () => void;
}

export function PublishModal({
  open,
  onOpenChange,
  shareId,
  currentTitle,
  onPublished,
}: PublishModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Initialize form with react-hook-form and Zod validation
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useValidatedForm<typeof publishFormSchema>(publishFormSchema, {
    defaultValues: {
      title: currentTitle || '',
      description: '',
      richContent: '',
      category: '',
      tags: [],
    },
  });

  // Watch form values for preview and character count
  const watchedTitle = watch('title');
  const watchedDescription = watch('description');
  const watchedRichContent = watch('richContent');
  const watchedCategory = watch('category');
  const watchedTags = watch('tags');

  // Load existing data when modal opens
  useEffect(() => {
    if (open && shareId) {
      setIsLoading(true);
      apiClient
        .get<{
          document: {
            title?: string;
            description?: string;
            richContent?: string;
            category?: string;
            tags?: string[];
          };
        }>(`/api/json/${shareId}`)
        .then((data) => {
          if (data.document) {
            const doc = data.document;
            reset({
              title: doc.title || currentTitle || '',
              description: doc.description || '',
              richContent: doc.richContent || '',
              category: (doc.category || '') as any,
              tags: doc.tags || [],
            });
          }
        })
        .catch((error) => {
          logger.error({ err: error, shareId }, 'Failed to load document data for publish modal');
          showErrorToast(error, 'Failed to load document data');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [open, shareId, currentTitle, reset]);

  // Submit handler with type-safe form data
  const onSubmit = async (data: PublishFormData) => {
    try {
      await apiClient.post(`/api/json/${shareId}/publish`, data);
      toastPatterns.success.published('JSON');
      onPublished?.();
      onOpenChange(false);
    } catch (error) {
      logger.error({ err: error, shareId, formData: data }, 'Failed to publish JSON to library');
      toastPatterns.error.publish(error);
    }
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Publish to Public Library"
      description="Share your JSON with the community and make it discoverable"
      icon={<Globe className="h-5 w-5 text-blue-500" />}
      className="max-w-2xl"
      maxHeight="90vh"
      primaryAction={{
        label: isSubmitting ? 'Publishing...' : 'Publish to Community',
        onClick: () => {
          formRef.current?.requestSubmit();
        },
        loading: isSubmitting,
        disabled: isSubmitting || !watchedTitle?.trim() || isLoading,
        variant: 'default',
        testId: 'publish-button',
      }}
          secondaryAction={{
            label: 'Cancel',
            onClick: () => onOpenChange(false),
            variant: 'outline',
            testId: 'publish-cancel-button',
          }}
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="md" />
          <span className="ml-2 text-muted-foreground">Loading document details...</span>
        </div>
      ) : (
        <ErrorBoundary
          level="component"
          fallback={
            <div className="p-6 text-center">
              <p className="text-sm text-muted-foreground">Failed to load publish form</p>
            </div>
          }
          enableRetry
          maxRetries={2}
        >
          <div className="space-y-6">
            {/* Benefits */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-900 mb-2">
                <Users className="h-4 w-4" />
                <span className="font-medium">Share with the community</span>
              </div>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Help other developers with real-world examples</li>
                <li>• Make your JSON searchable and discoverable</li>
                <li>• Get analytics on views and usage</li>
              </ul>
            </div>

            {/* Form */}
            <form ref={formRef} onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
                {/* Title */}
                <FormInput
                  id="title"
                  label="Title"
                  required
                  placeholder="e.g., E-commerce Product API Response"
                  maxLength={200}
                  error={errors.title?.message as string}
                  {...register('title')}
                />

                {/* Description */}
                <FormTextarea
                  id="description"
                  label="Short Description"
                  placeholder="Brief description for search results and previews..."
                  maxLength={300}
                  rows={2}
                  showCharCount
                  error={errors.description?.message as string}
                  value={watchedDescription}
                  {...register('description')}
                />

                {/* Rich Content */}
                <FormRichText
                  label="Detailed Explanation"
                  error={errors.richContent?.message as string}
                  description="Rich text with formatting, links, and lists for better SEO and user experience"
                >
                  <Controller
                    name="richContent"
                    control={control}
                    render={({ field }) => (
                      <RichTextEditor
                        content={field.value || ''}
                        onChange={field.onChange}
                        placeholder="Add detailed explanations, use cases, examples, or documentation for this JSON..."
                      />
                    )}
                  />
                </FormRichText>

                {/* Category */}
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <FormSelect
                      label="Category"
                      placeholder="Select a category"
                      value={field.value}
                      onValueChange={field.onChange}
                      options={DOCUMENT_CATEGORIES.map((cat) => ({ value: cat, label: cat }))}
                      error={errors.category?.message as string}
                    />
                  )}
                />

                {/* Tags */}
                <Controller
                  name="tags"
                  control={control}
                  render={({ field }) => (
                    <TagManagementSection
                      selectedTags={field.value || []}
                      onTagsChange={field.onChange}
                      category={watchedCategory}
                      maxTags={10}
                    />
                  )}
                />
                {errors.tags && (
                  <p className="text-xs text-red-500 mt-1">{errors.tags.message as string}</p>
                )}

                {/* Preview */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-700 mb-2">
                    <Eye className="h-4 w-4" />
                    <span className="font-medium">Preview</span>
                  </div>
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">
                      {watchedTitle || 'Untitled JSON'}
                    </div>
                    {watchedDescription && (
                      <div className="text-gray-600 mt-1">{watchedDescription}</div>
                    )}
                    {watchedRichContent && (
                      <div className="mt-2 p-2 bg-white border rounded text-xs">
                        <div className="font-medium text-gray-700 mb-1">Rich Content Preview:</div>
                        <div
                          className="prose prose-xs max-w-none"
                          dangerouslySetInnerHTML={{ __html: watchedRichContent }}
                        />
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      {watchedCategory && <Badge variant="outline">{watchedCategory}</Badge>}
                      {watchedTags?.map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

            </form>
          </div>
        </ErrorBoundary>
      )}
    </BaseModal>
  );
}
