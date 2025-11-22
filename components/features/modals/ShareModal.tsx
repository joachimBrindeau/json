'use client';

import { useMemo, useState } from 'react';
import { BaseModal } from '@/components/shared/BaseModal';
import { FormInput, FormTextarea, FormSelect } from '@/components/shared/FormFields';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Globe, Lock, Copy, Check, ChevronDown, Share2 } from 'lucide-react';
import { SocialShareButtons } from '@/components/shared/SocialShareButtons';
import { TagManagementSection } from '@/components/features/shared/TagManagementSection';
import { useValidatedForm } from '@/hooks/use-validated-form';
import { shareFormSchema } from '@/lib/validation/schemas';
import { useBackendStore } from '@/lib/store/backend';
import { useClipboard } from '@/hooks/use-clipboard';
import { DOCUMENT_CATEGORIES } from '@/lib/constants/categories';
import { useShareModal } from './share-modal/useShareModal';
import { Controller } from 'react-hook-form';

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
  shareId: shareIdProp,
  currentTitle,
  currentVisibility = 'private',
  onUpdated,
}: ShareModalProps) {
  const currentDocument = useBackendStore((s) => s.currentDocument);
  const shareId = currentDocument?.shareId || shareIdProp || '';

  const form = useValidatedForm(shareFormSchema, {
    defaultValues: {
      title: currentTitle || '',
      description: '',
      category: '',
      tags: [],
      visibility: currentVisibility,
    },
    mode: 'onChange',
  });

  const category = form.watch('category');
  const [isPublic, setIsPublic] = useState(currentVisibility === 'public');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const { isLoading, isSaving, didSave, handleSave } = useShareModal({
    open,
    shareId,
    currentTitle,
    currentVisibility,
    form,
    isPublic,
    setIsPublic,
    onUpdated,
  });

  const { copy, copied } = useClipboard({
    successMessage: 'Copied!',
    successDescription: 'Share link copied to clipboard',
  });

  const shareUrl = useMemo(() => {
    if (!shareId) return '';
    return typeof window !== 'undefined' ? `${window.location.origin}/library/${shareId}` : '';
  }, [shareId]);

  const shareTitle = 'Check out this JSON visualization';
  const shareDescription =
    'Interactive JSON Sea visualization - explore JSON data in a beautiful graph format';

  const actualVisibility = currentDocument?.visibility || (isPublic ? 'public' : 'private');
  const isActuallyPublic = actualVisibility === 'public';

  const getPrimaryActionLabel = () => {
    if (isSaving) {
      return 'Saving...';
    }
    const currentDocVisibility = currentDocument?.visibility === 'public';
    if (isPublic && !currentDocVisibility) {
      return 'Publish';
    }
    if (!isPublic && currentDocVisibility) {
      return 'Make Private';
    }
    return 'Save';
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Share"
      description={isPublic ? 'Public link - visible in library' : 'Private link - only accessible via URL'}
      icon={isActuallyPublic ? <Globe className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
      className="sm:max-w-lg"
      maxHeight="90vh"
      closeOnEscape={!isSaving}
      closeOnOverlayClick={!isSaving}
      primaryAction={{
        label: getPrimaryActionLabel(),
        onClick: () => void handleSave(),
        loading: isSaving,
        disabled: isSaving || isLoading,
        variant: 'default',
        testId: 'share-save-button',
      }}
      secondaryAction={{
        label: 'Cancel',
        onClick: () => onOpenChange(false),
        variant: 'outline',
        testId: 'share-cancel-button',
      }}
    >
      <div className="space-y-6">
        {/* Title */}
        <FormInput
          id="title"
          label="Title"
          required
          placeholder="Give your JSON a name"
          maxLength={200}
          disabled={isLoading}
          error={form.formState.errors.title?.message as string}
          {...form.register('title', {
            onBlur: () => form.trigger('title'),
          })}
        />

        {/* Share Link */}
        {shareId ? (
          <div className="space-y-2">
            <Label htmlFor="link" className="text-sm font-medium">
              Share link
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="link"
                value={shareUrl}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() => copy(shareUrl)}
                disabled={isSaving}
                title="Copy share link"
              >
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            {didSave && (
              <p className="text-xs text-green-600">Saved successfully!</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Share link</Label>
            <p className="text-sm text-muted-foreground">
              Link will be generated after saving
            </p>
          </div>
        )}

        {/* Visibility Toggle */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isPublic ? (
                <Globe className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Lock className="h-4 w-4 text-muted-foreground" />
              )}
              <Label htmlFor="visibility" className="text-sm font-medium">
                {isPublic ? 'Public' : 'Private'}
              </Label>
            </div>
            <Switch
              id="visibility"
              checked={isPublic}
              onCheckedChange={setIsPublic}
              disabled={isLoading}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {isPublic
              ? 'Anyone can discover this in the public library'
              : 'Only people with the link can access this'}
          </p>
        </div>

        {/* Advanced Options (only when public) */}
        {isPublic && (
          <div className="space-y-4 pt-4 border-t">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full justify-between text-muted-foreground"
            >
              <span className="text-sm">Advanced options</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
              />
            </Button>

            {showAdvanced && (
              <div className="space-y-4 pt-2">
                <FormTextarea
                  id="description"
                  label="Description"
                  placeholder="Optional: Describe what this JSON represents..."
                  maxLength={1000}
                  rows={3}
                  disabled={isLoading}
                  error={form.formState.errors.description?.message as string}
                  {...form.register('description', {
                    onBlur: () => form.trigger('description'),
                  })}
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
                      disabled={isLoading}
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
                      disabled={isLoading}
                    />
                  )}
                />
              </div>
            )}
          </div>
        )}

        {/* Social Share */}
        {shareId && shareUrl && (
          <div className="pt-4 border-t">
            <Popover>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="w-full">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share via...
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3">
                <SocialShareButtons
                  url={shareUrl}
                  title={shareTitle}
                  description={shareDescription}
                  showLabel={false}
                />
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>
    </BaseModal>
  );
}
