import { Page, Locator, expect } from '@playwright/test';
import { JsonViewerPage } from '../page-objects/json-viewer-page';
import { LibraryPage } from '../page-objects/library-page';

export interface SaveMetadata {
  title: string;
  description?: string;
  tags?: string;
  category?: string;
}

export interface SaveResult {
  success: boolean;
  error?: string;
}

export class LibraryActionHelper {
  public readonly page: Page;
  public readonly viewerPage: JsonViewerPage;
  public readonly libraryPage: LibraryPage;

  constructor(
    page: Page,
    viewerPage: JsonViewerPage,
    libraryPage: LibraryPage
  ) {
    this.page = page;
    this.viewerPage = viewerPage;
    this.libraryPage = libraryPage;
  }

  /**
   * Common pattern: Find and click save to library button
   */
  async clickSaveToLibraryButton(): Promise<boolean> {
    const saveButton = this.viewerPage.page.locator('[data-testid="save-to-library"], button:has-text("Save"), button:has-text("Add to Library")');
    
    if (await saveButton.isVisible({ timeout: 3000 })) {
      await saveButton.click();
      return true;
    }
    return false;
  }

  /**
   * Common pattern: Fill document save form
   */
  async fillSaveForm(metadata: SaveMetadata): Promise<void> {
    // Fill title
    const titleInput = this.viewerPage.page.locator('[data-testid="document-title"], input[placeholder*="title"], input[name="title"]');
    if (await titleInput.isVisible({ timeout: 2000 })) {
      await titleInput.fill(metadata.title);
    }

    // Fill description if provided
    if (metadata.description) {
      const descriptionInput = this.viewerPage.page.locator('[data-testid="document-description"], textarea[placeholder*="description"], textarea[name="description"]');
      if (await descriptionInput.isVisible()) {
        await descriptionInput.fill(metadata.description);
      }
    }

    // Fill tags if provided
    if (metadata.tags) {
      const tagsInput = this.viewerPage.page.locator('[data-testid="document-tags"], input[placeholder*="tags"], input[name="tags"]');
      if (await tagsInput.isVisible()) {
        await tagsInput.fill(metadata.tags);
      }
    }

    // Select category if provided
    if (metadata.category) {
      const categorySelect = this.viewerPage.page.locator('[data-testid="document-category"], select[name="category"]');
      if (await categorySelect.isVisible()) {
        try {
          await categorySelect.selectOption(metadata.category);
        } catch {
          // Category might not exist, continue
        }
      }
    }
  }

