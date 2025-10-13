import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { indexedDBStorage } from '@/lib/indexed-db';
import type { JsonSeaConfig } from '@/lib/types';
import { logger } from '@/lib/logger';

interface AppState {
  // Current JSON ID (reference to IndexedDB)
  currentJsonId: string;
  // Current JSON content (transient, not persisted)
  currentJson: string;
  // Current share ID
  shareId: string;
  // Whether the content has been modified since last share
  isDirty: boolean;
  // Viewer configuration
  viewerConfig: JsonSeaConfig;

  // Actions
  setCurrentJson: (json: string) => Promise<void>;
  setShareId: (id: string) => void;
  setViewerConfig: (config: JsonSeaConfig) => void;
  updateViewerConfig: (updates: Partial<JsonSeaConfig>) => void;
  shareJson: () => Promise<string>;
  loadFromShareId: (id: string) => Promise<boolean>;
  clearState: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentJsonId: '',
      currentJson: '',
      shareId: '',
      isDirty: false,
      viewerConfig: {
        layout: 'TB',
        theme: 'default',
        edgeType: 'smoothstep',
        animated: false,
        showMiniMap: true,
        showControls: true,
        showBackground: true,
        backgroundVariant: 'dots',
        compact: false,
      },

      setCurrentJson: async (json: string) => {
        const jsonId = `current-${Date.now()}`;

        // Always update state immediately for UI responsiveness
        set({
          currentJson: json,
          isDirty: true,
        });

        try {
          // Async store in IndexedDB for large data support
          await indexedDBStorage.storeLargeJson(jsonId, json);
          set({ currentJsonId: jsonId });

          // Cleanup old data in background
          setTimeout(() => indexedDBStorage.clearOldLargeData(), 100);
        } catch (error) {
          logger.warn({ err: error, jsonId }, 'IndexedDB storage failed, continuing with memory only');
          // App continues to work without IndexedDB
        }
      },

      setShareId: (id: string) => {
        set({ shareId: id });
      },

      setViewerConfig: (config: JsonSeaConfig) => {
        set({ viewerConfig: config });
      },

      updateViewerConfig: (updates: Partial<JsonSeaConfig>) => {
        set((state) => ({
          viewerConfig: { ...state.viewerConfig, ...updates },
        }));
      },

      shareJson: async () => {
        const { currentJson } = get();
        if (!currentJson) {
          throw new Error('No JSON to share');
        }

        // Generate share ID
        const id =
          Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

        // Store in IndexedDB
        await indexedDBStorage.storeShare(id, currentJson);

        set({
          shareId: id,
          isDirty: false,
        });

        return id;
      },

      loadFromShareId: async (id: string) => {
        try {
          const entry = await indexedDBStorage.getShare(id);
          if (entry) {
            // Store in temporary storage
            const jsonId = `loaded-${Date.now()}`;
            await indexedDBStorage.storeLargeJson(jsonId, entry.content);

            set({
              currentJsonId: jsonId,
              currentJson: entry.content,
              shareId: id,
              isDirty: false,
            });

            // Also update the backend store so editor shows the loaded content
            try {
              // Import backend store dynamically to avoid circular dependency
              const { useBackendStore } = await import('./backend');
              const backendStore = useBackendStore.getState();
              backendStore.setCurrentJson(entry.content);

              // Create a temporary document object for title editing
              const tempDocument = {
                id: id,
                shareId: id,
                title: entry.title || 'Untitled',
                content: JSON.parse(entry.content),
                size: entry.content?.length || 0,
                nodeCount: 0,
                maxDepth: 0,
                complexity: 'Low',
                createdAt: entry.createdAt || new Date(),
              };

              // Update backend store with document info
              useBackendStore.setState({
                currentDocument: tempDocument,
                shareId: id,
                isDirty: false,
              });
            } catch (error) {
              logger.warn({ err: error, shareId: id }, 'Could not sync with backend store');
            }

            return true;
          }
          return false;
        } catch (error) {
          logger.error({ err: error, shareId: id }, 'Failed to load share');
          return false;
        }
      },

      clearState: () => {
        set({
          currentJsonId: '',
          currentJson: '',
          shareId: '',
          isDirty: false,
        });
      },
    }),
    {
      name: 'json-share-storage',
      // Only persist minimal data
      partialize: (state) => ({
        currentJsonId: state.currentJsonId,
        shareId: state.shareId,
        viewerConfig: state.viewerConfig,
      }),
      // Custom storage to handle large data
      onRehydrateStorage: () => (state) => {
        // Load large JSON from IndexedDB on rehydration
        if (state?.currentJsonId) {
          indexedDBStorage.getLargeJson(state.currentJsonId).then((json) => {
            if (json) {
              state.currentJson = json;
            }
          });
        }
      },
    }
  )
);
