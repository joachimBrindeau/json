import { Page, Locator } from '@playwright/test';
import { BasePage } from './base-page';

export class MainLayoutPage extends BasePage {
  // Header elements
  readonly logo: Locator;
  readonly navigationMenu: Locator;
  readonly loginButton: Locator;
  readonly userMenu: Locator;
  readonly themeToggle: Locator;

  // Main navigation links
  readonly homeLink: Locator;
  readonly viewerLink: Locator;
  readonly libraryLink: Locator;

  // User menu items
  readonly profileLink: Locator;
  readonly settingsLink: Locator;
  readonly logoutButton: Locator;

  // Content areas
  readonly mainContent: Locator;
  readonly sidebar: Locator;
  readonly footer: Locator;

  // Modals and overlays
  readonly loginModal: Locator;
  readonly signupModal: Locator;

  constructor(page: Page) {
    super(page);

    // Header elements
    this.logo = page
      .locator('[data-testid="logo-desktop"]:visible, [data-testid="logo-mobile"]:visible')
      .first();
    this.navigationMenu = page.locator('[data-testid="navigation-menu"]');
    this.loginButton = page.locator('[data-testid="sign-in-button"]');
    this.userMenu = page
      .locator('[data-testid="user-menu"]')
      .or(page.locator('[aria-label="User menu"]'));
    this.themeToggle = page
      .locator('[data-testid="theme-toggle"]')
      .or(page.locator('[aria-label*="theme"]'));

    // Navigation links (use first() to avoid strict mode violations from sidebar duplicates)
    this.homeLink = page
      .locator('[data-testid="nav-home"]')
      .or(page.locator('a[href="/"]'))
      .first();
    this.viewerLink = page
      .locator('[data-testid="nav-viewer"]')
      .or(page.locator('a[href*="/viewer"]'))
      .first();
    this.libraryLink = page
      .locator('[data-testid="nav-library"]')
      .or(page.locator('a[href*="/library"]'))
      .first();

    // User menu items
    this.profileLink = page
      .locator('[data-testid="profile-link"]')
      .or(page.locator('text="Profile"'));
    this.settingsLink = page
      .locator('[data-testid="settings-link"]')
      .or(page.locator('text="Settings"'));
    this.logoutButton = page
      .locator('[data-testid="logout-button"]')
      .or(page.locator('text="Sign Out"'));

    // Content areas
    this.mainContent = page.locator('main').or(page.locator('[data-testid="main-content"]'));
    this.sidebar = page.locator('aside').or(page.locator('[data-testid="sidebar"]'));
    this.footer = page.locator('footer').or(page.locator('[data-testid="footer"]'));

    // Modals
    this.loginModal = page
      .locator('[data-testid="login-modal"]')
      .or(page.locator('[role="dialog"]', { hasText: 'Sign In' }));
    this.signupModal = page
      .locator('[data-testid="signup-modal"]')
      .or(page.locator('[role="dialog"]', { hasText: 'Sign Up' }));
  }

  /**
   * Navigate to home page
   */
  async goHome() {
    await this.logo.click();
    await this.waitForNavigation();
  }

  /**
   * Navigate to JSON viewer (now homepage)
   */
  async goToViewer() {
    await this.homeLink.click();
    await this.waitForNavigation('/');
  }

  /**
   * Navigate to library
   */
  async goToLibrary() {
    await this.libraryLink.click();
    await this.waitForNavigation('/library');
  }

  /**
   * Open login modal
   */
  async openLoginModal() {
    await this.page.locator('[data-testid="sign-in-button"]').click();
    await this.page.waitForSelector('[role="dialog"]', { timeout: 10000 });
  }

