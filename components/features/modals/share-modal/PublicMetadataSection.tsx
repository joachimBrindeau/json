'use client';

import { useState } from 'react';
import { Controller } from 'react-hook-form';
import { Users, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FormTextarea, FormSelect } from '@/components/shared/FormFields';
import { TagManagementSection } from '@/components/features/shared/TagManagementSection';
import { DOCUMENT_CATEGORIES } from '@/lib/constants/categories';
import type { UseFormReturn } from 'react-hook-form';
import type { ShareFormData } from '@/lib/validation/schemas';

interface PublicMetadataSectionProps {
  form: UseFormReturn<ShareFormData>;
  category: string;
  disabled?: boolean;
}

export function PublicMetadataSection({ form, category, disabled }: PublicMetadataSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const title = form.watch('title');
  const description = form.watch('description');
  const tags = form.watch('tags') || [];

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-blue-50/50">
      <Button
        type="button"
        variant="ghost"
        className="w-full justify-between p-0 h-auto hover:bg-transparent"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2 text-blue-900">
          <Users className="h-4 w-4" />
          <span className="font-medium">Public Library Details (Optional)</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-blue-600" />
        ) : (
          <ChevronDown className="h-4 w-4 text-blue-600" />
        )}
      </Button>
      {isExpanded && (
        <>
          <p className="text-sm text-blue-700">
            Help others discover your JSON by adding details below
          </p>

      <FormTextarea
        id="description"
        label="Description"
        placeholder="Optional: Describe what this JSON represents..."
        maxLength={1000}
        rows={3}
        disabled={disabled}
        error={form.formState.errors.description?.message as string}
        {...form.register('description')}
      />

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
            disabled={disabled}
            error={form.formState.errors.category?.message as string}
          />
        )}
      />

      <Controller
        name="tags"
        control={form.control}
        render={({ field }) => (
          <TagManagementSection
            selectedTags={field.value || []}
            onTagsChange={field.onChange}
            category={category}
            maxTags={10}
            disabled={disabled}
          />
        )}
      />
      {form.formState.errors.tags && (
        <p className="text-sm text-red-500">{form.formState.errors.tags.message as string}</p>
      )}

      <div className="bg-white border rounded-lg p-3">
        <div className="flex items-center gap-2 text-gray-700 mb-2">
          <Eye className="h-4 w-4" />
          <span className="font-medium text-sm">Library Preview</span>
        </div>
        <div className="text-sm">
          <div className="font-medium text-gray-900">{title || 'Untitled JSON'}</div>
          {description && <div className="text-gray-600 mt-1 text-xs">{description}</div>}
          <div className="flex items-center gap-1 mt-2">
            {category && (
              <Badge variant="outline" className="text-xs">
                {category}
              </Badge>
            )}
            {tags.slice(0, 3).map((tag: string) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                #{tag}
              </Badge>
            ))}
            {tags.length > 3 && (
              <span className="text-xs text-muted-foreground">+{tags.length - 3} more</span>
            )}
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
}

