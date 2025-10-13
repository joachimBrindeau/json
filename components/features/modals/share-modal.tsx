'use client';

import { useCallback, useMemo, useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Switch } from '@/components/ui/switch';
import { Copy, Check, Globe, Lock, Users, Eye, X, AlertCircle, CheckCircle2, Info, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTagManager } from '@/hooks/use-tag-manager';
import {
  TwitterShareButton,
  FacebookShareButton,
  LinkedinShareButton,
  WhatsappShareButton,
  EmailShareButton,
  TelegramShareButton,
  TwitterIcon,
  FacebookIcon,
  LinkedinIcon,
  WhatsappIcon,
  EmailIcon,
  TelegramIcon,
} from 'react-share';
import {
  normalizeTag,
  getCommonTagsForCategory,
} from '@/lib/tags/tag-utils';
import { DOCUMENT_CATEGORIES } from '@/lib/constants/categories';
import { logger } from '@/lib/logger';
import { apiClient } from '@/lib/api/client';

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareId: string;
  currentTitle?: string;
  currentVisibility?: 'public' | 'private';
  onUpdated?: (title?: string) => void;
}

export function ShareModal({
  open, 
  onOpenChange, 
  shareId, 
  currentTitle,
  currentVisibility = 'private',
  onUpdated 
}: ShareModalProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [isPublic, setIsPublic] = useState(currentVisibility === 'public');
  const [formData, setFormData] = useState({
    title: currentTitle || '',
    description: '',
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

  // Update form when modal opens with current data
  useEffect(() => {
    if (open) {
      setIsPublic(currentVisibility === 'public');
      setFormData({
        title: currentTitle || '',
        description: '',
        category: '',
        tags: [],
      });
      // Reset states when opening
      setIsSaving(false);
      setIsUpdating(false);
      // TODO: Load existing metadata if document is already published
    }
  }, [open, currentTitle, currentVisibility]);

  // Stop saving state when shareId becomes available
  useEffect(() => {
    if (shareId && isSaving) {
      setIsSaving(false);
    }
  }, [shareId, isSaving]);

  const shareUrl = useMemo(() => {
    if (!shareId) return 'Creating share link...';
    return typeof window !== 'undefined' ? `${window.location.origin}/library/${shareId}` : '';
  }, [shareId]);

  const shareTitle = 'Check out this JSON visualization';
  const shareDescription = 'Interactive JSON Sea visualization - explore JSON data in a beautiful graph format';

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: 'Copied!',
        description: 'Share link copied to clipboard',
      });
    } catch (err) {
      logger.error({ err, shareUrl }, 'Failed to copy share link to clipboard');
      toast({
        title: 'Error',
        description: 'Failed to copy link',
        variant: 'destructive',
      });
    }
  }, [shareUrl, toast]);


  const handleSave = useCallback(async () => {
    if (isPublic && !formData.title.trim()) {
      toast({
        title: 'Title required',
        description: 'Public JSONs require a title',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsUpdating(true);
      
      // If we don't have a shareId yet, we need to save/create the JSON first
      if (!shareId) {
        // For new documents without a shareId, we need to save with title first
        if (!formData.title.trim()) {
          toast({
            title: 'Title required',
            description: 'Please enter a title to save your JSON',
            variant: 'destructive',
          });
          return;
        }

        setIsSaving(true);
        toast({
          title: 'Saving JSON with title',
          description: 'Creating your document and share link...',
        });
        
        // Signal the parent to save the JSON with the provided title
        // Don't close the modal - let the parent update the shareId and refresh this modal
        onUpdated?.(formData.title.trim());
        return;
      }
      
      if (isPublic) {
        // Publish to public library
        await apiClient.post(`/api/json/${shareId}/publish`, formData);

        toast({
          title: 'Published successfully!',
          description: 'Your JSON is now discoverable in the public library',
        });
      } else {
        // Make private
        await apiClient.delete(`/api/json/${shareId}/publish`);

        toast({
          title: 'Made private',
          description: 'Your JSON is now private but still shareable via link',
        });
      }

      onUpdated?.();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Failed to update',
        description: 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  }, [isPublic, formData, shareId, toast, onUpdated, onOpenChange]);

  // Allow modal to open even without shareId - it can handle creating one

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isPublic ? (
              <Globe className="h-5 w-5 text-blue-500" />
            ) : (
              <Lock className="h-4 w-4 text-muted-foreground" />
            )}
            Share your JSON
          </DialogTitle>
          <DialogDescription>
            {isPublic 
              ? 'Make your JSON discoverable in the public library' 
              : 'Share a private link to your JSON'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Title - Always visible */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., E-commerce Product API Response"
              maxLength={200}
              className="font-medium"
            />
          </div>

          {/* Public/Private Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                {isPublic ? (
                  <Globe className="h-4 w-4 text-blue-500" />
                ) : (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="font-medium">
                  {isPublic ? 'Public' : 'Private'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {isPublic 
                  ? 'Anyone can discover this JSON in the public library'
                  : 'Only people with the link can access this JSON'}
              </p>
            </div>
            <Switch
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>

          {/* Share URL */}
          <div className="space-y-2">
            <Label htmlFor="link">Share link</Label>
            <div className="flex items-center space-x-2">
              <Input 
                id="link" 
                value={isSaving ? 'Creating your share link...' : shareUrl} 
                readOnly 
                className="font-mono text-sm" 
                disabled={isSaving}
              />
              <Button 
                type="button" 
                size="icon" 
                variant="outline" 
                onClick={copyToClipboard}
                disabled={isSaving || !shareId}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            {isSaving && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving your JSON and generating share link...</span>
              </div>
            )}
            {shareId && !isSaving && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span>Your JSON is saved and ready to share!</span>
              </div>
            )}
          </div>

          {/* Public Library Metadata - only show when public */}
          {isPublic && (
            <div className="space-y-4 p-4 border rounded-lg bg-blue-50/50">
              <div className="flex items-center gap-2 text-blue-900">
                <Users className="h-4 w-4" />
                <span className="font-medium">Set optional fields</span>
              </div>
{/* Description */}
              <div>
                <Label htmlFor="description" className="text-sm font-medium">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional: Describe what this JSON represents..."
                  maxLength={1000}
                  rows={3}
                  className="mt-1"
                />
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

                    {/* Tag validation feedback */}
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

              {/* Preview */}
              <div className="bg-white border rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-700 mb-2">
                  <Eye className="h-4 w-4" />
                  <span className="font-medium text-sm">Library Preview</span>
                </div>
                <div className="text-sm">
                  <div className="font-medium text-gray-900">{formData.title || 'Untitled JSON'}</div>
                  {formData.description && (
                    <div className="text-gray-600 mt-1 text-xs">{formData.description}</div>
                  )}
                  <div className="flex items-center gap-1 mt-2">
                    {formData.category && <Badge variant="outline" className="text-xs">{formData.category}</Badge>}
                    {formData.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                    {formData.tags.length > 3 && (
                      <span className="text-xs text-muted-foreground">+{formData.tags.length - 3} more</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Social Share Buttons - always visible */}
          <div className="space-y-2">
            <Label>Share on social media</Label>
            <div className="flex flex-wrap gap-2">
              <TwitterShareButton
                url={shareUrl}
                title={shareTitle}
                className="hover:opacity-80 transition-opacity"
              >
                <TwitterIcon size={32} round />
              </TwitterShareButton>

              <FacebookShareButton url={shareUrl} className="hover:opacity-80 transition-opacity">
                <FacebookIcon size={32} round />
              </FacebookShareButton>

              <LinkedinShareButton
                url={shareUrl}
                title={shareTitle}
                summary={shareDescription}
                className="hover:opacity-80 transition-opacity"
              >
                <LinkedinIcon size={32} round />
              </LinkedinShareButton>

              <WhatsappShareButton
                url={shareUrl}
                title={shareTitle}
                className="hover:opacity-80 transition-opacity"
              >
                <WhatsappIcon size={32} round />
              </WhatsappShareButton>

              <TelegramShareButton
                url={shareUrl}
                title={shareTitle}
                className="hover:opacity-80 transition-opacity"
              >
                <TelegramIcon size={32} round />
              </TelegramShareButton>

              <EmailShareButton
                url={shareUrl}
                subject={shareTitle}
                body={`${shareDescription}\n\nView it here: ${shareUrl}`}
                className="hover:opacity-80 transition-opacity"
              >
                <EmailIcon size={32} round />
              </EmailShareButton>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              disabled={isUpdating}
              className="order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isUpdating || isSaving || !formData.title.trim()}
              className="order-1 sm:order-2"
            >
              {(isUpdating || isSaving) ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isSaving ? 'Saving...' : 'Updating...'}
                </>
              ) : !shareId ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Save & Generate Link
                </>
              ) : isPublic ? (
                <>
                  <Globe className="h-4 w-4 mr-2" />
                  Publish & Share
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Make Private & Share
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}