  /**
   * Check if user is logged in
   */
  async isLoggedIn(): Promise<boolean> {
    try {
      const userMenu = this.page.locator('[data-testid="user-menu"]');
      const signInButton = this.page.locator('[data-testid="sign-in-button"]');

      // Wait briefly for either state to present without forcing networkidle
      await Promise.race([
        userMenu.waitFor({ state: 'visible', timeout: 10_000 }),
        signInButton.waitFor({ state: 'visible', timeout: 10_000 }),
        signInButton.waitFor({ state: 'hidden', timeout: 10_000 }),
      ]).catch(() => {});

      const userMenuVisible = await userMenu.isVisible().catch(() => false);
      const signInButtonVisible = await signInButton.isVisible().catch(() => false);
      return userMenuVisible && !signInButtonVisible;
    } catch (error) {
      console.log(`🔍 Error in isLoggedIn check: ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * Open user menu
   */
  async openUserMenu() {
    if (await this.isLoggedIn()) {
      // Dismiss any open modal overlay that could intercept pointer events before interacting with header
      try {
        // 1) Try to close any visible dialog via Escape or known cancel buttons
        const dialog = this.page.getByRole('dialog');
        const isDialogVisible = await dialog.isVisible().catch(() => false);
        if (isDialogVisible) {
          await this.page.keyboard.press('Escape').catch(() => {});
          await dialog.waitFor({ state: 'hidden', timeout: 2000 }).catch(() => {});
          await this.page
            .locator('[data-testid="share-cancel-button"], [data-testid="modal-close"]')
            .first()
            .click()
            .catch(() => {});
          await dialog.waitFor({ state: 'hidden', timeout: 2000 }).catch(() => {});
        }

        // 2) If an overlay is present (Radix/Shadcn), try clicking it to dismiss
        const overlay = this.page.locator(
          'div[data-state="open"][class*="fixed"][class*="inset-0"][class*="bg-black"]'
        );
        if (await overlay.isVisible().catch(() => false)) {
          await overlay.click({ trial: true }).catch(() => {});
          await overlay.click().catch(() => {});
          await overlay.waitFor({ state: 'detached', timeout: 2000 }).catch(() => {});
        }

        // 3) Final check: wait briefly for any overlay to disappear
        await this.page
          .waitForSelector('div[data-state="open"][class*="fixed"][class*="inset-0"]', {
            state: 'detached',
            timeout: 1000,
          })
          .catch(() => {});

        // 4) Last-resort: surgically remove overlays in test environment
        const stillBlocking = await this.page
          .locator('div[data-state="open"][class*="fixed"][class*="inset-0"]')
          .isVisible()
          .catch(() => false);
        if (stillBlocking) {
          await this.page
            .evaluate(() => {
              const candidates = Array.from(
                document.querySelectorAll('div[data-state="open"]')
              ) as HTMLElement[];
              for (const el of candidates) {
                const cls = el.getAttribute('class') || '';
                if (cls.includes('fixed') && cls.includes('inset-0')) {
                  el.remove();
                }
              }
            })
            .catch(() => {});
        }
      } catch {}

      // Click on the user dropdown in header
      await this.page.locator('[data-testid="user-menu"]').click();
    } else {
      throw new Error('User is not logged in');
    }
  }

  /**
   * Go to profile page
   */
  async goToProfile() {
    await this.openUserMenu();
    await this.page.locator('[role="menuitem"]:has-text("Profile & Settings")').click();
    await this.waitForNavigation('/profile');
  }

  /**
   * Logout current user
   */
  async logout() {
    await this.openUserMenu();
    await this.page.locator('[role="menuitem"]:has-text("Sign out")').click();
    await this.waitForCondition(async () => {
      return await this.page.locator('[data-testid="sign-in-button"]').isVisible();
    });
  }

  /**
   * Toggle theme (dark/light mode)
   */
  async toggleTheme() {
    const isDarkMode = await this.isDarkMode();
    await this.themeToggle.click();

    // Wait for theme to actually change
    await this.waitForCondition(async () => {
      return (await this.isDarkMode()) !== isDarkMode;
    });
  }

  /**
   * Check if dark mode is active
   */
  async isDarkMode(): Promise<boolean> {
    const htmlClass = await this.page.locator('html').getAttribute('class');
    return htmlClass?.includes('dark') || false;
  }

  /**
   * Get current page breadcrumbs if available
   */
  async getBreadcrumbs(): Promise<string[]> {
    const breadcrumbElements = await this.page
      .locator('[data-testid="breadcrumb"]')
      .or(this.page.locator('nav[aria-label="breadcrumb"] a, nav[aria-label="breadcrumb"] span'))
      .allTextContents();

    return breadcrumbElements.filter((text) => text.trim().length > 0);
  }

  /**
   * Search functionality if available
   */
  async search(query: string) {
    const searchInput = this.page
      .locator('[data-testid="search-input"]')
      .or(this.page.locator('input[type="search"]'));

    if (await searchInput.isVisible()) {
      await searchInput.fill(query);
      await this.page.keyboard.press('Enter');
      await this.waitForLoad();
    } else {
      throw new Error('Search functionality not available on this page');
    }
  }

  /**
   * Check for notification messages
   */
  async getNotifications(): Promise<string[]> {
    const notificationSelectors = [
      '[data-testid="notification"]',
      '[data-testid="toast"]',
      '.toast',
      '[role="alert"]',
      '.alert',
    ];

    const notifications = [];

    for (const selector of notificationSelectors) {
      const elements = await this.page.locator(selector).all();
      for (const element of elements) {
        if (await element.isVisible()) {
          const text = await element.textContent();
          if (text) {
            notifications.push(text.trim());
          }
        }
      }
    }

    return notifications;
  }

  /**
   * Wait for any notification to appear
   */
  async waitForNotification(expectedText?: string, timeout = 5000) {
    const selector = '[data-testid="notification"], [data-testid="toast"], .toast, [role="alert"]';
    await this.page.waitForSelector(selector, { timeout });

    if (expectedText) {
      await this.page.locator(selector, { hasText: expectedText }).waitFor({ state: 'visible' });
    }
  }

  /**
   * Close notifications/toasts
   */
  async closeNotifications() {
    const closeButtons = await this.page
      .locator(
        '[data-testid="close-notification"], [data-testid="close-toast"], .toast [aria-label="close"], .alert [aria-label="close"]'
      )
      .all();

    for (const button of closeButtons) {
      if (await button.isVisible()) {
        await button.click();
      }
    }
  }

  /**
   * Check responsive behavior by resizing viewport
   */
  async testResponsiveLayout() {
    const viewports = [
      { width: 375, height: 812, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1280, height: 720, name: 'desktop' },
    ];

    const results = [];

    for (const viewport of viewports) {
      await this.page.setViewportSize({ width: viewport.width, height: viewport.height });
      // Wait for responsive layout changes to complete
      await this.page.waitForLoadState('domcontentloaded');

      results.push({
        viewport: viewport.name,
        navigationVisible: await this.navigationMenu.isVisible(),
        sidebarVisible: await this.sidebar.isVisible().catch(() => false),
        logoVisible: await this.logo.isVisible(),
      });
    }

    return results;
  }
  /**
   * Navigate to the Public Library page
   */
  async navigateToPublicLibrary(): Promise<void> {
    await this.page.getByRole('link', { name: /public library/i }).click();
    await this.page.waitForURL('**/library');
  }

  /**
   * Navigate to the Developers section
   */
  async goToDevelopers(): Promise<void> {
    await this.page.getByRole('link', { name: /developers/i }).click();
    await this.page.waitForURL('**/developers');
  }

  /**
   * Navigate to the Dashboard
   */
  async goToDashboard(): Promise<void> {
    await this.page.getByRole('link', { name: /dashboard/i }).click();
    await this.page.waitForURL('**/dashboard');
  }

  /**
   * Navigate to the Moderation Dashboard (admin/moderator only)
   */
  async goToModerationDashboard(): Promise<void> {
    await this.page.getByRole('link', { name: /moderation/i }).click();
    await this.page.waitForURL('**/moderation');
  }

  /**
   * Navigate to Community Guidelines
   */
  async navigateToCommunityGuidelines(): Promise<void> {
    await this.page.getByRole('link', { name: /community guidelines/i }).click();
    await this.page.waitForURL('**/community/guidelines');
  }

  /**
   * Navigate to Help page
   */
  async goToHelp(): Promise<void> {
    await this.page.getByRole('link', { name: /help/i }).click();
    await this.page.waitForURL('**/help');
  }

  /**
   * Get the developers link locator
   */
  get developersLink(): Locator {
    return this.page.getByRole('link', { name: /developers/i });
  }

}
