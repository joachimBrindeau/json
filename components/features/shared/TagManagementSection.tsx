'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { useTagManager } from '@/hooks/use-tag-manager';
import { normalizeTag, getCommonTagsForCategory } from '@/lib/tags/tag-utils';

interface TagManagementSectionProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  category?: string;
  maxTags?: number;
  disabled?: boolean;
  label?: string;
  showCommonTags?: boolean;
}

/**
 * Reusable tag management section component
 *
 * Handles tag input, validation, suggestions, and display of selected tags.
 * Uses the useTagManager hook internally for all tag logic.
 *
 * @example
 * ```tsx
 * <TagManagementSection
 *   selectedTags={formData.tags}
 *   onTagsChange={(tags) => setFormData(prev => ({ ...prev, tags }))}
 *   category={formData.category}
 *   maxTags={10}
 * />
 * ```
 */
export function TagManagementSection({
  selectedTags,
  onTagsChange,
  category,
  maxTags = 10,
  disabled = false,
  label = 'Tags',
  showCommonTags = true,
}: TagManagementSectionProps) {
  const tagManager = useTagManager({
    selectedTags,
    onTagsChange,
    category,
    maxTags,
  });

  return (
    <div>
      <Label htmlFor="tags" className="text-sm font-medium">
        {label} ({selectedTags.length}/{maxTags})
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
                disabled={disabled}
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
                disabled ||
                !tagManager.tagInput.trim() ||
                selectedTags.length >= maxTags ||
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
          {tagManager.tagValidation.warnings.length > 0 &&
            tagManager.tagValidation.errors.length === 0 && (
              <div className="text-xs text-yellow-600 mt-1">
                {tagManager.tagValidation.warnings[0]}
              </div>
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
        {showCommonTags && category && selectedTags.length < maxTags && (
          <div className="space-y-1">
            <div className="text-xs text-gray-500">Popular tags for {category}:</div>
            <div className="flex flex-wrap gap-1">
              {getCommonTagsForCategory(category)
                .filter((tag) => !selectedTags.map((t) => normalizeTag(t)).includes(tag))
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
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedTags.map((tag) => (
              <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                {tag}
                <div
                  onClick={() => !disabled && tagManager.removeTag(tag)}
                  className={`ml-1 rounded-full p-0.5 ${
                    disabled ? 'opacity-50' : 'hover:bg-gray-300 cursor-pointer'
                  }`}
                  role="button"
                  tabIndex={disabled ? -1 : 0}
                  onKeyDown={(e) => {
                    if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
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
  );
}
