import { expect, Page, Locator } from '@playwright/test';

/**
 * Common assertion functions to eliminate duplication across tests
 * Provides standardized verification patterns for the JSON Share application
 */
export class CommonAssertions {
  constructor(private page: Page) {}

  /**
   * Assert that JSON is visible and properly displayed in the viewer
   */
  async assertJsonVisible(
    options: {
      expectedNodeCount?: number;
      expectedObjectCount?: number;
      expectedArrayCount?: number;
      checkForErrors?: boolean;
      viewMode?: 'tree' | 'raw' | 'formatted';
    } = {}
  ) {
    const {
      expectedNodeCount,
      expectedObjectCount,
      expectedArrayCount,
      checkForErrors = true,
      viewMode = 'tree',
    } = options;

    // Wait for JSON to be processed and displayed
    await this.page.waitForSelector('[data-testid="json-viewer"], .json-viewer, .monaco-editor', {
      timeout: 10000,
    });

    // Check for processing completion
    await this.page.waitForFunction(
      () => {
        return !document.querySelector('[data-testid="loading"], .loading, .processing');
      },
      { timeout: 15000 }
    );

    // Verify no errors if requested
    if (checkForErrors) {
      const errorElements = this.page.locator('[data-testid="json-error"], .error, .json-error');
      await expect(errorElements).toHaveCount(0);
    }

    // Check specific view mode elements
    switch (viewMode) {
      case 'tree':
        const treeNodes = this.page.locator(
          '[data-testid="tree-node"], .tree-node, .json-tree-node'
        );
        await expect(treeNodes.first()).toBeVisible();

        if (expectedNodeCount) {
          await expect(treeNodes).toHaveCount(expectedNodeCount);
        }
        break;

      case 'raw':
        const rawEditor = this.page.locator('.monaco-editor, [data-testid="raw-editor"]');
        await expect(rawEditor).toBeVisible();
        break;

      case 'formatted':
        const formattedContent = this.page.locator(
          '[data-testid="formatted-json"], .formatted-json'
        );
        await expect(formattedContent).toBeVisible();
        break;
    }

    // Verify node counts if specified
    if (expectedObjectCount || expectedArrayCount) {
      const statsElement = this.page.locator('[data-testid="json-stats"], .json-stats');
      if ((await statsElement.count()) > 0) {
        const statsText = await statsElement.textContent();

        if (expectedObjectCount && statsText) {
          expect(statsText).toContain(`${expectedObjectCount} object`);
        }

        if (expectedArrayCount && statsText) {
          expect(statsText).toContain(`${expectedArrayCount} array`);
        }
      }
    }

    console.log('✅ JSON visibility assertion passed');
  }

  /**
   * Assert that user is properly authenticated
   */
  async assertAuthenticated(
    options: {
      expectedEmail?: string;
      expectedName?: string;
      expectedRole?: string;
      checkUserMenu?: boolean;
    } = {}
  ) {
    const { expectedEmail, expectedName, expectedRole, checkUserMenu = true } = options;

    // Check for authenticated state indicators
    await this.page.waitForSelector(
      '[data-testid="user-menu"], .user-menu, div[class*="border-t p-4"] button:not(:has-text("Sign in"))',
      { timeout: 10000 }
    );

    // Verify sign-in button is NOT present
    const signInButton = this.page.locator(
      'button:has-text("Sign in"), button:has-text("Sign In")'
    );
    await expect(signInButton).toHaveCount(0);

    if (checkUserMenu) {
      // Click user menu to verify user info
      const userMenuButton = this.page
        .locator(
          '[data-testid="user-menu"] button, .user-menu button, div[class*="border-t p-4"] button:not(:has-text("Sign in"))'
        )
        .first();

      await userMenuButton.click();

      // Wait for dropdown menu to be visible
      const dropdownMenu = this.page.locator('[role="menu"]');
      await expect(dropdownMenu).toBeVisible({ timeout: 5000 });

      // Check for sign out option
      const signOutButton = this.page.locator(
        '[role="menuitem"]:has-text("Sign out"), button:has-text("Sign out")'
      );
      await expect(signOutButton).toBeVisible();

      // Verify user details if provided
      if (expectedEmail) {
        const emailElement = this.page.locator(`text="${expectedEmail}"`);
        await expect(emailElement).toBeVisible();
      }

      if (expectedName) {
        const nameElement = this.page.locator(`text="${expectedName}"`);
        await expect(nameElement).toBeVisible();
      }

      // Close the dropdown
      await this.page.keyboard.press('Escape');

      // Wait for dropdown to close
      await expect(dropdownMenu).not.toBeVisible({ timeout: 2000 });
    }

    console.log('✅ Authentication assertion passed');
  }

