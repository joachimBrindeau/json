'use client';

import { useState, useEffect } from 'react';
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
import { useFormSubmit } from '@/hooks/use-form-submit';
import { useTagManager } from '@/hooks/use-tag-manager';
import { RichTextEditor } from '@/components/features/editor/rich-text-editor';
import { Globe, Users, Eye, X, AlertCircle, CheckCircle2, Info, Loader2 } from 'lucide-react';
import {
  normalizeTag,
  getCommonTagsForCategory,
} from '@/lib/tags/tag-utils';
import { logger } from '@/lib/logger';
import { apiClient } from '@/lib/api/client';
import { ErrorBoundary } from '@/components/shared/error-boundary';
import { DOCUMENT_CATEGORIES } from '@/lib/constants/categories';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareId: string;
  currentTitle?: string;
  onPublished?: () => void;
}

export function PublishModal({
  isOpen,
  onClose,
  shareId,
  currentTitle,
  onPublished,
}: PublishModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: currentTitle || '',
    description: '',
    richContent: '',
    category: '',
    tags: [] as string[],
  });

  // Tag management hook
  const tagManager = useTagManager({
    selectedTags: formData.tags,
    onTagsChange: (tags) => setFormData((prev) => ({ ...prev, tags })),
    category: formData.category,
    maxTags: 10,
  });

  // Load existing data when modal opens for editing
  useEffect(() => {
    if (isOpen && shareId) {
      setIsLoading(true);
      apiClient.get<{ document: { title?: string; description?: string; richContent?: string; category?: string; tags?: string[] } }>(`/api/json/${shareId}`)
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
          logger.error({ err: error, shareId }, 'Failed to load document data for publish modal');
          toast({
            title: 'Failed to load document data',
            description: error instanceof Error ? error.message : 'Using default values',
            variant: 'destructive'
          });
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, shareId, currentTitle]);

  const { submit: handlePublish, isSubmitting: isPublishing } = useFormSubmit(
    async () => {
      if (!formData.title.trim()) {
        throw new Error('Please provide a title for your JSON');
      }

      await apiClient.post(`/api/json/${shareId}/publish`, formData);
    },
    {
      onSuccess: () => {
        toast({
          title: 'Published successfully!',
          description: `Your JSON is now discoverable in the public library`,
        });
        onPublished?.();
        onClose();
      },
      onError: (error) => {
        logger.error({ err: error, shareId, formData }, 'Failed to publish JSON to library');
        toast({
          title: 'Failed to publish',
          description: 'Please try again later',
          variant: 'destructive',
        });
      },
    }
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
                  {DOCUMENT_CATEGORIES.map((category) => (
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
                        value={tagManager.tagInput}
                        onChange={(e) => tagManager.setTagInput(e.target.value)}
                        onKeyDown={tagManager.handleKeyDown}
                        onFocus={() => tagManager.setShowSuggestions(tagManager.suggestedTags.length > 0)}
                        placeholder="Add tags... (press Enter)"
                        maxLength={30}
                        className={`pr-8 ${
                          tagManager.tagValidation.errors.length > 0
                            ? 'border-red-500 focus:ring-red-500'
                            : tagManager.tagValidation.warnings.length > 0
                              ? 'border-yellow-500 focus:ring-yellow-500'
                              : ''
                        }`}
                      />
                      {tagManager.tagInput && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                          {tagManager.tagValidation.errors.length > 0 ? (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          ) : tagManager.tagValidation.warnings.length > 0 ? (
                            <Info className="h-4 w-4 text-yellow-500" />
                          ) : tagManager.tagValidation.normalized ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : null}
                        </div>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={tagManager.addTag}
                      disabled={
                        !tagManager.tagInput.trim() ||
                        formData.tags.length >= 10 ||
                        tagManager.tagValidation.errors.length > 0
                      }
                    >
                      Add
                    </Button>
                  </div>

                  {/* Real-time validation feedback */}
                  {tagManager.tagInput &&
                    tagManager.tagValidation.normalized &&
                    tagManager.tagInput !== tagManager.tagValidation.normalized && (
                      <div className="text-xs text-blue-600 mt-1">
                        Will be saved as:{' '}
                        <span className="font-mono">{tagManager.tagValidation.normalized}</span>
                      </div>
                    )}
                  {tagManager.tagValidation.errors.length > 0 && (
                    <div className="text-xs text-red-500 mt-1">{tagManager.tagValidation.errors[0]}</div>
                  )}
                  {tagManager.tagValidation.warnings.length > 0 && tagManager.tagValidation.errors.length === 0 && (
                    <div className="text-xs text-yellow-600 mt-1">{tagManager.tagValidation.warnings[0]}</div>
                  )}

                  {/* Tag suggestions dropdown */}
                  {tagManager.showSuggestions && tagManager.suggestedTags.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
                      <div className="py-1">
                        <div className="px-3 py-1 text-xs text-gray-500">Suggested tags:</div>
                        {tagManager.suggestedTags.map((tag) => (
                          <button
                            key={tag}
                            onClick={() => tagManager.addSuggestedTag(tag)}
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
                            onClick={() => tagManager.addSuggestedTag(tag)}
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
                          onClick={() => tagManager.removeTag(tag)}
                          className="ml-1 hover:bg-gray-300 rounded-full p-0.5 cursor-pointer"
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              tagManager.removeTag(tag);
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
              onClick={() => handlePublish(undefined)}
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
        </ErrorBoundary>
        )}
      </DialogContent>
    </Dialog>
  );
}
