'use client';

import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  normalizeTag,
  validateTag,
  getCommonTagsForCategory,
  suggestTags,
} from '@/lib/tags/tag-utils';
import { logger } from '@/lib/logger';
import { apiClient } from '@/lib/api/client';

interface UseTagManagerOptions {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  category?: string;
  maxTags?: number;
}

interface TagValidation {
  normalized?: string;
  errors: string[];
  warnings: string[];
  isValid?: boolean;
}

export function useTagManager({
  selectedTags,
  onTagsChange,
  category = '',
  maxTags = 10,
}: UseTagManagerOptions) {
  const { toast } = useToast();
  const [tagInput, setTagInput] = useState('');
  const [tagValidation, setTagValidation] = useState<TagValidation>({
    errors: [],
    warnings: [],
  });
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingTags, setIsLoadingTags] = useState(false);

  // Fetch existing tags from API for suggestions
  const fetchExistingTags = useCallback(
    async (query: string) => {
      try {
        setIsLoadingTags(true);
        const params = new URLSearchParams();
        if (query) params.set('q', query);
        if (category) params.set('category', category);
        params.set('limit', '10');

        const data = await apiClient.get<{ tags: { tag: string }[] }>(
          `/api/tags?${params}`
        );
        return data.tags.map((t) => t.tag);
      } catch (error) {
        logger.error(
          { err: error, query, category },
          'Failed to fetch tags for suggestions'
        );
        toast({
          title: 'Failed to load tag suggestions',
          description:
            error instanceof Error ? error.message : 'Please try again',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingTags(false);
      }
      return [];
    },
    [category, toast]
  );

  // Validate tag input in real-time with debounced API calls
  useEffect(() => {
    if (!tagInput) {
      setTagValidation({ errors: [], warnings: [] });
      setShowSuggestions(false);
      return;
    }

    const validation = validateTag(tagInput, selectedTags);
    setTagValidation(validation);

    // Debounce API calls to reduce server load during typing
    if (tagInput.length >= 2) {
      const timeoutId = setTimeout(() => {
        fetchExistingTags(tagInput).then((tags) => {
          if (tags.length > 0) {
            setSuggestedTags(tags);
            setShowSuggestions(true);
          } else {
            // Fall back to category-based suggestions
            const categoryTags = getCommonTagsForCategory(category);
            const suggestions = suggestTags(tagInput, categoryTags, 5);
            setSuggestedTags(suggestions);
            setShowSuggestions(suggestions.length > 0);
          }
        });
      }, 300); // 300ms debounce

      return () => clearTimeout(timeoutId);
    }
  }, [tagInput, selectedTags, category, fetchExistingTags]);

  // Add tag from input
  const addTag = useCallback(() => {
    if (!tagInput.trim() || selectedTags.length >= maxTags) return;

    const validation = validateTag(tagInput, selectedTags);

    if (validation.isValid && validation.normalized) {
      // Check if the normalized version already exists
      const normalizedTags = selectedTags.map((t) => normalizeTag(t));
      if (normalizedTags.includes(validation.normalized)) {
        toast({
          title: 'Duplicate tag',
          description: `Tag "${validation.normalized}" already exists`,
          variant: 'destructive',
        });
        return;
      }

      onTagsChange([...selectedTags, validation.normalized]);
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
  }, [tagInput, selectedTags, maxTags, onTagsChange, toast]);

  // Add tag from suggestions
  const addSuggestedTag = useCallback(
    (tag: string) => {
      const normalizedTags = selectedTags.map((t) => normalizeTag(t));
      if (!normalizedTags.includes(tag) && selectedTags.length < maxTags) {
        onTagsChange([...selectedTags, tag]);
      }
      setTagInput('');
      setShowSuggestions(false);
    },
    [selectedTags, maxTags, onTagsChange]
  );

  // Remove tag
  const removeTag = useCallback(
    (tagToRemove: string) => {
      onTagsChange(selectedTags.filter((tag) => tag !== tagToRemove));
    },
    [selectedTags, onTagsChange]
  );

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addTag();
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    },
    [addTag]
  );

  return {
    // State
    tagInput,
    tagValidation,
    suggestedTags,
    showSuggestions,
    isLoadingTags,

    // Actions
    setTagInput,
    setShowSuggestions,
    addTag,
    addSuggestedTag,
    removeTag,
    handleKeyDown,
  };
}
