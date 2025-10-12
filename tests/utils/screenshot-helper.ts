import { Page } from '@playwright/test';
import { join } from 'path';

export class ScreenshotHelper {
  constructor(private page: Page) {}

  /**
   * Take a full page screenshot
   */
  async captureFullPage(filename: string) {
    await this.page.screenshot({
      path: join(process.cwd(), 'test-results', 'screenshots', `${filename}.png`),
      fullPage: true,
    });
  }

  /**
   * Take a screenshot of a specific element
   */
  async captureElement(selector: string, filename: string) {
    const element = await this.page.locator(selector);
    await element.screenshot({
      path: join(process.cwd(), 'test-results', 'screenshots', `${filename}.png`),
    });
  }

  /**
   * Take a screenshot of the JSON viewer area
   */
  async captureJsonViewer(filename: string) {
    await this.captureElement('[data-testid="json-viewer"]', filename).catch(() => {
      // Fallback to main content area
      this.captureElement('main', filename);
    });
  }

  /**
   * Take before/after comparison screenshots
   */
  async captureComparison(
    beforeAction: () => Promise<void>,
    afterAction: () => Promise<void>,
    baseFilename: string
  ) {
    // Take before screenshot
    await this.captureFullPage(`${baseFilename}-before`);

    // Perform action
    await beforeAction();

    // Wait for any animations/transitions
    await this.page.waitForTimeout(500);

    // Take after screenshot
    await this.captureFullPage(`${baseFilename}-after`);

    // Perform second action if provided
    if (afterAction) {
      await afterAction();
      await this.page.waitForTimeout(500);
      await this.captureFullPage(`${baseFilename}-final`);
    }
  }

  /**
   * Capture mobile viewport screenshot
   */
  async captureMobile(filename: string) {
    await this.page.setViewportSize({ width: 375, height: 812 });
    await this.page.waitForTimeout(500); // Wait for responsive adjustments
    await this.captureFullPage(`${filename}-mobile`);
  }

  /**
   * Capture tablet viewport screenshot
   */
  async captureTablet(filename: string) {
    await this.page.setViewportSize({ width: 768, height: 1024 });
    await this.page.waitForTimeout(500);
    await this.captureFullPage(`${filename}-tablet`);
  }

  /**
   * Capture desktop viewport screenshot
   */
  async captureDesktop(filename: string) {
    await this.page.setViewportSize({ width: 1280, height: 720 });
    await this.page.waitForTimeout(500);
    await this.captureFullPage(`${filename}-desktop`);
  }

  /**
   * Capture responsive screenshots across multiple viewports
   */
  async captureResponsive(baseFilename: string) {
    await this.captureMobile(baseFilename);
    await this.captureTablet(baseFilename);
    await this.captureDesktop(baseFilename);
  }

  /**
   * Capture screenshot with custom viewport
   */
  async captureViewport(width: number, height: number, filename: string) {
    await this.page.setViewportSize({ width, height });
    await this.page.waitForTimeout(500);
    await this.captureFullPage(`${filename}-${width}x${height}`);
  }

  /**
   * Capture screenshot with element highlight
   */
  async captureWithHighlight(selector: string, filename: string) {
    // Add highlight style
    await this.page.addStyleTag({
      content: `
        .pw-highlight {
          outline: 3px solid red !important;
          outline-offset: 2px !important;
          background-color: rgba(255, 0, 0, 0.1) !important;
        }
      `,
    });

    // Apply highlight to element
    await this.page.evaluate((sel) => {
      const element = document.querySelector(sel);
      if (element) {
        element.classList.add('pw-highlight');
      }
    }, selector);

    // Take screenshot
    await this.captureFullPage(filename);

    // Remove highlight
    await this.page.evaluate((sel) => {
      const element = document.querySelector(sel);
      if (element) {
        element.classList.remove('pw-highlight');
      }
    }, selector);
  }

  /**
   * Capture animated GIF-like sequence
   */
  async captureSequence(actions: (() => Promise<void>)[], baseFilename: string, stepDelay = 1000) {
    for (let i = 0; i < actions.length; i++) {
      await actions[i]();
      await this.page.waitForTimeout(stepDelay);
      await this.captureFullPage(`${baseFilename}-step-${i + 1}`);
    }
  }

  /**
   * Wait for animations and take stable screenshot
   */
  async captureStable(filename: string, waitTime = 2000) {
    // Wait for animations to complete
    await this.page.waitForTimeout(waitTime);

    // Wait for network idle
    await this.page.waitForLoadState('networkidle');

    // Take screenshot
    await this.captureFullPage(filename);
  }

  /**
   * Create screenshots directory if it doesn't exist
   */
  async ensureScreenshotDir() {
    const { mkdirSync } = await import('fs');
    const screenshotDir = join(process.cwd(), 'test-results', 'screenshots');

    try {
      mkdirSync(screenshotDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
      if ((error as { code?: string }).code !== 'EEXIST') {
        throw error;
      }
    }
  }
}
