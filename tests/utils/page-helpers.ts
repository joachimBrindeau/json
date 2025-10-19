import { Page, Locator, expect } from '@playwright/test';

/**
 * Common page navigation and interaction patterns
 * Provides reusable UI interaction utilities to eliminate duplication
 */
export class PageHelpers {
  constructor(private page: Page) {}

  // ===== NAVIGATION HELPERS =====

  /**
   * Navigate to homepage and wait for it to load
   */
  async navigateToHome() {
    await this.page.goto('/');
    await this.waitForPageLoad();
    console.log('📍 Navigated to homepage');
  }

  /**
   * Navigate to JSON viewer
   */
  async navigateToViewer(jsonId?: string) {
    const url = jsonId ? `/viewer/${jsonId}` : '/viewer';
    await this.page.goto(url);
    await this.waitForPageLoad();
    console.log(`📍 Navigated to viewer: ${url}`);
  }

  /**
   * Navigate to user library
   */
  async navigateToLibrary() {
    await this.page.goto('/saved');
    await this.waitForPageLoad();
    
    // Wait for library items to load
    await this.page.waitForSelector(
      '[data-testid="library-items"], .library-items, .document-list',
      { timeout: 10000 }
    ).catch(() => {
      console.warn('Library items container not found, continuing...');
    });
    
    console.log('📍 Navigated to user library');
  }

  /**
   * Navigate to library
   */
  async navigateToPublicLibrary() {
    await this.page.goto('/saved');
    await this.waitForPageLoad();
    
    // Wait for library content
    await this.page.waitForSelector(
      '[data-testid="public-library"], .public-library-content',
      { timeout: 10000 }
    ).catch(() => {
      console.warn('Public library content not found, continuing...');
    });
    
    console.log('📍 Navigated to library');
  }

  /**
   * Navigate to user profile
   */
  async navigateToProfile() {
    await this.page.goto('/profile');
    await this.waitForPageLoad();
    console.log('📍 Navigated to user profile');
  }

  /**
   * Navigate to share URL
   */
  async navigateToShare(shareId: string) {
    const url = `/library/${shareId}`;
    await this.page.goto(url);
    await this.waitForPageLoad();
    console.log(`📍 Navigated to share URL: ${url}`);
  }

  /**
   * Navigate to embed URL
   */
  async navigateToEmbed(shareId: string) {
    const url = `/embed/${shareId}`;
    await this.page.goto(url);
    await this.waitForPageLoad();
    console.log(`📍 Navigated to embed URL: ${url}`);
  }

  // ===== JSON INTERACTION HELPERS =====

  /**
   * Upload JSON file via drag and drop
   */
  async uploadJsonFile(filePath: string, fileName = 'test.json') {
    const fileInput = this.page.locator('input[type="file"], [data-testid="file-input"]');
    
    if (await fileInput.count() > 0) {
      // Direct file input
      await fileInput.setInputFiles(filePath);
    } else {
      // Try drag and drop area
      const dropZone = this.page.locator('[data-testid="drop-zone"], .drop-zone, .file-drop-area').first();
      await dropZone.setInputFiles(filePath);
    }
    
    console.log(`📤 Uploaded JSON file: ${fileName}`);
  }

  /**
   * Input JSON text directly into editor
   */
  async inputJsonText(jsonContent: string | object) {
    const jsonString = typeof jsonContent === 'object' 
      ? JSON.stringify(jsonContent, null, 2) 
      : jsonContent;

    // Try different editor selectors
    const editorSelectors = [
      '[data-testid="json-input"]',
      '.monaco-editor textarea',
      'textarea[placeholder*="JSON"]',
      '.json-editor textarea',
      'textarea.json-input'
    ];

    let editorFound = false;
    for (const selector of editorSelectors) {
      const editor = this.page.locator(selector);
      if (await editor.count() > 0) {
        await editor.clear();
        await editor.fill(jsonString);
        editorFound = true;
        break;
      }
    }

    if (!editorFound) {
      // Try Monaco editor specific approach
      await this.page.click('.monaco-editor');
      await this.page.keyboard.press('Control+a');
      await this.page.keyboard.type(jsonString);
    }

    // Wait for processing
    await this.waitForJsonProcessing();
    console.log('✍️ JSON content entered');
  }

