'use client';

import { useState, useCallback, useEffect } from 'react';
import { Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useFormSubmit } from '@/hooks/use-form-submit';
import { useValidatedForm } from '@/hooks/use-validated-form';
import { jsonMetadataFormSchema, type JsonMetadataFormData } from '@/lib/validation/schemas';
import dynamic from 'next/dynamic';
const RichTextEditor = dynamic(
  () => import('@/components/features/editor/rich-text-editor').then((m) => m.RichTextEditor),
  {
    ssr: false,
    loading: () => <div className="text-xs text-muted-foreground p-2">Loading editor…</div>,
  }
);
import { TagManagementSection } from '@/components/features/shared/TagManagementSection';
import { FormInput, FormTextarea, FormSelect, FormRichText } from '@/components/shared/form-fields';
import { Globe, Lock, Loader2, Save } from 'lucide-react';
import { DOCUMENT_CATEGORIES } from '@/lib/constants/categories';
import { ErrorBoundary } from '@/components/shared/error-boundary';

interface JsonMetadataFormProps {
  /** Initial form data */
  initialData?: {
    title?: string;
    description?: string;
    richContent?: string;
    category?: string;
    tags?: string[];
    visibility?: 'private' | 'public';
  };
  /** Whether this is for creating a new JSON or editing existing */
  mode: 'create' | 'edit';
  /** Whether the form is embedded in the library page */
  embedded?: boolean;
  /** Callback when form is submitted */
  onSubmit?: (data: {
    title: string;
    description: string;
    richContent: string;
    category: string;
    tags: string[];
    visibility: 'private' | 'public';
  }) => Promise<void>;
  /** Callback when form is cancelled */
  onCancel?: () => void;
}

export function JsonMetadataForm({
  initialData,
  mode,
  embedded = true,
  onSubmit,
  onCancel,
}: JsonMetadataFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    richContent: initialData?.richContent || '',
    category: initialData?.category || '',
    tags: initialData?.tags || [],
    visibility: initialData?.visibility || ('private' as 'private' | 'public'),
  });

  const form = useValidatedForm(jsonMetadataFormSchema, {
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      richContent: initialData?.richContent || '',
      category: initialData?.category || '',
      tags: initialData?.tags || [],
      visibility: initialData?.visibility || 'private',
    },
  });

  const {
    control,
    register,
    handleSubmit: rhfHandleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const { submit: submitForm, isSubmitting } = useFormSubmit(
    async (data: JsonMetadataFormData) => {
      if (!data.title?.trim()) {
        throw new Error('Please provide a title for your JSON');
      }
      if (onSubmit) {
        await onSubmit(data);
      }
    },
    {
      onSuccess: () => {
        toast({
          title: mode === 'create' ? 'JSON created' : 'JSON updated',
          description:
            mode === 'create'
              ? 'Your JSON has been saved successfully'
              : 'Your changes have been saved',
        });
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: error.message || 'Failed to save JSON',
          variant: 'destructive',
        });
      },
    }
  );

  const visibility = watch('visibility');

  const formContent = (
    <div className="space-y-6">
      {/* Visibility Toggle */}
      <div className="space-y-2">
        <div className="text-sm font-medium">Visibility</div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={visibility === 'private' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setValue('visibility', 'private')}
            className="flex items-center gap-2"
          >
            <Lock className="h-4 w-4" />
            Private
          </Button>
          <Button
            type="button"
            variant={visibility === 'public' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setValue('visibility', 'public')}
            className="flex items-center gap-2"
          >
            <Globe className="h-4 w-4" />
            Public
          </Button>
        </div>
        <div className="text-xs text-muted-foreground">
          {visibility === 'public'
            ? 'Visible in public library and searchable by others'
            : 'Only visible to you in your private library'}
        </div>
      </div>

      {/* Title */}
      <FormInput
        id="title"
        label="Title"
        required
        placeholder="e.g., E-commerce Product API Response"
        maxLength={200}
        showCharCount
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
        {...register('description')}
      />

      {/* Rich Content */}
      <ErrorBoundary
        level="widget"
        fallback={
          <div className="text-xs text-muted-foreground p-2">Rich text editor unavailable</div>
        }
        compactMode
      >
        <FormRichText
          label="Detailed Explanation"
          description="Rich text with formatting, links, and lists for better SEO and user experience"
          error={errors.richContent?.message as string}
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
      </ErrorBoundary>

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
      <ErrorBoundary
        level="widget"
        fallback={<div className="text-xs text-muted-foreground p-2">Tag input unavailable</div>}
        compactMode
      >
        <Controller
          name="tags"
          control={control}
          render={({ field }) => (
            <TagManagementSection
              selectedTags={field.value || []}
              onTagsChange={field.onChange}
              category={watch('category')}
              maxTags={10}
            />
          )}
        />
      </ErrorBoundary>

      {/* Action buttons */}
      <div className="flex gap-2 pt-4">
        <Button
          onClick={() => rhfHandleSubmit(submitForm)()}
          disabled={isSubmitting || !(watch('title') || '').trim()}
          className="flex items-center gap-2"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {mode === 'create' ? 'Save JSON' : 'Update JSON'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );

  if (embedded) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {mode === 'create' ? 'Create New JSON' : 'Edit JSON Details'}
          </CardTitle>
        </CardHeader>
        <CardContent>{formContent}</CardContent>
      </Card>
    );
  }

  return formContent;
}