  /**
   * Assert that user is in anonymous state
   */
  async assertAnonymous() {
    // Check for sign-in button presence
    const signInButton = this.page.locator(
      'button:has-text("Sign in"), button:has-text("Sign In")'
    );
    await expect(signInButton).toBeVisible();

    // Verify no user menu is present
    const userMenu = this.page.locator('[data-testid="user-menu"], .user-menu');
    await expect(userMenu).toHaveCount(0);

    // Check for anonymous user indicators
    const anonymousIndicators = this.page.locator(
      '[data-testid="anonymous-banner"], .anonymous-notice, .guest-mode'
    );

    if ((await anonymousIndicators.count()) > 0) {
      await expect(anonymousIndicators.first()).toBeVisible();
    }

    console.log('✅ Anonymous state assertion passed');
  }

  /**
   * Assert that a document has been saved successfully
   */
  async assertDocumentSaved(
    options: {
      expectedTitle?: string;
      expectedId?: string;
      checkInLibrary?: boolean;
      expectedUrl?: string;
    } = {}
  ) {
    const { expectedTitle, expectedId, checkInLibrary = false, expectedUrl } = options;

    // Wait for save confirmation
    const saveIndicators = [
      '[data-testid="save-success"]',
      '.save-success',
      'text="Saved successfully"',
      'text="Document saved"',
      '.success-message:has-text("save")',
    ];

    let saveConfirmed = false;
    for (const indicator of saveIndicators) {
      const element = this.page.locator(indicator);
      if ((await element.count()) > 0) {
        await expect(element).toBeVisible();
        saveConfirmed = true;
        break;
      }
    }

    // Check URL if document ID is expected
    if (expectedId || expectedUrl) {
      const currentUrl = this.page.url();
      if (expectedId) {
        expect(currentUrl).toContain(expectedId);
      }
      if (expectedUrl) {
        expect(currentUrl).toContain(expectedUrl);
      }
    }

    // Verify title if provided
    if (expectedTitle) {
      const titleElements = [
        `[data-testid="document-title"]:has-text("${expectedTitle}")`,
        `.document-title:has-text("${expectedTitle}")`,
        `h1:has-text("${expectedTitle}")`,
        `title:has-text("${expectedTitle}")`,
      ];

      let titleFound = false;
      for (const titleSelector of titleElements) {
        const titleElement = this.page.locator(titleSelector);
        if ((await titleElement.count()) > 0) {
          await expect(titleElement).toBeVisible();
          titleFound = true;
          break;
        }
      }

      if (!titleFound) {
        // Check page title as fallback
        const pageTitle = await this.page.title();
        expect(pageTitle).toContain(expectedTitle);
      }
    }

    // Check library if requested
    if (checkInLibrary && expectedTitle) {
      await this.page.goto('/saved');
      await this.page.waitForLoadState('networkidle');

      const libraryItem = this.page.locator(`text="${expectedTitle}"`);
      await expect(libraryItem).toBeVisible();

      await this.page.goBack();
    }

    console.log('✅ Document save assertion passed');
  }

