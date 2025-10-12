import { Page, Locator, expect } from '@playwright/test';
import { JsonViewerPage } from '../page-objects/json-viewer-page';
import { LibraryPage } from '../page-objects/library-page';

export interface ShareOptions {
  expiration?: string;
  password?: string;
  visibility?: 'public' | 'private';
  generateQR?: boolean;
}

export interface ShareResult {
  url: string;
  success: boolean;
  error?: string;
}

export class ShareHelper {
  public readonly page: Page;
  public readonly viewerPage: JsonViewerPage;
  public readonly libraryPage?: LibraryPage;

  constructor(
    page: Page,
    viewerPage: JsonViewerPage,
    libraryPage?: LibraryPage
  ) {
    this.page = page;
    this.viewerPage = viewerPage;
    this.libraryPage = libraryPage;
  }

  /**
   * Common pattern: Find and click share button with multiple selectors
   */
  async clickShareButton(): Promise<boolean> {
    const shareButton = this.page.locator('[data-testid="share-button"], button:has-text("Share"), .share-btn');
    
    if (await shareButton.isVisible({ timeout: 5000 })) {
      await shareButton.click();
      await this.page.waitForTimeout(2000);
      return true;
    }
    return false;
  }

  /**
   * Common pattern: Wait for and validate share modal appears
   */
  async waitForShareModal(): Promise<boolean> {
    const shareModal = this.page.locator('[data-testid="share-modal"], .modal, .share-dialog');
    
    try {
      await expect(shareModal).toBeVisible({ timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Common pattern: Get share URL from modal
   */
  async getShareUrl(): Promise<string | null> {
    const shareUrl = this.page.locator('[data-testid="share-url"], input[readonly], .share-url');
    
    if (await shareUrl.isVisible()) {
      const url = await shareUrl.inputValue();
      if (url && url.match(/https?:\/\/.+/)) {
        return url;
      }
    }
    return null;
  }

  /**
   * Common pattern: Copy share URL to clipboard
   */
  async copyShareUrl(): Promise<boolean> {
    const copyButton = this.page.locator('[data-testid="copy-share-url"], button:has-text("Copy"), .copy-btn');
    
    if (await copyButton.isVisible()) {
      await copyButton.click();
      await this.page.waitForTimeout(1000);

      // Check for success message
      const successMessage = this.page.locator('[data-testid="copy-success"], .success-message, .toast');
      return await successMessage.isVisible({ timeout: 3000 });
    }
    return false;
  }

  /**
   * Common pattern: Create share with JSON content
   */
  async createShare(jsonContent: string, options: ShareOptions = {}): Promise<ShareResult> {
    // Input JSON first
    await this.viewerPage.inputJSON(jsonContent);
    await this.viewerPage.waitForJSONProcessed();

    // Click share button
    if (!(await this.clickShareButton())) {
      return { url: '', success: false, error: 'Share button not found' };
    }

    // Wait for modal
    if (!(await this.waitForShareModal())) {
      return { url: '', success: false, error: 'Share modal not found' };
    }

    // Configure share options
    await this.configureShareOptions(options);

    // Generate or get share URL
    const url = await this.getShareUrl();
    if (!url) {
      return { url: '', success: false, error: 'Could not generate share URL' };
    }

    return { url, success: true };
  }

  /**
   * Configure share options like expiration, password, etc.
   */
  private async configureShareOptions(options: ShareOptions): Promise<void> {
    // Set expiration if provided
    if (options.expiration) {
      const expirationSelect = this.page.locator('[data-testid="expiration-select"], select[name="expiration"], .expiration-dropdown');
      if (await expirationSelect.isVisible({ timeout: 2000 })) {
        try {
          await expirationSelect.selectOption(options.expiration);
          await this.page.waitForTimeout(300);
        } catch {
          // Option might not exist, continue
        }
      }
    }

    // Set password protection if provided
    if (options.password) {
      const passwordCheckbox = this.page.locator('[data-testid="password-protect"], input[type="checkbox"], .password-option');
      if (await passwordCheckbox.isVisible({ timeout: 2000 })) {
        await passwordCheckbox.check();
        await this.page.waitForTimeout(500);

        const passwordInput = this.page.locator('[data-testid="share-password"], input[type="password"], .password-input');
        if (await passwordInput.isVisible()) {
          await passwordInput.fill(options.password);
          
          const confirmPasswordInput = this.page.locator('[data-testid="confirm-password"], input[placeholder*="confirm"]');
          if (await confirmPasswordInput.isVisible()) {
            await confirmPasswordInput.fill(options.password);
          }
        }
      }
    }

    // Set visibility if provided
    if (options.visibility) {
      const visibilityOption = this.page.locator(`[data-testid="${options.visibility}-share"], input[value="${options.visibility}"], .${options.visibility}-option`);
      if (await visibilityOption.isVisible({ timeout: 2000 })) {
        await visibilityOption.click();
        await this.page.waitForTimeout(500);
      }
    }

    // Generate share link if there's a generate button
    const generateButton = this.page.locator('[data-testid="generate-share"], button:has-text("Generate"), .generate-btn');
    if (await generateButton.isVisible()) {
      await generateButton.click();
      await this.page.waitForTimeout(1000);
    }
  }

  /**
   * Common pattern: Test share URL by navigating to it
   */
  async testShareUrl(url: string): Promise<boolean> {
    try {
      // Close any open modals first
      await this.closeShareModal();
      
      // Navigate to share URL
      await this.page.goto(url);
      await this.viewerPage.waitForLoad();
      
      // Should load the shared JSON
      await this.viewerPage.waitForJSONProcessed();
      const hasErrors = await this.viewerPage.hasJSONErrors();
      
      return !hasErrors;
    } catch {
      return false;
    }
  }

  /**
   * Common pattern: Close share modal
   */
  async closeShareModal(): Promise<void> {
    const closeButton = this.page.locator('[data-testid="close-modal"], button:has-text("Close"), .close-btn');
    if (await closeButton.isVisible()) {
      await closeButton.click();
    } else {
      await this.page.keyboard.press('Escape');
    }
    await this.page.waitForTimeout(500);
  }

  /**
   * Common pattern: Generate QR code for sharing
   */
  async generateQRCode(): Promise<boolean> {
    const qrButton = this.page.locator('[data-testid="qr-code"], button:has-text("QR Code"), .qr-btn');
    if (await qrButton.isVisible({ timeout: 2000 })) {
      await qrButton.click();
      await this.page.waitForTimeout(1000);

      // Check if QR code appears
      const qrCodeImage = this.page.locator('[data-testid="qr-image"], img, canvas, .qr-code');
      return await qrCodeImage.isVisible({ timeout: 3000 });
    }
    return false;
  }

  /**
   * Common pattern: Check social sharing options
   */
  async checkSocialSharingOptions(): Promise<string[]> {
    const availableOptions: string[] = [];
    
    const socialSection = this.page.locator('[data-testid="social-share"], .social-sharing');
    if (await socialSection.isVisible({ timeout: 2000 })) {
      const platforms = [
        { name: 'twitter', selector: '[data-testid="share-twitter"], .twitter-share, button:has-text("Twitter")' },
        { name: 'linkedin', selector: '[data-testid="share-linkedin"], .linkedin-share, button:has-text("LinkedIn")' },
        { name: 'facebook', selector: '[data-testid="share-facebook"], .facebook-share, button:has-text("Facebook")' }
      ];

      for (const platform of platforms) {
        const button = socialSection.locator(platform.selector);
        if (await button.isVisible()) {
          availableOptions.push(platform.name);
        }
      }
    }

    return availableOptions;
  }

  /**
   * Common pattern: Revoke/delete share link
   */
  async revokeShareLink(shareUrl: string): Promise<boolean> {
    // Find and click revoke button
    const revokeButton = this.page.locator('[data-testid="revoke-share"], button:has-text("Revoke"), .revoke-btn');
    if (await revokeButton.isVisible()) {
      await revokeButton.click();
      await this.page.waitForTimeout(1000);

      // Confirm revocation
      const confirmButton = this.page.locator('[data-testid="confirm-revoke"], button:has-text("Confirm")');
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
        await this.page.waitForTimeout(1000);

        // Check for success message
        const successMessage = this.page.locator('[data-testid="revoke-success"], .success-message');
        if (await successMessage.isVisible()) {
          // Verify URL is no longer accessible
          try {
            await this.page.goto(shareUrl);
            await this.page.waitForTimeout(2000);
            
            const accessDenied = this.page.locator('[data-testid="access-denied"], .error-404, .not-found');
            return await accessDenied.isVisible({ timeout: 3000 });
          } catch {
            return false;
          }
        }
      }
    }
    return false;
  }

  /**
   * Common pattern: Check share analytics
   */
  async getShareAnalytics(): Promise<{ views?: number; shares?: number } | null> {
    const analyticsSection = this.page.locator('[data-testid="share-analytics"], .analytics-section');
    if (await analyticsSection.isVisible({ timeout: 3000 })) {
      const result: { views?: number; shares?: number } = {};

      const viewCount = analyticsSection.locator('[data-testid="view-count"], .view-count');
      if (await viewCount.isVisible()) {
        const countText = await viewCount.textContent();
        const views = parseInt(countText?.match(/\d+/)?.[0] || '0');
        result.views = views;
      }

      const shareCount = analyticsSection.locator('[data-testid="share-count"], .share-count');
      if (await shareCount.isVisible()) {
        const countText = await shareCount.textContent();
        const shares = parseInt(countText?.match(/\d+/)?.[0] || '0');
        result.shares = shares;
      }

      return result;
    }
    return null;
  }
}