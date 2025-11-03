import { describe, it, expect } from 'vitest';
import { createCommonViewerSetters } from '@/lib/store/shared-setters';
import type { JsonSeaConfig } from '@/lib/types';

type State = {
  shareId: string;
  viewerConfig: JsonSeaConfig;
};

describe('createCommonViewerSetters', () => {
  const initialConfig: JsonSeaConfig = {
    theme: 'light',
    fontSize: 14,
    wrap: true,
    showLineNumbers: true,
    renderMode: 'tree',
  } as any; // keep minimal for test

  function makeStore(initial?: Partial<State>) {
    const state: State = {
      shareId: initial?.shareId ?? '',
      viewerConfig: initial?.viewerConfig ?? initialConfig,
    };
    const set = (updater: Partial<State> | ((s: State) => Partial<State>)) => {
      const patch = typeof updater === 'function' ? updater(state) : updater;
      Object.assign(state, patch);
    };
    const get = () => state;
    return { state, api: createCommonViewerSetters<State>(set, get) };
  }

  it('setShareId updates shareId', () => {
    const { state, api } = makeStore();
    api.setShareId('abc');
    expect(state.shareId).toBe('abc');
  });

  it('setViewerConfig replaces viewerConfig', () => {
    const { state, api } = makeStore();
    const next: JsonSeaConfig = { ...initialConfig, theme: 'dark' } as any;
    api.setViewerConfig(next);
    expect(state.viewerConfig).toEqual(next);
  });

  it('updateViewerConfig merges fields', () => {
    const { state, api } = makeStore({ viewerConfig: { ...initialConfig, fontSize: 12 } as any });
    api.updateViewerConfig({ fontSize: 16, wrap: false });
    expect(state.viewerConfig.fontSize).toBe(16);
    expect(state.viewerConfig.wrap).toBe(false);
    // untouched
    expect(state.viewerConfig.theme).toBe('light');
  });
});