  /**
   * Assert that a share link works properly
   */
  async assertShareLinkWorks(
    shareUrl: string,
    options: {
      checkAnonymousAccess?: boolean;
      expectedTitle?: string;
      expectedContent?: string;
      checkEmbedding?: boolean;
    } = {}
  ) {
    const {
      checkAnonymousAccess = true,
      expectedTitle,
      expectedContent,
      checkEmbedding = false,
    } = options;

    // Open share link in new tab/context if checking anonymous access
    if (checkAnonymousAccess) {
      const newContext = await this.page.context().browser()?.newContext();
      if (!newContext) throw new Error('Could not create new context for anonymous test');

      const newPage = await newContext.newPage();

      try {
        // Navigate to share URL
        await newPage.goto(shareUrl);
        await newPage.waitForLoadState('networkidle');

        // Verify page loads without requiring authentication
        await this.assertAnonymousStateOnPage(newPage);

        // Check for expected content
        if (expectedTitle) {
          const titleElement = newPage.locator(`text="${expectedTitle}"`);
          await expect(titleElement).toBeVisible();
        }

        if (expectedContent) {
          const contentElement = newPage.locator(`text="${expectedContent}"`);
          await expect(contentElement).toBeVisible();
        }

        // Verify JSON is visible
        await this.assertJsonVisibleOnPage(newPage);

        // Test embedding if requested
        if (checkEmbedding) {
          const embedUrl = shareUrl.replace('/library/', '/embed/');
          await newPage.goto(embedUrl);
          await newPage.waitForLoadState('networkidle');
          await this.assertJsonVisibleOnPage(newPage);
        }
      } finally {
        await newContext.close();
      }
    } else {
      // Test in current context
      const currentUrl = this.page.url();

      await this.page.goto(shareUrl);
      await this.page.waitForLoadState('networkidle');

      if (expectedTitle || expectedContent) {
        if (expectedTitle) {
          const titleElement = this.page.locator(`text="${expectedTitle}"`);
          await expect(titleElement).toBeVisible();
        }

        if (expectedContent) {
          const contentElement = this.page.locator(`text="${expectedContent}"`);
          await expect(contentElement).toBeVisible();
        }
      }

      await this.assertJsonVisible();

      // Return to original URL
      await this.page.goto(currentUrl);
    }

    console.log('✅ Share link assertion passed');
  }

  /**
   * Assert that library contains expected documents
   */
  async assertLibraryContains(
    documents: Array<{
      title: string;
      isPublic?: boolean;
      tags?: string[];
      category?: string;
    }>,
    options: {
      exactMatch?: boolean;
      checkOrder?: boolean;
      libraryType?: 'user' | 'public';
    } = {}
  ) {
    const { exactMatch = false, checkOrder = false, libraryType = 'user' } = options;

    // Navigate to appropriate library
    const libraryUrl = libraryType === 'public' ? '/saved' : '/saved';
    await this.page.goto(libraryUrl);
    await this.page.waitForLoadState('networkidle');

    // Wait for library to load
    await this.page.waitForSelector(
      '[data-testid="library-items"], .library-items, .document-list',
      { timeout: 10000 }
    );

    // Check each expected document
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      const documentLocator = this.page.locator(`text="${doc.title}"`);
      await expect(documentLocator).toBeVisible();

      // Check order if requested
      if (checkOrder) {
        const allTitles = await this.page
          .locator('[data-testid="document-title"], .document-title, .library-item-title')
          .allTextContents();

        expect(allTitles[i]).toBe(doc.title);
      }

      // Check tags if provided
      if (doc.tags) {
        for (const tag of doc.tags) {
          const tagElement = this.page.locator(`[data-tag="${tag}"], .tag:has-text("${tag}")`);
          if ((await tagElement.count()) > 0) {
            await expect(tagElement).toBeVisible();
          }
        }
      }

      // Check public/private status
      if (doc.isPublic !== undefined) {
        const visibilityIndicator = doc.isPublic
          ? '[data-testid="public-indicator"], .public-badge'
          : '[data-testid="private-indicator"], .private-badge';

        const indicator = this.page.locator(visibilityIndicator);
        if ((await indicator.count()) > 0) {
          await expect(indicator).toBeVisible();
        }
      }
    }

    // Check exact match if requested
    if (exactMatch) {
      const allDocuments = await this.page
        .locator('[data-testid="document-title"], .document-title, .library-item-title')
        .count();

      expect(allDocuments).toBe(documents.length);
    }