  /**
   * Switch between view modes (tree, raw, formatted)
   */
  async switchViewMode(mode: 'tree' | 'raw' | 'formatted' | 'table') {
    const modeButtons = {
      tree: '[data-testid="tree-view-btn"], button:has-text("Tree"), .view-mode-tree',
      raw: '[data-testid="raw-view-btn"], button:has-text("Raw"), .view-mode-raw',
      formatted: '[data-testid="formatted-view-btn"], button:has-text("Formatted"), .view-mode-formatted',
      table: '[data-testid="table-view-btn"], button:has-text("Table"), .view-mode-table'
    };

    const modeButton = this.page.locator(modeButtons[mode]);
    await modeButton.click();
    
    // Wait for view mode to change by checking for active state
    await this.page.waitForLoadState('networkidle', { timeout: 5000 });
    console.log(`🔄 Switched to ${mode} view mode`);
  }

  /**
   * Search within JSON content
   */
  async searchJsonContent(searchTerm: string) {
    const searchInputs = [
      '[data-testid="json-search"]',
      'input[placeholder*="Search"]',
      '.search-input',
      '.json-search input'
    ];

    for (const selector of searchInputs) {
      const searchInput = this.page.locator(selector);
      if (await searchInput.count() > 0) {
        await searchInput.fill(searchTerm);
        await this.page.keyboard.press('Enter');
        await this.page.waitForLoadState('networkidle', { timeout: 3000 });
        console.log(`🔍 Searched for: ${searchTerm}`);
        return;
      }
    }

    // Try keyboard shortcut if search input not found
    await this.page.keyboard.press('Control+f');
    await this.page.keyboard.type(searchTerm);
    await this.page.keyboard.press('Enter');
    console.log(`🔍 Searched using keyboard shortcut: ${searchTerm}`);
  }

  /**
   * Expand/collapse JSON nodes in tree view
   */
  async toggleJsonNode(nodePath: string) {
    const nodeToggle = this.page.locator(
      `[data-path="${nodePath}"] .toggle, [data-testid="node-toggle-${nodePath}"]`
    );
    
    await nodeToggle.click();
    
    // Wait for expansion/collapse animation to complete
    await this.page.waitForLoadState('domcontentloaded');
    console.log(`🌲 Toggled JSON node: ${nodePath}`);
  }

  /**
   * Copy JSON content to clipboard
   */
  async copyJsonContent() {
    const copyButtons = [
      '[data-testid="copy-json"]',
      'button:has-text("Copy")',
      '.copy-button',
      '.copy-json-btn'
    ];

    for (const selector of copyButtons) {
      const copyButton = this.page.locator(selector);
      if (await copyButton.count() > 0) {
        await copyButton.click();
        
        // Wait for copy operation to complete (check for success indicator)
        const copySuccess = this.page.locator('[data-testid="copy-success"], .copy-success');
        await expect(copySuccess).toBeVisible({ timeout: 2000 }).catch(() => {});
        console.log('📋 JSON content copied to clipboard');
        return;
      }
    }

    // Fallback to keyboard shortcut
    await this.page.keyboard.press('Control+a');
    await this.page.keyboard.press('Control+c');
    console.log('📋 JSON content copied using keyboard shortcut');
  }

  /**
   * Download JSON as file
   */
  async downloadJson() {
    const downloadPromise = this.page.waitForEvent('download');
    
    const downloadButtons = [
      '[data-testid="download-json"]',
      'button:has-text("Download")',
      '.download-button',
      '.download-json-btn'
    ];

    for (const selector of downloadButtons) {
      const downloadButton = this.page.locator(selector);
      if (await downloadButton.count() > 0) {
        await downloadButton.click();
        break;
      }
    }

    const download = await downloadPromise;
    console.log(`📥 Downloaded JSON file: ${download.suggestedFilename()}`);
    return download;
  }

