'use client';

import { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { useToast } from '@/hooks/use-toast';
import { RichTextEditor } from '@/components/features/editor/rich-text-editor';
import { Globe, Users, Eye, X, AlertCircle, CheckCircle2, Info, Loader2 } from 'lucide-react';
import {
  normalizeTag,
  validateTag,
  getCommonTagsForCategory,
  suggestTags,
} from '@/lib/tags/tag-utils';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareId: string;
  currentTitle?: string;
  onPublished?: () => void;
}

const CATEGORIES = [
  'API Response',
  'Configuration',
  'Database Schema',
  'Test Data',
  'Template',
  'Example',
] as const;

export function PublishModal({
  isOpen,
  onClose,
  shareId,
  currentTitle,
  onPublished,
}: PublishModalProps) {
  const { toast } = useToast();
  const [isPublishing, setIsPublishing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: currentTitle || '',
    description: '',
    richContent: '',
    category: '',
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState('');
  const [tagValidation, setTagValidation] = useState<{
    normalized?: string;
    errors: string[];
    warnings: string[];
  }>({ errors: [], warnings: [] });
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Load existing data when modal opens for editing
  useEffect(() => {
    if (isOpen && shareId) {
      setIsLoading(true);
      fetch(`/api/json/${shareId}`)
        .then(res => res.json())
        .then(data => {
          if (data.document) {
            const doc = data.document;
            setFormData({
              title: doc.title || currentTitle || '',
              description: doc.description || '',
              richContent: doc.richContent || '',
              category: doc.category || '',
              tags: doc.tags || [],
            });
          }
        })
        .catch(error => {
          console.error('Failed to load document data:', error);
          // Keep default form data on error
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, shareId, currentTitle]);

  const handlePublish = useCallback(async () => {
    if (!formData.title.trim()) {
      toast({
        title: 'Title required',
        description: 'Please provide a title for your JSON',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsPublishing(true);
      const response = await fetch(`/api/json/${shareId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to publish');
      }

      const result = await response.json();

      toast({
        title: 'Published successfully!',
        description: `Your JSON is now discoverable in the public library`,
      });

      onPublished?.();
      onClose();
    } catch (error) {
      toast({
        title: 'Failed to publish',
        description: 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setIsPublishing(false);
    }
  }, [formData, shareId, toast, onPublished, onClose]);

  // Fetch existing tags for suggestions
  const fetchExistingTags = useCallback(
    async (query: string) => {
      try {
        const params = new URLSearchParams();
        if (query) params.set('q', query);
        if (formData.category) params.set('category', formData.category);
        params.set('limit', '10');

        const response = await fetch(`/api/tags?${params}`);
        if (response.ok) {
          const data = await response.json();
          return data.tags.map((t: { tag: string }) => t.tag);
        }
      } catch (error) {
        console.error('Failed to fetch tags:', error);
      }
      return [];
    },
    [formData.category]
  );

  // Validate tag input in real-time
  useEffect(() => {
    if (!tagInput) {
      setTagValidation({ errors: [], warnings: [] });
      setShowSuggestions(false);
      return;
    }

    const validation = validateTag(tagInput, formData.tags);
    setTagValidation(validation);

    // Fetch suggestions from existing tags
    if (tagInput.length >= 2) {
      fetchExistingTags(tagInput).then((tags) => {
        if (tags.length > 0) {
          setSuggestedTags(tags);
          setShowSuggestions(true);
        } else {
          // Fall back to category-based suggestions
          const categoryTags = getCommonTagsForCategory(formData.category);
          const suggestions = suggestTags(tagInput, categoryTags, 5);
          setSuggestedTags(suggestions);
          setShowSuggestions(suggestions.length > 0);
        }
      });
    }
  }, [tagInput, formData.tags, formData.category, fetchExistingTags]);

  const addTag = useCallback(() => {
    if (!tagInput.trim() || formData.tags.length >= 10) return;

    const validation = validateTag(tagInput, formData.tags);

    if (validation.isValid && validation.normalized) {
      // Check if the normalized version already exists
      const normalizedTags = formData.tags.map((t) => normalizeTag(t));
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
        tags: [...prev.tags, validation.normalized!], // We already checked it's not undefined
      }));
      setTagInput('');
      setTagValidation({ errors: [], warnings: [] });
      setShowSuggestions(false);
    } else {
      // Show validation errors
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-500" />
            Publish to Public Library
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading document details...</span>
          </div>
        ) : (
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
          <div className="space-y-4">
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
              <div className="mt-1">
                <RichTextEditor
                  content={formData.richContent}
                  onChange={(content) => setFormData((prev) => ({ ...prev, richContent: content }))}
                  placeholder="Add detailed explanations, use cases, examples, or documentation for this JSON..."
                />
              </div>
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
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tags */}
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
                      Add
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
                    <div className="text-xs text-gray-500">
                      Popular tags for {formData.category}:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {getCommonTagsForCategory(formData.category)
                        .filter((tag) => !formData.tags.map((t) => normalizeTag(t)).includes(tag))
                        .slice(0, 5)
                        .map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="cursor-pointer hover:bg-gray-100 text-xs"
                            onClick={() => addSuggestedTag(tag)}
                          >
                            + {tag}
                          </Badge>
                        ))}
                    </div>
                  </div>
                )}

                {/* Added tags */}
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <div
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:bg-gray-300 rounded-full p-0.5 cursor-pointer"
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              removeTag(tag);
                            }
                          }}
                        >
                          <X className="h-3 w-3" />
                        </div>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-700 mb-2">
              <Eye className="h-4 w-4" />
              <span className="font-medium">Preview</span>
            </div>
            <div className="text-sm">
              <div className="font-medium text-gray-900">{formData.title || 'Untitled JSON'}</div>
              {formData.description && (
                <div className="text-gray-600 mt-1">{formData.description}</div>
              )}
              {formData.richContent && (
                <div className="mt-2 p-2 bg-white border rounded text-xs">
                  <div className="font-medium text-gray-700 mb-1">Rich Content Preview:</div>
                  <div 
                    className="prose prose-xs max-w-none"
                    dangerouslySetInnerHTML={{ __html: formData.richContent }}
                  />
                </div>
              )}
              <div className="flex items-center gap-2 mt-2">
                {formData.category && <Badge variant="outline">{formData.category}</Badge>}
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t">
            <Button 
              variant="outline" 
              onClick={onClose} 
              disabled={isPublishing}
              className="order-2 sm:order-1 transition-all duration-200"
            >
              Cancel
            </Button>
            <Button 
              onClick={handlePublish} 
              disabled={isPublishing || !formData.title.trim()}
              className="order-1 sm:order-2 transition-all duration-200 hover:scale-105 hover:shadow-md"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Globe className="h-4 w-4 mr-2" />
                  Publish to Community
                </>
              )}
            </Button>
          </div>
        </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