    console.log('✅ Library content assertion passed');
  }

  /**
   * Assert that search/filter functionality works
   */
  async assertSearchWorks(
    searchTerm: string,
    expectedResults: string[],
    options: {
      searchType?: 'content' | 'title' | 'tags';
      exactMatch?: boolean;
    } = {}
  ) {
    const { searchType = 'content', exactMatch = false } = options;

    // Find and use search input
    const searchInput = this.page
      .locator('[data-testid="search-input"], input[placeholder*="Search"], input[type="search"]')
      .first();

    await searchInput.fill(searchTerm);
    await this.page.keyboard.press('Enter');

    // Wait for search results to load
    await this.page.waitForLoadState('networkidle', { timeout: 5000 });

    // Verify expected results appear
    for (const result of expectedResults) {
      const resultElement = this.page.locator(`text="${result}"`);
      await expect(resultElement).toBeVisible();
    }

    // Check exact match if requested
    if (exactMatch) {
      const allResults = await this.page
        .locator('[data-testid="search-result"], .search-result, .library-item')
        .count();

      expect(allResults).toBe(expectedResults.length);
    }

    console.log('✅ Search functionality assertion passed');
  }

  /**
   * Assert modal or dialog behavior
   */
  async assertModalOpen(
    modalType: string,
    options: {
      expectedTitle?: string;
      expectedContent?: string;
      checkCloseButton?: boolean;
    } = {}
  ) {
    const { expectedTitle, expectedContent, checkCloseButton = true } = options;

    // Wait for modal to appear
    const modal = this.page.locator(`[data-testid="${modalType}-modal"], [role="dialog"], .modal`);

    await expect(modal).toBeVisible();

    // Check modal content
    if (expectedTitle) {
      const modalTitle = modal.locator('h1, h2, h3, .modal-title, [data-testid="modal-title"]');
      await expect(modalTitle).toContainText(expectedTitle);
    }

    if (expectedContent) {
      await expect(modal).toContainText(expectedContent);
    }

    // Check close button functionality
    if (checkCloseButton) {
      const closeButton = modal.locator(
        '[data-testid="close-modal"], .close-button, button:has-text("Close"), button:has-text("×")'
      );

      if ((await closeButton.count()) > 0) {
        await closeButton.click();
        await expect(modal).toHaveCount(0);
      }
    }

    console.log('✅ Modal assertion passed');
  }

  /**
   * Assert error states and error handling
   */
  async assertErrorDisplayed(
    errorType: string,
    options: {
      expectedMessage?: string;
      dismissible?: boolean;
    } = {}
  ) {
    const { expectedMessage, dismissible = false } = options;

    // Look for error indicators
    const errorElement = this.page.locator(
      `[data-testid="${errorType}-error"], .error, .error-message, .alert-error`
    );

    await expect(errorElement).toBeVisible();

    if (expectedMessage) {
      await expect(errorElement).toContainText(expectedMessage);
    }

    // Test dismissal if applicable
    if (dismissible) {
      const dismissButton = errorElement.locator(
        'button:has-text("×"), button:has-text("Dismiss"), .close-button'
      );

      if ((await dismissButton.count()) > 0) {
        await dismissButton.click();
        await expect(errorElement).toHaveCount(0);
      }
    }

    console.log('✅ Error state assertion passed');
  }

  // Helper methods for other contexts
  private async assertAnonymousStateOnPage(page: Page) {
    const signInButton = page.locator('button:has-text("Sign in"), button:has-text("Sign In")');
    await expect(signInButton).toBeVisible();
  }

  private async assertJsonVisibleOnPage(page: Page) {
    await page.waitForSelector('[data-testid="json-viewer"], .json-viewer, .monaco-editor', {
      timeout: 10000,
    });

    const jsonViewer = page.locator('[data-testid="json-viewer"], .json-viewer, .monaco-editor');
    await expect(jsonViewer).toBeVisible();
  }
}

/**
 * Standalone assertion functions that can be used without class instantiation
 */
export async function assertPageLoaded(page: Page, expectedUrl?: string) {
  await page.waitForLoadState('networkidle');

  if (expectedUrl) {
    expect(page.url()).toContain(expectedUrl);
  }

  // Check for basic page structure
  const body = page.locator('body');
  await expect(body).toBeVisible();

  // Check that page isn't showing a loading state
  const loadingElements = page.locator('[data-testid="page-loading"], .page-loading');
  await expect(loadingElements).toHaveCount(0);
}

export async function assertNoNetworkErrors(page: Page) {
  // This would typically be used with network interception
  // For now, just check for error indicators on the page
  const errorElements = page.locator('.network-error, [data-testid="network-error"]');
  await expect(errorElements).toHaveCount(0);
}

export async function assertResponseTime(page: Page, maxResponseTime: number) {
  const startTime = Date.now();
  await page.waitForLoadState('networkidle');
  const endTime = Date.now();

  const responseTime = endTime - startTime;
  expect(responseTime).toBeLessThan(maxResponseTime);

  console.log(`✅ Page loaded in ${responseTime}ms (under ${maxResponseTime}ms limit)`);
}