  // ===== MODAL AND DIALOG HELPERS =====

  /**
   * Open and handle login modal
   */
  async openLoginModal() {
    const signInButton = this.page.locator(
      'button:has-text("Sign in"), button:has-text("Sign In"), [data-testid="sign-in-btn"]'
    );
    
    await signInButton.click();
    
    // Wait for modal to appear
    await this.page.waitForSelector('[role="dialog"], .modal', { timeout: 5000 });
    console.log('🔐 Login modal opened');
  }

  /**
   * Handle share modal
   */
  async openShareModal() {
    const shareButtons = [
      '[data-testid="share-btn"]',
      'button:has-text("Share")',
      '.share-button'
    ];

    for (const selector of shareButtons) {
      const shareButton = this.page.locator(selector);
      if (await shareButton.count() > 0) {
        await shareButton.click();
        break;
      }
    }

    // Wait for share modal
    await this.page.waitForSelector('[data-testid="share-modal"], .share-modal', { timeout: 5000 });
    console.log('🔗 Share modal opened');
  }

  /**
   * Handle save/title editing modal
   */
  async openSaveModal() {
    const saveButtons = [
      '[data-testid="save-btn"]',
      'button:has-text("Save")',
      '.save-button'
    ];

    for (const selector of saveButtons) {
      const saveButton = this.page.locator(selector);
      if (await saveButton.count() > 0) {
        await saveButton.click();
        break;
      }
    }

    // Wait for save modal
    await this.page.waitForSelector('[data-testid="save-modal"], .save-modal', { timeout: 5000 });
    console.log('💾 Save modal opened');
  }

  /**
   * Close any open modal
   */
  async closeModal() {
    const closeButtons = [
      '[data-testid="close-modal"]',
      'button:has-text("×")',
      '.close-button',
      '[aria-label="Close"]'
    ];

    for (const selector of closeButtons) {
      const closeButton = this.page.locator(selector);
      if (await closeButton.count() > 0) {
        await closeButton.click();
        
        // Wait for modal to be hidden
        const modal = this.page.locator('[role="dialog"], .modal');
        await expect(modal).not.toBeVisible({ timeout: 2000 });
        console.log('❌ Modal closed');
        return;
      }
    }

    // Fallback to Escape key
    await this.page.keyboard.press('Escape');
    
    // Wait for modal to be hidden
    const modal = this.page.locator('[role="dialog"], .modal');
    await expect(modal).not.toBeVisible({ timeout: 2000 });
    console.log('❌ Modal closed with Escape key');
  }

  // ===== FORM HELPERS =====

  /**
   * Fill out document metadata form
   */
  async fillDocumentForm(data: {
    title?: string;
    description?: string;
    tags?: string[];
    category?: string;
    isPublic?: boolean;
  }) {
    if (data.title) {
      await this.fillField('title', data.title);
    }

    if (data.description) {
      await this.fillField('description', data.description);
    }

    if (data.tags) {
      await this.fillTags(data.tags);
    }

    if (data.category) {
      await this.selectCategory(data.category);
    }

    if (data.isPublic !== undefined) {
      await this.togglePublicVisibility(data.isPublic);
    }

    console.log('📝 Document form filled');
  }

  /**
   * Submit current form
   */
  async submitForm() {
    const submitButtons = [
      'button[type="submit"]',
      '[data-testid="submit-btn"]',
      'button:has-text("Save")',
      'button:has-text("Submit")',
      'button:has-text("Create")'
    ];

    for (const selector of submitButtons) {
      const submitButton = this.page.locator(selector);
      if (await submitButton.count() > 0) {
        await submitButton.click();
        
        // Wait for form submission to complete
        await this.page.waitForLoadState('networkidle', { timeout: 5000 });
        console.log('✅ Form submitted');
        return;
      }
    }

    throw new Error('Submit button not found');
  }

