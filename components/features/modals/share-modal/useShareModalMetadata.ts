'use client';

import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { apiClient } from '@/lib/api/client';
import type { UseFormReturn } from 'react-hook-form';
import type { ShareFormData } from '@/lib/validation/schemas';

interface UseShareModalMetadataProps {
  open: boolean;
  shareId: string;
  currentTitle?: string;
  currentVisibility: 'public' | 'private';
  form: UseFormReturn<ShareFormData>;
}

export function useShareModalMetadata({
  open,
  shareId,
  currentTitle,
  currentVisibility,
  form,
}: UseShareModalMetadataProps) {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open || !shareId) {
      form.reset({
        title: currentTitle || '',
        description: '',
        category: '',
        tags: [],
        visibility: currentVisibility,
      });
      return;
    }

    const loadMetadata = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.get<{
          document: {
            title: string;
            description?: string | null;
            category?: string | null;
            tags?: string[] | null;
            visibility: string;
          };
        }>(`/api/json/${shareId}`);

        form.reset({
          title: response.document.title || currentTitle || '',
          description: response.document.description || '',
          category: (response.document.category || '') as any,
          tags: response.document.tags || [],
          visibility: currentVisibility,
        });
      } catch (error) {
        logger.debug({ err: error, shareId }, 'Could not load metadata');
        form.reset({
          title: currentTitle || '',
          description: '',
          category: '',
          tags: [],
          visibility: currentVisibility,
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadMetadata();
  }, [open, shareId, currentTitle, currentVisibility, form]);

  return { isLoading };
}

