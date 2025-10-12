/* eslint-disable react-hooks/rules-of-hooks */
import { test as base } from '@playwright/test';
import { AuthHelper } from './auth-helper';
import { APIHelper } from './api-helper';
import { ScreenshotHelper } from './screenshot-helper';
import { DataGenerator } from './data-generator';
import { ShareHelper } from './share-helper';
import { PublishHelper } from './publish-helper';
import { LibraryActionHelper } from './library-action-helper';
import { ProfileHelper } from './profile-helper';
// New comprehensive test utilities
import { TestFactories } from './test-factories';
import { CommonAssertions } from './common-assertions';
import { SetupHelpers } from './setup-helpers';
import { PageHelpers } from './page-helpers';
import { JsonViewerPage } from '../page-objects/json-viewer-page';
import { LibraryPage } from '../page-objects/library-page';
import { MainLayoutPage } from '../page-objects/main-layout-page';

// Extend base test with custom fixtures
export const test = base.extend<{
  authHelper: AuthHelper;
  apiHelper: APIHelper;
  screenshotHelper: ScreenshotHelper;
  dataGenerator: DataGenerator;
  shareHelper: ShareHelper;
  publishHelper: PublishHelper;
  libraryActionHelper: LibraryActionHelper;
  profileHelper: ProfileHelper;
  // New utility fixtures
  testFactories: typeof TestFactories;
  commonAssertions: CommonAssertions;
  setupHelpers: SetupHelpers;
  pageHelpers: PageHelpers;
}>({
  authHelper: async ({ page, context }, use) => {
    const authHelper = new AuthHelper(page, context);
    await use(authHelper);
  },

  apiHelper: async ({ request }, use) => {
    const apiHelper = new APIHelper(request);
    await use(apiHelper);
  },

  screenshotHelper: async ({ page }, use) => {
    const screenshotHelper = new ScreenshotHelper(page);
    await use(screenshotHelper);
  },

  dataGenerator: async ({}, use) => {
    const dataGenerator = new DataGenerator();
    await use(dataGenerator);
  },

  shareHelper: async ({ page }, use) => {
    const viewerPage = new JsonViewerPage(page);
    const libraryPage = new LibraryPage(page);
    const shareHelper = new ShareHelper(page, viewerPage, libraryPage);
    await use(shareHelper);
  },

  publishHelper: async ({ page }, use) => {
    const viewerPage = new JsonViewerPage(page);
    const libraryPage = new LibraryPage(page);
    const layoutPage = new MainLayoutPage(page);
    const publishHelper = new PublishHelper(page, viewerPage, libraryPage, layoutPage);
    await use(publishHelper);
  },

  libraryActionHelper: async ({ page }, use) => {
    const viewerPage = new JsonViewerPage(page);
    const libraryPage = new LibraryPage(page);
    const libraryActionHelper = new LibraryActionHelper(page, viewerPage, libraryPage);
    await use(libraryActionHelper);
  },

  profileHelper: async ({ page, context, request }, use) => {
    const layoutPage = new MainLayoutPage(page);
    const authHelper = new AuthHelper(page, context);
    const apiHelper = new APIHelper(request);
    const profileHelper = new ProfileHelper(page, layoutPage, authHelper, apiHelper);
    await use(profileHelper);
  },

  // New comprehensive utility fixtures
  testFactories: async ({}, use) => {
    await use(TestFactories);
  },

  commonAssertions: async ({ page }, use) => {
    const commonAssertions = new CommonAssertions(page);
    await use(commonAssertions);
  },

  setupHelpers: async ({ page, context, authHelper, apiHelper }, use) => {
    const setupHelpers = new SetupHelpers(page, context, authHelper, apiHelper);
    await use(setupHelpers);
  },

  pageHelpers: async ({ page }, use) => {
    const pageHelpers = new PageHelpers(page);
    await use(pageHelpers);
  },
});

export { expect } from '@playwright/test';
