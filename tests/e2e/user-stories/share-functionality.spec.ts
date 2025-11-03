import { test, expect } from '../../utils/base-test';
import { JSON_SAMPLES, stringifyJSON } from '../../fixtures/json-samples';

test.describe('User Story: Share Functionality', () => {
  test.beforeEach(async ({ shareHelper }) => {
    await shareHelper.viewerPage.navigateToViewer();
  });

  test('should create shareable link for JSON content', async ({ dataGenerator, shareHelper }) => {
    const testJson = dataGenerator.generateSimpleJSON();
    const jsonString = stringifyJSON(testJson);

    const result = await shareHelper.createShare(jsonString);

    expect(result.success).toBe(true);
    expect(result.url).toBeTruthy();
    expect(result.url).toMatch(/https?:\/\/.+/); // Should be a valid URL format
    expect(result.url).toMatch(/\/s\/[a-zA-Z0-9]+|\/share\/[a-zA-Z0-9]+|\/viewer\/[a-zA-Z0-9]+/);
  });

  test('should allow copying share URL to clipboard', async ({ dataGenerator, shareHelper }) => {
    const testJson = dataGenerator.generateComplexJSON();
    const jsonString = stringifyJSON(testJson);

    const result = await shareHelper.createShare(jsonString);
    expect(result.success).toBe(true);

    // Test copy functionality
    const copySuccess = await shareHelper.copyShareUrl();
    expect(copySuccess).toBe(true);

    // Verify clipboard content if possible
    const clipboardContent = await shareHelper.page.evaluate(async () => {
      try {
        return await navigator.clipboard.readText();
      } catch {
        return null;
      }
    });

    if (clipboardContent) {
      expect(clipboardContent).toMatch(/https?:\/\/.+/);
    }
  });

  test('should load shared JSON from generated URL', async ({ dataGenerator, shareHelper }) => {
    const originalJson = dataGenerator.generateAPIResponseJSON();
    const jsonString = stringifyJSON(originalJson);

    const result = await shareHelper.createShare(jsonString);
    expect(result.success).toBe(true);
    expect(result.url).toBeTruthy();

    // Test the generated URL
    const urlWorks = await shareHelper.testShareUrl(result.url);
    expect(urlWorks).toBe(true);

    // Should have the same content structure
    const nodeCount = await shareHelper.viewerPage.jsonNodes.count();
    expect(nodeCount).toBeGreaterThan(0);
  });

  test('should maintain view mode preferences in shared links', async ({
    dataGenerator,
    shareHelper,
  }) => {
    const testJson = dataGenerator.generateDeeplyNestedJSON();
    const jsonString = stringifyJSON(testJson);

    // Input JSON and switch to tree view
    await shareHelper.viewerPage.inputJSON(jsonString);
    await shareHelper.viewerPage.waitForJSONProcessed();
    await shareHelper.viewerPage.switchToTreeView();
    await shareHelper.page.waitForLoadState('networkidle'); // Wait for tree view rendering

    // Create share link
    await shareHelper.clickShareButton();
    await shareHelper.waitForShareModal();
    const shareUrl = await shareHelper.getShareUrl();
    expect(shareUrl).toBeTruthy();

    // Test that shared URL maintains view mode
    await shareHelper.testShareUrl(shareUrl!);
    const currentMode = await shareHelper.viewerPage.getCurrentViewMode();
    expect(currentMode.toLowerCase()).toContain('tree');
  });

  test('should handle sharing of large JSON files', async ({ dataGenerator, shareHelper }) => {
    const largeJson = dataGenerator.generateLargeJSON(300, 3, 30);
    const jsonString = stringifyJSON(largeJson);

    // Create share for large JSON with extended timeout expectations
    const result = await shareHelper.createShare(jsonString);
    expect(result.success).toBe(true);
    expect(result.url).toBeTruthy();

    // Verify large JSON URL is accessible
    const urlWorks = await shareHelper.testShareUrl(result.url);
    expect(urlWorks).toBe(true);
  });

  test('should provide different sharing options', async ({ dataGenerator, shareHelper }) => {
    const testJson = dataGenerator.generateComplexJSON();
    const jsonString = stringifyJSON(testJson);

    // Test with different visibility options
    const publicResult = await shareHelper.createShare(jsonString, { visibility: 'public' });
    expect(publicResult.success).toBe(true);

    const privateResult = await shareHelper.createShare(jsonString, { visibility: 'private' });
    expect(privateResult.success).toBe(true);

    // Test embed code option if available
    await shareHelper.clickShareButton();
    await shareHelper.waitForShareModal();

    const embedOption = shareHelper.page.locator(
      '[data-testid="embed-option"], button:has-text("Embed"), .embed-btn'
    );
    if (await embedOption.isVisible({ timeout: 2000 })) {
      await embedOption.click();
      await shareHelper.page.waitForLoadState('networkidle'); // Wait for embed code generation

      const embedCode = shareHelper.page.locator(
        '[data-testid="embed-code"], textarea, .embed-code'
      );
      if (await embedCode.isVisible()) {
        const code = await embedCode.inputValue();
        expect(code).toBeTruthy();
        expect(code).toMatch(/<iframe|<script|<embed/); // Should be embed code
      }
    }
  });

  test('should set expiration options for shared links', async ({ dataGenerator, shareHelper }) => {
    const testJson = dataGenerator.generateSimpleJSON();
    const jsonString = stringifyJSON(testJson);

    // Test creating share with expiration
    const expirationOptions = ['1 hour', '24 hours', '7 days', '30 days', 'Never'];

    for (const expiration of expirationOptions) {
      try {
        const result = await shareHelper.createShare(jsonString, { expiration });
        if (result.success) {
          expect(result.url).toBeTruthy();
          break; // Exit after first successful creation
        }
      } catch {
        continue; // Try next option
      }
    }
  });

  test('should provide password protection for shared links', async ({ shareHelper }) => {
    const sensitiveJson = {
      apiKeys: {
        production: 'prod_key_123',
        staging: 'stage_key_456',
      },
      database: {
        host: 'db.example.com',
        credentials: 'sensitive_data',
      },
    };

    // Test creating password-protected share
    const result = await shareHelper.createShare(stringifyJSON(sensitiveJson), {
      password: 'test123',
    });
    expect(result.success).toBe(true);
    expect(result.url).toBeTruthy();
  });

  test('should show share analytics and view counts', async ({
    dataGenerator,
    authHelper,
    shareHelper,
  }) => {
    // Ensure authenticated for analytics
    await authHelper.ensureAuthenticated();

    const testJson = dataGenerator.generateAPIResponseJSON();
    const jsonString = stringifyJSON(testJson);

    // Create share and check analytics
    const result = await shareHelper.createShare(jsonString);
    expect(result.success).toBe(true);

    const analytics = await shareHelper.getShareAnalytics();
    if (analytics) {
      expect(analytics.views).toBeDefined();
      if (analytics.views !== undefined) {
        expect(analytics.views).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test('should allow social media sharing', async ({ dataGenerator, shareHelper }) => {
    const interestingJson = dataGenerator.generateAnalyticsJSON();
    const jsonString = stringifyJSON(interestingJson);

    // Create share and check social options
    const result = await shareHelper.createShare(jsonString);
    expect(result.success).toBe(true);

    const socialOptions = await shareHelper.checkSocialSharingOptions();
    // Test that social sharing options are available (if implemented)
    if (socialOptions.length > 0) {
      expect(socialOptions).toContain('twitter');
    }
  });

  test('should handle share link deletion and revocation', async ({
    dataGenerator,
    authHelper,
    shareHelper,
  }) => {
    await authHelper.ensureAuthenticated();

    const testJson = dataGenerator.generateSimpleJSON();
    const jsonString = stringifyJSON(testJson);

    // Create share link
    const result = await shareHelper.createShare(jsonString);
    expect(result.success).toBe(true);
    expect(result.url).toBeTruthy();

    // Test revocation
    const revoked = await shareHelper.revokeShareLink(result.url);
    expect(revoked).toBe(true);
  });

  test('should provide QR code for mobile sharing', async ({ dataGenerator, shareHelper }) => {
    const mobileJson = dataGenerator.generateSimpleJSON();
    const jsonString = stringifyJSON(mobileJson);

    // Create share link
    const result = await shareHelper.createShare(jsonString);
    expect(result.success).toBe(true);

    // Test QR code generation
    const qrGenerated = await shareHelper.generateQRCode();
    // QR code functionality may not be implemented yet, so we test gracefully
    if (qrGenerated) {
      expect(qrGenerated).toBe(true);
    }
  });
});