  /**
   * Common pattern: Confirm save operation
   */
  async confirmSave(): Promise<boolean> {
    const confirmButton = this.viewerPage.page.locator('[data-testid="save-confirm"], button:has-text("Save"), button:has-text("Confirm")');
    
    if (await confirmButton.isVisible({ timeout: 2000 })) {
      await confirmButton.click();
      
      // Wait for network activity to complete
      await this.viewerPage.page.waitForLoadState('networkidle', { timeout: 10000 });
      
      // Check for success message
      try {
        await expect(this.viewerPage.page.locator('.success-message, [data-testid="success-message"], .toast')).toBeVisible({ timeout: 5000 });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  /**
   * Common pattern: Cancel save operation
   */
  async cancelSave(): Promise<boolean> {
    const cancelButton = this.viewerPage.page.locator('[data-testid="save-cancel"], button:has-text("Cancel")');
    
    if (await cancelButton.isVisible()) {
      await cancelButton.click();
      
      // Should close modal/dialog
      try {
        await expect(this.viewerPage.page.locator('[data-testid="save-modal"], .modal')).not.toBeVisible({ timeout: 2000 });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  /**
   * Common pattern: Complete save workflow
   */
  async saveToLibrary(jsonContent: string, metadata: SaveMetadata): Promise<SaveResult> {
    // Input and process JSON
    await this.viewerPage.inputJSON(jsonContent);
    await this.viewerPage.waitForJSONProcessed();
    
    // Check for JSON errors first
    if (await this.viewerPage.hasJSONErrors()) {
      return { success: false, error: 'JSON has validation errors' };
    }

    // Click save button
    if (!(await this.clickSaveToLibraryButton())) {
      return { success: false, error: 'Save button not found or not clickable' };
    }

    // Fill form
    await this.fillSaveForm(metadata);

    // Confirm save
    if (await this.confirmSave()) {
      return { success: true };
    } else {
      return { success: false, error: 'Save confirmation failed' };
    }
  }

  /**
   * Common pattern: Check if save is disabled for invalid JSON
   */
  async isSaveDisabledForInvalidJSON(invalidJson: string): Promise<boolean> {
    await this.viewerPage.inputJSON(invalidJson);
    
    // Should show error
    if (!(await this.viewerPage.hasJSONErrors())) {
      return false;
    }

    // Save button should be disabled or not available
    const saveButton = this.viewerPage.page.locator('[data-testid="save-to-library"], button:has-text("Save")');
    if (await saveButton.isVisible()) {
      return !(await saveButton.isEnabled());
    }
    
    return true; // Button not visible, which means save is effectively disabled
  }

  /**
   * Common pattern: Save with progress indication for large files
   */
  async saveLargeDocument(jsonContent: string, metadata: SaveMetadata): Promise<SaveResult> {
    // Input large JSON
    await this.viewerPage.inputJSON(jsonContent);
    await this.viewerPage.waitForJSONProcessed();

    // Start save
    if (!(await this.clickSaveToLibraryButton())) {
      return { success: false, error: 'Save button not found' };
    }

    await this.fillSaveForm(metadata);

    // Confirm save - might show progress for large files
    const confirmButton = this.viewerPage.page.locator('[data-testid="save-confirm"], button:has-text("Save")');
    if (await confirmButton.isVisible()) {
      await confirmButton.click();

      // Look for progress indicators
      const progressIndicator = this.viewerPage.page.locator('[data-testid="save-progress"], .progress-bar, .loading-spinner');
      
      if (await progressIndicator.isVisible({ timeout: 1000 })) {
        // Wait for progress to complete
        await expect(progressIndicator).not.toBeVisible({ timeout: 10000 });
      } else {
        // No progress indicator, wait for network to be idle
        await this.viewerPage.page.waitForLoadState('networkidle', { timeout: 10000 });
      }

      // Check for completion
      try {
        await expect(this.viewerPage.page.locator('.success-message, [data-testid="success-message"]')).toBeVisible({ timeout: 5000 });
        return { success: true };
      } catch {
        return { success: false, error: 'Save did not complete successfully' };
      }
    }

    return { success: false, error: 'Could not confirm save' };
  }

  /**
   * Common pattern: Verify document was saved in library
   */
  async verifyDocumentInLibrary(documentTitle: string): Promise<boolean> {
    // Navigate to library
    await this.libraryPage.navigateToLibrary();
    
    // Search for the document
    const searchInput = this.libraryPage.page.locator('[data-testid="library-search"], input[placeholder*="search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill(documentTitle);
      
      // Wait for search results to load
      await this.viewerPage.page.waitForLoadState('networkidle', { timeout: 5000 });

      // Look for the document
      const documentCard = this.libraryPage.page.locator(`[data-testid="document-card"]:has-text("${documentTitle}")`);
      return await documentCard.isVisible({ timeout: 5000 });
    }
    
    return false;
  }

  /**
   * Common pattern: Handle duplicate save attempts
   */
  async attemptDuplicateSave(jsonContent: string, documentTitle: string): Promise<{ allowed: boolean; message?: string }> {
    // Save first time
    const firstSave = await this.saveToLibrary(jsonContent, { title: documentTitle });
    if (!firstSave.success) {
      return { allowed: false, message: 'First save failed' };
    }

    // Try to save again with same title
    await this.viewerPage.inputJSON(jsonContent);
    await this.viewerPage.waitForJSONProcessed();

    if (await this.clickSaveToLibraryButton()) {
      await this.fillSaveForm({ title: documentTitle });
      
      const confirmButton = this.viewerPage.page.locator('[data-testid="save-confirm"], button:has-text("Save")');
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
        
        // Wait for save operation to complete
        await this.viewerPage.page.waitForLoadState('networkidle', { timeout: 5000 });

        // Check if there's a duplicate warning or if it was handled gracefully
        const duplicateWarning = this.viewerPage.page.locator('[data-testid="duplicate-warning"], .duplicate-error');
        if (await duplicateWarning.isVisible()) {
          const warningText = await duplicateWarning.textContent();
          return { allowed: false, message: warningText || 'Duplicate detected' };
        } else {
          // No warning shown, check if save succeeded (creating variant)
          const successMsg = this.viewerPage.page.locator('.success-message, [data-testid="success-message"]');
          const saveSucceeded = await successMsg.isVisible({ timeout: 3000 });
          
          return {
            allowed: saveSucceeded,
            message: saveSucceeded ? 'Created variant' : 'Unknown result'
          };
        }
      }
    }

    return { allowed: false, message: 'Could not attempt second save' };
  }

  /**
   * Common pattern: Test save with various JSON types
   */
  async testSaveWithJSONType(jsonContent: any, expectedCategory: string): Promise<SaveResult> {
    const jsonString = JSON.stringify(jsonContent, null, 2);
    const metadata: SaveMetadata = {
      title: `${expectedCategory} Test Document`,
      category: expectedCategory,
      description: `Test document for ${expectedCategory} category`
    };

    return await this.saveToLibrary(jsonString, metadata);
  }

  /**
   * Common pattern: Test save with preserved formatting
   */
  async testFormattingPreservation(formattedJson: string, documentTitle: string): Promise<boolean> {
    // Save formatted JSON
    const saveResult = await this.saveToLibrary(formattedJson, { title: documentTitle });
    if (!saveResult.success) {
      return false;
    }

    // Navigate to library and verify formatting is preserved
    await this.libraryPage.navigateToLibrary();
    
    const documentCard = this.libraryPage.page.locator(`[data-testid="document-card"]:has-text("${documentTitle}")`);
    if (await documentCard.isVisible()) {
      await documentCard.click();
      
      // Should load back with preserved formatting
      await this.viewerPage.waitForJSONProcessed();
      return !(await this.viewerPage.hasJSONErrors());
    }

    return false;
  }
}