  // ===== LIBRARY INTERACTION HELPERS =====

  /**
   * Filter library by category
   */
  async filterByCategory(category: string) {
    const categoryFilter = this.page.locator(
      `[data-testid="category-${category}"], .category-filter:has-text("${category}")`
    );

    await categoryFilter.click();
    
    // Wait for filter to be applied
    await this.page.waitForLoadState('networkidle', { timeout: 3000 });
    console.log(`🏷️ Filtered by category: ${category}`);
  }

  /**
   * Filter library by tags
   */
  async filterByTag(tag: string) {
    const tagFilter = this.page.locator(
      `[data-testid="tag-${tag}"], .tag-filter:has-text("${tag}")`
    );

    await tagFilter.click();
    
    // Wait for filter to be applied
    await this.page.waitForLoadState('networkidle', { timeout: 3000 });
    console.log(`🏷️ Filtered by tag: ${tag}`);
  }

  /**
   * Search library
   */
  async searchLibrary(searchTerm: string) {
    const searchInputs = [
      '[data-testid="library-search"]',
      'input[placeholder*="Search library"]',
      '.library-search input'
    ];

    for (const selector of searchInputs) {
      const searchInput = this.page.locator(selector);
      if (await searchInput.count() > 0) {
        await searchInput.fill(searchTerm);
        await this.page.keyboard.press('Enter');
        
        // Wait for search results to load
        await this.page.waitForLoadState('networkidle', { timeout: 5000 });
        console.log(`🔍 Searched library for: ${searchTerm}`);
        return;
      }
    }

    throw new Error('Library search input not found');
  }

  /**
   * Select library item
   */
  async selectLibraryItem(itemTitle: string) {
    const libraryItem = this.page.locator(`text="${itemTitle}"`).first();
    await libraryItem.click();
    await this.waitForPageLoad();
    console.log(`📖 Selected library item: ${itemTitle}`);
  }

  // ===== UTILITY HELPERS =====

  /**
   * Wait for page to fully load
   */
  async waitForPageLoad(timeout = 15000) {
    await Promise.all([
      this.page.waitForLoadState('networkidle', { timeout }),
      this.page.waitForFunction(() => {
        return !document.querySelector('[data-testid="page-loading"], .page-loading');
      }, { timeout }),
    ]);

    // Additional wait for React hydration
    await Promise.race([
      this.page.waitForLoadState('domcontentloaded'),
      this.page.waitForFunction(() => document.readyState === 'complete', { timeout: 2000 })
    ]).catch(() => {});
  }

