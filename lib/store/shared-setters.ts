import type { JsonSeaConfig } from '@/lib/types';

// Minimal typing for Zustand's set/get signatures used here
// We deliberately keep these generic to be reused across backend and client stores
export type SetFn<T> = (partial: Partial<T> | ((state: T) => Partial<T>)) => void;
export type GetFn<T> = () => T;

export interface ViewerConfigState {
  viewerConfig: JsonSeaConfig;
  shareId: string;
}

export function createCommonViewerSetters<T extends ViewerConfigState>(
  set: SetFn<T>,
  get: GetFn<T>
) {
  return {
    setShareId: (id: string) => {
      set({ shareId: id } as Partial<T>);
    },

    setViewerConfig: (config: JsonSeaConfig) => {
      set({ viewerConfig: config } as Partial<T>);
    },

    updateViewerConfig: (updates: Partial<JsonSeaConfig>) => {
      set(
        (state) =>
          ({
            viewerConfig: { ...state.viewerConfig, ...updates },
          }) as Partial<T>
      );
    },
  } as const;
}
