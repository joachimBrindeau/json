import base from './playwright.config';
import type { PlaywrightTestConfig } from '@playwright/test';

// Derive a config for local dev runs that do NOT start a production webServer.
// We keep everything else identical but drop the webServer command so we can
// run against an already running dev server at PLAYWRIGHT_BASE_URL or :3456.

const devConfig: PlaywrightTestConfig = {
  ...base,
  webServer: undefined as any,
  use: {
    ...base.use,
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3456',
  },
};

export default devConfig;
