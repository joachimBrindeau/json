import { Page, Locator, expect } from '@playwright/test';
import { JsonViewerPage } from '../page-objects/json-viewer-page';
import { LibraryPage } from '../page-objects/library-page';
import { MainLayoutPage } from '../page-objects/main-layout-page';

export interface PublishMetadata {
  title: string;
  description: string;
  category?: string;
  tags?: string;
  difficulty?: string;
  language?: string;
  visibility?: 'public' | 'private';
}

export interface PreviewOptions {
  viewMode?: 'tree' | 'list' | 'raw';
  theme?: 'light' | 'dark';
}

export interface PublishResult {
  success: boolean;
  error?: string;
  url?: string;
}

export class PublishHelper {
  public readonly page: Page;
  public readonly viewerPage: JsonViewerPage;
  public readonly libraryPage: LibraryPage;
  public readonly layoutPage: MainLayoutPage;

  constructor(
    page: Page,
    viewerPage: JsonViewerPage,
    libraryPage: LibraryPage,
    layoutPage: MainLayoutPage
  ) {
    this.page = page;
    this.viewerPage = viewerPage;
    this.libraryPage = libraryPage;
    this.layoutPage = layoutPage;
  }

  /**
   * Common pattern: Open publish modal
   */
  async openPublishModal(): Promise<boolean> {
    try {
      await this.viewerPage.publishButton.click();
      await expect(this.viewerPage.publishModal).toBeVisible();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Common pattern: Fill publish metadata form
   */
  async fillPublishMetadata(metadata: PublishMetadata): Promise<void> {
    // Fill title
    const titleInput = this.libraryPage.page.locator('[data-testid="publish-title"]');
    await titleInput.fill(metadata.title);

    // Fill description  
    const descriptionInput = this.libraryPage.page.locator('[data-testid="publish-description"]');
    await descriptionInput.fill(metadata.description);

    // Select category if provided
    if (metadata.category) {
      const categorySelect = this.libraryPage.page.locator('[data-testid="publish-category"]');
      await categorySelect.click();
      await this.libraryPage.page.locator(`[data-value="${metadata.category}"]`).click();
    }

    // Fill tags if provided
    if (metadata.tags) {
      const tagsInput = this.libraryPage.page.locator('[data-testid="publish-tags"]');
      await tagsInput.fill(metadata.tags);
    }

    // Set difficulty if provided
    if (metadata.difficulty) {
      const difficultySelect = this.libraryPage.page.locator('[data-testid="publish-difficulty"]');
      if (await difficultySelect.isVisible()) {
        await difficultySelect.selectOption(metadata.difficulty);
      }
    }

    // Set language if provided
    if (metadata.language) {
      const languageSelect = this.libraryPage.page.locator('[data-testid="publish-language"]');
      if (await languageSelect.isVisible()) {
        await languageSelect.selectOption(metadata.language);
      }
    }

    // Wait for form validation to complete
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Common pattern: Open preview modal
   */
  async openPreview(): Promise<boolean> {
    const previewButton = this.libraryPage.page.locator('[data-testid="preview-publication"]');
    
    if (await previewButton.isVisible()) {
      await previewButton.click();
      
      const previewModal = this.libraryPage.page.locator('[data-testid="publish-preview-modal"]');
      const previewPage = this.libraryPage.page.locator('[data-testid="publish-preview-page"]');
      
      const isModal = await previewModal.isVisible();
      const isPage = await previewPage.isVisible();
      
      return isModal || isPage;
    }
    return false;
  }

  /**
   * Common pattern: Validate preview content
   */
  async validatePreviewContent(expectedMetadata: PublishMetadata): Promise<boolean> {
    const previewModal = this.libraryPage.page.locator('[data-testid="publish-preview-modal"]');
    const previewPage = this.libraryPage.page.locator('[data-testid="publish-preview-page"]');
    
    const previewContainer = await previewModal.isVisible() ? previewModal : previewPage;
    
    // Check title
    const previewTitle = previewContainer.locator('[data-testid="preview-title"]');
    if (await previewTitle.isVisible()) {
      const titleText = await previewTitle.textContent();
      if (titleText !== expectedMetadata.title) {
        return false;
      }
    }

    // Check description
    const previewDescription = previewContainer.locator('[data-testid="preview-description"]');
    if (await previewDescription.isVisible()) {
      const descText = await previewDescription.textContent();
      if (!descText?.includes(expectedMetadata.description.substring(0, 20))) {
        return false;
      }
    }

    // Check category if expected
    if (expectedMetadata.category) {
      const previewCategory = previewContainer.locator('[data-testid="preview-category"]');
      if (await previewCategory.isVisible()) {
        const catText = await previewCategory.textContent();
        if (!catText?.includes(expectedMetadata.category)) {
          return false;
        }
      }
    }

    // Check tags if expected
    if (expectedMetadata.tags) {
      const previewTags = previewContainer.locator('[data-testid="preview-tags"]');
      if (await previewTags.isVisible()) {
        const tagElements = previewTags.locator('[data-testid="tag"]');
        const tagCount = await tagElements.count();
        const expectedTagCount = expectedMetadata.tags.split(',').length;
        if (tagCount !== expectedTagCount) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Common pattern: Test different preview options
   */
  async testPreviewOptions(options: PreviewOptions): Promise<boolean> {
    const previewModal = this.libraryPage.page.locator('[data-testid="publish-preview-modal"]');
    
    // Test view mode switching
    if (options.viewMode) {
      const previewViewModes = previewModal.locator('[data-testid="preview-view-modes"]');
      if (await previewViewModes.isVisible()) {
        const viewButton = previewViewModes.locator(`[data-testid="preview-${options.viewMode}-view"]`);
        if (await viewButton.isVisible()) {
          await viewButton.click();
          
          // Wait for view content to be visible
          const viewContent = previewModal.locator(`[data-testid="preview-${options.viewMode}-content"]`);
          await expect(viewContent).toBeVisible({ timeout: 5000 });
          return await viewContent.isVisible();
        }
      }
    }

    // Test theme switching
    if (options.theme) {
      const themeSelector = previewModal.locator('[data-testid="preview-theme-selector"]');
      if (await themeSelector.isVisible()) {
        await themeSelector.selectOption(options.theme);
        
        // Wait for theme to be applied
        const previewContent = previewModal.locator('[data-testid="preview-content"]');
        await this.page.waitForLoadState('networkidle');
        const hasClass = await previewContent.getAttribute('class');
        return hasClass?.includes(options.theme) || false;
      }
    }

    return true;
  }

  /**
   * Common pattern: Edit metadata from preview
   */
  async editFromPreview(): Promise<boolean> {
    const previewModal = this.libraryPage.page.locator('[data-testid="publish-preview-modal"]');
    
    const editButton = previewModal.locator('[data-testid="edit-publication"]');
    const backToEdit = previewModal.locator('[data-testid="back-to-edit"]');

    if (await editButton.isVisible()) {
      await editButton.click();
      await expect(this.viewerPage.publishModal).toBeVisible();
      return true;
    } else if (await backToEdit.isVisible()) {
      await backToEdit.click();
      await expect(this.viewerPage.publishModal).toBeVisible();
      return true;
    }
    
    return false;
  }

  /**
   * Common pattern: Publish from preview
   */
  async publishFromPreview(): Promise<PublishResult> {
    const previewModal = this.libraryPage.page.locator('[data-testid="publish-preview-modal"]');
    const publishFromPreview = previewModal.locator('[data-testid="publish-from-preview"]');
    
    if (await publishFromPreview.isVisible()) {
      await publishFromPreview.click();

      // Wait for publishing process
      const publishingIndicator = this.libraryPage.page.locator('[data-testid="publishing-indicator"]');
      if (await publishingIndicator.isVisible()) {
        await publishingIndicator.waitFor({ state: 'hidden', timeout: 10000 });
      }

      try {
        // Wait for success notification
        await this.layoutPage.waitForNotification('Successfully published to community library');
        return { success: true };
      } catch (error) {
        // Check for error message
        const errorMessage = this.libraryPage.page.locator('[data-testid="publish-error"]');
        if (await errorMessage.isVisible()) {
          const errorText = await errorMessage.textContent();
          return { success: false, error: errorText || 'Unknown publish error' };
        }
        return { success: false, error: 'No notification received' };
      }
    }
    
    return { success: false, error: 'Publish button not found' };
  }

  /**
   * Common pattern: Save as draft from preview
   */
  async saveDraftFromPreview(): Promise<boolean> {
    const previewModal = this.libraryPage.page.locator('[data-testid="publish-preview-modal"]');
    const saveDraftButton = previewModal.locator('[data-testid="save-draft"]');
    
    if (await saveDraftButton.isVisible()) {
      await saveDraftButton.click();

      try {
        await this.layoutPage.waitForNotification('Draft saved successfully');
        await expect(previewModal).toBeHidden();
        return true;
      } catch {
        return false;
      }
    }
    
    return false;
  }

  /**
   * Common pattern: Validate publication requirements
   */
  async validatePublicationRequirements(metadata?: Partial<PublishMetadata>): Promise<string[]> {
    const errors: string[] = [];
    
    // Check for validation errors after trying to preview
    const titleError = this.libraryPage.page.locator('[data-testid="title-error"]');
    const descriptionError = this.libraryPage.page.locator('[data-testid="description-error"]');
    
    if (await titleError.isVisible()) {
      const titleErrorText = await titleError.textContent();
      if (titleErrorText) errors.push(`Title: ${titleErrorText}`);
    }
    
    if (await descriptionError.isVisible()) {
      const descErrorText = await descriptionError.textContent();
      if (descErrorText) errors.push(`Description: ${descErrorText}`);
    }
    
    return errors;
  }

  /**
   * Common pattern: Get quality warnings from preview
   */
  async getQualityWarnings(): Promise<string[]> {
    const warnings: string[] = [];
    const previewModal = this.libraryPage.page.locator('[data-testid="publish-preview-modal"]');
    
    const qualityWarning = previewModal.locator('[data-testid="preview-quality-warning"]');
    if (await qualityWarning.isVisible()) {
      const warningText = await qualityWarning.textContent();
      if (warningText) {
        warnings.push(warningText);
      }
    }
    
    return warnings;
  }

  /**
   * Common pattern: Get estimated engagement metrics
   */
  async getEstimatedEngagement(): Promise<{ views?: number; similar?: number; score?: string } | null> {
    const previewModal = this.libraryPage.page.locator('[data-testid="publish-preview-modal"]');
    const result: { views?: number; similar?: number; score?: string } = {};
    
    // Estimated views
    const estimatedViews = previewModal.locator('[data-testid="estimated-views"]');
    if (await estimatedViews.isVisible()) {
      const viewsText = await estimatedViews.textContent();
      const viewsMatch = viewsText?.match(/\d+/);
      if (viewsMatch) {
        result.views = parseInt(viewsMatch[0]);
      }
    }
    
    // Similar content count
    const similarContent = previewModal.locator('[data-testid="similar-content"]');
    if (await similarContent.isVisible()) {
      const similarItems = similarContent.locator('[data-testid="similar-item"]');
      result.similar = await similarItems.count();
    }
    
    // Discoverability score
    const discoverabilityScore = previewModal.locator('[data-testid="discoverability-score"]');
    if (await discoverabilityScore.isVisible()) {
      result.score = await discoverabilityScore.textContent() || '';
    }
    
    return Object.keys(result).length > 0 ? result : null;
  }

  /**
   * Complete publish workflow: create content, fill metadata, preview, and publish
   */
  async completePublishWorkflow(
    jsonContent: string, 
    metadata: PublishMetadata,
    previewFirst: boolean = false
  ): Promise<PublishResult> {
    // Input JSON content
    await this.viewerPage.inputJSON(jsonContent);
    await this.viewerPage.waitForJSONProcessed();

    // Open publish modal
    if (!(await this.openPublishModal())) {
      return { success: false, error: 'Could not open publish modal' };
    }

    // Fill metadata
    await this.fillPublishMetadata(metadata);

    // Preview first if requested
    if (previewFirst) {
      if (!(await this.openPreview())) {
        return { success: false, error: 'Could not open preview' };
      }
      
      // Validate preview content
      if (!(await this.validatePreviewContent(metadata))) {
        return { success: false, error: 'Preview content validation failed' };
      }
      
      // Publish from preview
      return await this.publishFromPreview();
    } else {
      // Direct publish
      const publishButton = this.libraryPage.page.locator('[data-testid="publish-confirm"]');
      await publishButton.click();
      
      try {
        await this.layoutPage.waitForNotification('Successfully published');
        return { success: true };
      } catch {
        return { success: false, error: 'Publish failed' };
      }
    }
  }
}