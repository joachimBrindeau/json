import { Page, Locator, expect } from '@playwright/test';

export abstract class BasePage {
  public page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Wait for the page to be fully loaded
   */
  async waitForLoad() {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Get the current URL
   */
  async getCurrentURL(): Promise<string> {
    return this.page.url();
  }

  /**
   * Navigate to a specific URL
   */
  async navigateTo(url: string) {
    await this.page.goto(url);
    await this.waitForLoad();
  }

  /**
   * Take a screenshot of the current page
   */
  async takeScreenshot(filename?: string) {
    const screenshotPath = filename
      ? `test-results/screenshots/${filename}.png`
      : `test-results/screenshots/${this.constructor.name}-${Date.now()}.png`;

    await this.page.screenshot({ path: screenshotPath, fullPage: true });
    return screenshotPath;
  }

  /**
   * Wait for an element to be visible
   */
  async waitForSelector(selector: string, timeout = 10000): Promise<Locator> {
    await this.page.waitForSelector(selector, { timeout });
    return this.page.locator(selector);
  }

  /**
   * Check if element exists and is visible
   */
  async isVisible(selector: string): Promise<boolean> {
    try {
      await this.page.waitForSelector(selector, { timeout: 2000 });
      return await this.page.locator(selector).isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Scroll to an element
   */
  async scrollToElement(selector: string) {
    await this.page.locator(selector).scrollIntoViewIfNeeded();
  }

  /**
   * Wait for a specific condition
   */
  async waitForCondition(condition: () => Promise<boolean>, timeout = 10000, interval = 100) {
    const start = Date.now();

    while (Date.now() - start < timeout) {
      if (await condition()) {
        return;
      }
      await this.page.waitForTimeout(interval);
    }

    throw new Error(`Condition not met within ${timeout}ms`);
  }

  /**
   * Get element text content
   */
  async getTextContent(selector: string): Promise<string> {
    const element = await this.waitForSelector(selector);
    return (await element.textContent()) || '';
  }

  /**
   * Click element with retry logic
   */
  async clickWithRetry(selector: string, maxRetries = 3) {
    let lastError;

    for (let i = 0; i < maxRetries; i++) {
      try {
        await this.page.locator(selector).click();
        return;
      } catch (error) {
        lastError = error;
        await this.page.waitForTimeout(1000);
      }
    }

    throw lastError;
  }

  /**
   * Fill input field with validation
   */
  async fillAndValidate(selector: string, value: string) {
    const input = this.page.locator(selector);
    await input.fill(value);

    // Validate the value was set correctly
    const actualValue = await input.inputValue();
    expect(actualValue).toBe(value);
  }

  /**
   * Wait for navigation to complete
   */
  async waitForNavigation(urlPattern?: string | RegExp) {
    if (urlPattern) {
      await this.page.waitForURL(urlPattern);
    } else {
      await this.page.waitForLoadState('networkidle');
    }
  }

  /**
   * Get all visible elements matching selector
   */
  async getAllVisible(selector: string): Promise<Locator[]> {
    await this.page.waitForSelector(selector, { timeout: 5000 });
    const elements = await this.page.locator(selector).all();

    const visibleElements = [];
    for (const element of elements) {
      if (await element.isVisible()) {
        visibleElements.push(element);
      }
    }

    return visibleElements;
  }

  /**
   * Hover over element
   */
  async hoverElement(selector: string) {
    await this.page.locator(selector).hover();
  }

  /**
   * Double click element
   */
  async doubleClickElement(selector: string) {
    await this.page.locator(selector).dblclick();
  }

  /**
   * Press keyboard key
   */
  async pressKey(key: string) {
    await this.page.keyboard.press(key);
  }

  /**
   * Get element attribute value
   */
  async getAttribute(selector: string, attribute: string): Promise<string | null> {
    return await this.page.locator(selector).getAttribute(attribute);
  }

  /**
   * Check if element is enabled
   */
  async isEnabled(selector: string): Promise<boolean> {
    return await this.page.locator(selector).isEnabled();
  }

  /**
   * Check if checkbox/radio is checked
   */
  async isChecked(selector: string): Promise<boolean> {
    return await this.page.locator(selector).isChecked();
  }

  /**
   * Select option from dropdown
   */
  async selectOption(selector: string, value: string) {
    await this.page.locator(selector).selectOption(value);
  }

  /**
   * Upload file to input element
   */
  async uploadFile(selector: string, filePath: string) {
    await this.page.locator(selector).setInputFiles(filePath);
  }

  /**
   * Clear input field
   */
  async clearInput(selector: string) {
    await this.page.locator(selector).clear();
  }

  /**
   * Get page title
   */
  async getPageTitle(): Promise<string> {
    return await this.page.title();
  }

  /**
   * Refresh the page
   */
  async refresh() {
    await this.page.reload();
    await this.waitForLoad();
  }

  /**
   * Go back in browser history
   */
  async goBack() {
    await this.page.goBack();
    await this.waitForLoad();
  }

  /**
   * Go forward in browser history
   */
  async goForward() {
    await this.page.goForward();
    await this.waitForLoad();
  }
}
