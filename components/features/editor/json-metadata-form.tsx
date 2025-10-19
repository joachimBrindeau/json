'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useFormSubmit } from '@/hooks/use-form-submit';
import { RichTextEditor } from '@/components/features/editor/rich-text-editor';
import { TagManagementSection } from '@/components/features/shared/TagManagementSection';
import { FormInput, FormTextarea, FormSelect, FormRichText } from '@/components/shared/form-fields';
import {
  Globe,
  Lock,
  Loader2,
  Save,
} from 'lucide-react';
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
    visibility: initialData?.visibility || 'private' as 'private' | 'public',
  });

  const { submit: handleSubmit, isSubmitting } = useFormSubmit(
    async () => {
      if (!formData.title.trim()) {
        throw new Error('Please provide a title for your JSON');
      }

      if (onSubmit) {
        await onSubmit(formData);
      }
    },
    {
      onSuccess: () => {
        toast({
          title: mode === 'create' ? 'JSON created' : 'JSON updated',
          description: mode === 'create'
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

  const formContent = (
    <div className="space-y-6">
      {/* Visibility Toggle */}
      <div className="space-y-2">
        <div className="text-sm font-medium">Visibility</div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={formData.visibility === 'private' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFormData(prev => ({ ...prev, visibility: 'private' }))}
            className="flex items-center gap-2"
          >
            <Lock className="h-4 w-4" />
            Private
          </Button>
          <Button
            type="button"
            variant={formData.visibility === 'public' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFormData(prev => ({ ...prev, visibility: 'public' }))}
            className="flex items-center gap-2"
          >
            <Globe className="h-4 w-4" />
            Public
          </Button>
        </div>
        <div className="text-xs text-muted-foreground">
          {formData.visibility === 'public'
            ? 'Visible in public library and searchable by others'
            : 'Only visible to you in your private library'
          }
        </div>
      </div>

      {/* Title */}
      <FormInput
        id="title"
        label="Title"
        required
        value={formData.title}
        onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
        placeholder="e.g., E-commerce Product API Response"
        maxLength={200}
        showCharCount
      />

      {/* Description */}
      <FormTextarea
        id="description"
        label="Short Description"
        value={formData.description}
        onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
        placeholder="Brief description for search results and previews..."
        maxLength={300}
        rows={2}
        showCharCount
      />

      {/* Rich Content */}
      <ErrorBoundary
        level="widget"
        fallback={<div className="text-xs text-muted-foreground p-2">Rich text editor unavailable</div>}
        compactMode
      >
        <FormRichText
          label="Detailed Explanation"
          description="Rich text with formatting, links, and lists for better SEO and user experience"
        >
          <RichTextEditor
            content={formData.richContent}
            onChange={(content) => setFormData((prev) => ({ ...prev, richContent: content }))}
            placeholder="Add detailed explanations, use cases, examples, or documentation for this JSON..."
          />
        </FormRichText>
      </ErrorBoundary>

      {/* Category */}
      <FormSelect
        label="Category"
        placeholder="Select a category"
        value={formData.category}
        onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
        options={DOCUMENT_CATEGORIES.map(cat => ({ value: cat, label: cat }))}
      />

      {/* Tags */}
      <ErrorBoundary
        level="widget"
        fallback={<div className="text-xs text-muted-foreground p-2">Tag input unavailable</div>}
        compactMode
      >
        <TagManagementSection
          selectedTags={formData.tags}
          onTagsChange={(tags) => setFormData((prev) => ({ ...prev, tags }))}
          category={formData.category}
          maxTags={10}
        />
      </ErrorBoundary>

      {/* Action buttons */}
      <div className="flex gap-2 pt-4">
        <Button
          onClick={() => handleSubmit(undefined)}
          disabled={isSubmitting || !formData.title.trim()}
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
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
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
        <CardContent>
          {formContent}
        </CardContent>
      </Card>
    );
  }

  return formContent;
}