  /**
   * Wait for JSON processing to complete
   */
  async waitForJsonProcessing(timeout = 10000) {
    // Wait for processing indicators to disappear
    await this.page.waitForFunction(
      () => {
        const processingElements = document.querySelectorAll(
          '[data-testid="processing"], .processing, .json-loading, .analyzing'
        );
        return processingElements.length === 0;
      },
      { timeout }
    );

    // Wait for content to be visible
    await this.page.waitForSelector(
      '[data-testid="json-viewer"], .json-viewer, .tree-view, .monaco-editor',
      { timeout }
    );

    // Wait for any pending updates to complete
    await this.page.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {});
  }

  /**
   * Take screenshot with timestamp
   */
  async takeScreenshot(name: string, options: { fullPage?: boolean } = {}) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotPath = `test-results/screenshots/${name}-${timestamp}.png`;
    
    await this.page.screenshot({
      path: screenshotPath,
      fullPage: options.fullPage || false,
    });

    console.log(`📸 Screenshot saved: ${screenshotPath}`);
    return screenshotPath;
  }

  /**
   * Scroll to element
   */
  async scrollToElement(selector: string) {
    const element = this.page.locator(selector);
    await element.scrollIntoViewIfNeeded();
    
    // Wait for scroll to complete
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Wait for toast/notification
   */
  async waitForNotification(expectedText?: string, timeout = 5000) {
    const notificationSelectors = [
      '[data-testid="notification"]',
      '.toast',
      '.notification',
      '.alert',
      '.success-message',
      '.error-message'
    ];

    for (const selector of notificationSelectors) {
      const notification = this.page.locator(selector);
      if (await notification.count() > 0) {
        await expect(notification).toBeVisible({ timeout });
        
        if (expectedText) {
          await expect(notification).toContainText(expectedText);
        }
        
        console.log(`🔔 Notification appeared: ${expectedText || 'notification'}`);
        return notification;
      }
    }

    if (expectedText) {
      // Try to find by text content
      const textNotification = this.page.locator(`text="${expectedText}"`);
      if (await textNotification.count() > 0) {
        await expect(textNotification).toBeVisible({ timeout });
        console.log(`🔔 Notification found by text: ${expectedText}`);
        return textNotification;
      }
    }

    throw new Error(`Notification not found${expectedText ? ` with text: ${expectedText}` : ''}`);
  }

  // ===== PRIVATE HELPER METHODS =====

  private async fillField(fieldName: string, value: string) {
    const fieldSelectors = [
      `[data-testid="${fieldName}"]`,
      `input[name="${fieldName}"]`,
      `#${fieldName}`,
      `textarea[name="${fieldName}"]`,
      `[placeholder*="${fieldName}"]`
    ];

    for (const selector of fieldSelectors) {
      const field = this.page.locator(selector);
      if (await field.count() > 0) {
        await field.fill(value);
        return;
      }
    }

    throw new Error(`Field not found: ${fieldName}`);
  }

  private async fillTags(tags: string[]) {
    const tagInput = this.page.locator(
      '[data-testid="tags-input"], input[name="tags"], .tags-input'
    );

    if (await tagInput.count() > 0) {
      for (const tag of tags) {
        await tagInput.fill(tag);
        await this.page.keyboard.press('Enter');
        
        // Wait for tag to be added to the list
        const addedTag = this.page.locator(`[data-tag="${tag}"]`);
        await expect(addedTag).toBeVisible({ timeout: 2000 }).catch(() => {});
      }
    }
  }

  private async selectCategory(category: string) {
    const categorySelect = this.page.locator(
      '[data-testid="category-select"], select[name="category"]'
    );

    if (await categorySelect.count() > 0) {
      await categorySelect.selectOption(category);
    }
  }

  private async togglePublicVisibility(isPublic: boolean) {
    const publicToggle = this.page.locator(
      '[data-testid="public-toggle"], input[type="checkbox"][name*="public"]'
    );

    if (await publicToggle.count() > 0) {
      const isCurrentlyChecked = await publicToggle.isChecked();
      if (isCurrentlyChecked !== isPublic) {
        await publicToggle.click();
      }
    }
  }
}

/**
 * Standalone helper functions for common page interactions
 */

/**
 * Quick navigation to any page with loading wait
 */
export async function quickNavigate(page: Page, url: string) {
  const helper = new PageHelpers(page);
  await page.goto(url);
  await helper.waitForPageLoad();
}

/**
 * Quick JSON input with processing wait
 */
export async function quickInputJson(page: Page, jsonContent: string | object) {
  const helper = new PageHelpers(page);
  await helper.inputJsonText(jsonContent);
}

/**
 * Quick modal handling
 */
export async function handleModal(page: Page, action: 'open' | 'close', modalType?: string) {
  const helper = new PageHelpers(page);
  
  if (action === 'open') {
    switch (modalType) {
      case 'login':
        await helper.openLoginModal();
        break;
      case 'share':
        await helper.openShareModal();
        break;
      case 'save':
        await helper.openSaveModal();
        break;
      default:
        throw new Error(`Unknown modal type: ${modalType}`);
    }
  } else {
    await helper.closeModal();
  }
}

/**
 * Quick form submission with wait
 */
export async function quickSubmitForm(page: Page, formData?: any) {
  const helper = new PageHelpers(page);
  
  if (formData) {
    await helper.fillDocumentForm(formData);
  }
  
  await helper.submitForm();
}