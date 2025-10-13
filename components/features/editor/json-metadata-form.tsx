'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useFormSubmit } from '@/hooks/use-form-submit';
import { RichTextEditor } from '@/components/rich-text-editor';
import {
  Globe,
  Lock,
  X,
  AlertCircle,
  CheckCircle2,
  Info,
  Loader2,
  Save,
  Plus
} from 'lucide-react';
import {
  normalizeTag,
  validateTag,
  getCommonTagsForCategory,
  suggestTags,
} from '@/lib/tags/tag-utils';
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
  const [tagInput, setTagInput] = useState('');
  const [tagValidation, setTagValidation] = useState<{
    normalized?: string;
    errors: string[];
    warnings: string[];
  }>({ errors: [], warnings: [] });
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Update suggested tags when category or content changes
  useEffect(() => {
    const commonTags = formData.category ? getCommonTagsForCategory(formData.category) : [];
    const contentTags = suggestTags(formData.title + ' ' + formData.description);
    const allSuggested = [...new Set([...commonTags, ...contentTags])];
    const filtered = allSuggested.filter(tag => !formData.tags.includes(tag));
    setSuggestedTags(filtered.slice(0, 5));
  }, [formData.category, formData.title, formData.description, formData.tags]);

  // Validate tag as user types
  useEffect(() => {
    if (tagInput.trim()) {
      const validation = validateTag(tagInput.trim());
      setTagValidation(validation);
    } else {
      setTagValidation({ errors: [], warnings: [] });
    }
  }, [tagInput]);

  const addTag = useCallback(() => {
    const validation = validateTag(tagInput.trim());
    if (validation.isValid && validation.normalized) {
      // Check for duplicates
      const normalizedTags = formData.tags.map(t => normalizeTag(t));
      if (normalizedTags.includes(validation.normalized)) {
        toast({
          title: 'Duplicate tag',
          description: `Tag "${validation.normalized}" already exists`,
          variant: 'destructive',
        });
        return;
      }

      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, validation.normalized!],
      }));
      setTagInput('');
      setTagValidation({ errors: [], warnings: [] });
      setShowSuggestions(false);
    } else {
      toast({
        title: 'Invalid tag',
        description: validation.errors[0],
        variant: 'destructive',
      });
    }
  }, [tagInput, formData.tags, toast]);

  const addSuggestedTag = useCallback(
    (tag: string) => {
      const normalizedTags = formData.tags.map((t) => normalizeTag(t));
      if (!normalizedTags.includes(tag) && formData.tags.length < 10) {
        setFormData((prev) => ({
          ...prev,
          tags: [...prev.tags, tag],
        }));
      }
      setTagInput('');
      setShowSuggestions(false);
    },
    [formData.tags]
  );

  const removeTag = useCallback((tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  }, []);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addTag();
      }
    },
    [addTag]
  );

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
      <div>
        <Label className="text-sm font-medium mb-2 block">Visibility</Label>
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
        <div className="text-xs text-muted-foreground mt-1">
          {formData.visibility === 'public' 
            ? 'Visible in public library and searchable by others'
            : 'Only visible to you in your private library'
          }
        </div>
      </div>

      {/* Title */}
      <div>
        <Label htmlFor="title" className="text-sm font-medium">
          Title <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
          placeholder="e.g., E-commerce Product API Response"
          maxLength={200}
          className="mt-1"
        />
        <div className="text-xs text-muted-foreground mt-1">
          {formData.title.length}/200 characters
        </div>
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description" className="text-sm font-medium">
          Short Description
        </Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Brief description for search results and previews..."
          maxLength={300}
          rows={2}
          className="mt-1"
        />
        <div className="text-xs text-muted-foreground mt-1">
          {formData.description.length}/300 characters
        </div>
      </div>

      {/* Rich Content */}
      <div>
        <Label htmlFor="rich-content" className="text-sm font-medium">
          Detailed Explanation <span className="text-muted-foreground text-xs">(Optional)</span>
        </Label>
        <ErrorBoundary
          level="widget"
          fallback={<div className="text-xs text-muted-foreground p-2">Rich text editor unavailable</div>}
          compactMode
        >
        <div className="mt-1">
          <RichTextEditor
            content={formData.richContent}
            onChange={(content) => setFormData((prev) => ({ ...prev, richContent: content }))}
            placeholder="Add detailed explanations, use cases, examples, or documentation for this JSON..."
          />
        </div>
        </ErrorBoundary>
        <div className="text-xs text-muted-foreground mt-1">
          Rich text with formatting, links, and lists for better SEO and user experience
        </div>
      </div>

      {/* Category */}
      <div>
        <Label htmlFor="category" className="text-sm font-medium">
          Category
        </Label>
        <Select
          value={formData.category}
          onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {DOCUMENT_CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tags */}
      <ErrorBoundary
        level="widget"
        fallback={<div className="text-xs text-muted-foreground p-2">Tag input unavailable</div>}
        compactMode
      >
      <div>
        <Label htmlFor="tags" className="text-sm font-medium">
          Tags ({formData.tags.length}/10)
        </Label>
        <div className="mt-1 space-y-2">
          <div className="relative">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  onFocus={() => setShowSuggestions(suggestedTags.length > 0)}
                  placeholder="Add tags... (press Enter)"
                  maxLength={30}
                  className={`pr-8 ${
                    tagValidation.errors.length > 0
                      ? 'border-red-500 focus:ring-red-500'
                      : tagValidation.warnings.length > 0
                        ? 'border-yellow-500 focus:ring-yellow-500'
                        : ''
                  }`}
                />
                {tagInput && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    {tagValidation.errors.length > 0 ? (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    ) : tagValidation.warnings.length > 0 ? (
                      <Info className="h-4 w-4 text-yellow-500" />
                    ) : tagValidation.normalized ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : null}
                  </div>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={addTag}
                disabled={
                  !tagInput.trim() ||
                  formData.tags.length >= 10 ||
                  tagValidation.errors.length > 0
                }
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Real-time validation feedback */}
            {tagInput &&
              tagValidation.normalized &&
              tagInput !== tagValidation.normalized && (
                <div className="text-xs text-blue-600 mt-1">
                  Will be saved as:{' '}
                  <span className="font-mono">{tagValidation.normalized}</span>
                </div>
              )}
            {tagValidation.errors.length > 0 && (
              <div className="text-xs text-red-500 mt-1">{tagValidation.errors[0]}</div>
            )}
            {tagValidation.warnings.length > 0 && tagValidation.errors.length === 0 && (
              <div className="text-xs text-yellow-600 mt-1">{tagValidation.warnings[0]}</div>
            )}

            {/* Tag suggestions dropdown */}
            {showSuggestions && suggestedTags.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
                <div className="py-1">
                  <div className="px-3 py-1 text-xs text-gray-500">Suggested tags:</div>
                  {suggestedTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => addSuggestedTag(tag)}
                      className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 focus:bg-gray-100"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Common tags for quick selection */}
          {formData.category && formData.tags.length < 10 && (
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Common tags for this category:</div>
              <div className="flex flex-wrap gap-1">
                {getCommonTagsForCategory(formData.category)
                  .filter(tag => !formData.tags.includes(tag))
                  .slice(0, 5)
                  .map((tag) => (
                    <button
                      key={tag}
                      onClick={() => addSuggestedTag(tag)}
                      className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {tag}
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Current tags */}
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => removeTag(tag)}
                  />
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
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