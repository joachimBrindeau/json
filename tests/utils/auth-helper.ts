import { Page, BrowserContext, expect } from '@playwright/test';
import { TEST_USERS } from '../fixtures/users';

export class AuthHelper {
  constructor(
    private page: Page,
    private context: BrowserContext
  ) {}

  /**
   * Login with test user credentials
   * Uses UI-based login for proper NextAuth SessionProvider synchronization
   */
  async login(userType: keyof typeof TEST_USERS = 'regular') {
    const user = TEST_USERS[userType];

    try {
      // Navigate to homepage and wait for page to be fully loaded
      await this.page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });

      // Wait for NextAuth session check to complete by waiting for loading skeleton to disappear
      await this.page.waitForSelector('[data-testid="user-menu-loading"]', {
        state: 'hidden',
        timeout: 10000
      }).catch(() => {
        // Loading skeleton might not appear if session resolves very quickly
      });

      // Check if already logged in
      const userMenu = this.page.locator('[data-testid="user-menu"]');
      const signInButton = this.page.locator('[data-testid="sign-in-button"]');
      
      // Wait for either user menu or sign-in button to appear (one must be visible after loading)
      await Promise.race([
        userMenu.waitFor({ state: 'visible', timeout: 10000 }),
        signInButton.waitFor({ state: 'visible', timeout: 10000 })
      ]);

      const isAlreadyLoggedIn = await userMenu.isVisible();

      if (isAlreadyLoggedIn) {
        console.log(`ℹ️ User already logged in, skipping login`);
        return;
      }

      // Wait for the Sign in button to be visible and enabled
      // Increased timeout to account for slow React hydration in production
      await expect(signInButton).toBeVisible({ timeout: 30000 });
      await expect(signInButton).toBeEnabled({ timeout: 10000 });

      // Click the Sign in button to open login modal
      await signInButton.click();

      // Wait for login modal to appear with proper state check
      const modal = this.page.locator('[role="dialog"]');
      await expect(modal).toBeVisible({ timeout: 10000 });

      // Fill in credentials with explicit waits
      const emailInput = this.page.locator('#email');
      const passwordInput = this.page.locator('#password');

      await emailInput.waitFor({ state: 'visible', timeout: 5000 });
      await emailInput.fill(user.email);

      await passwordInput.waitFor({ state: 'visible', timeout: 5000 });
      await passwordInput.fill(user.password);

      // Submit the login form
      const submitButton = this.page.locator('button[type="submit"]').filter({ hasText: /sign in/i });
      await submitButton.waitFor({ state: 'visible', timeout: 5000 });
      await submitButton.click();

      // Wait for modal to close (indicates login processing)
      await modal.waitFor({ state: 'detached', timeout: 10000 }).catch(() => {
        console.log('⚠️ Modal still visible, but continuing...');
      });

      // NOTE: The login modal now uses updateSession() + router.refresh()
      // router.refresh() causes Next.js to revalidate server components
      // Wait for the page to stabilize by checking for main content
      await this.page.locator('main').waitFor({ state: 'attached', timeout: 10000 }).catch(() => {
        console.log('⚠️ Page content not stable, but continuing...');
      });

      // Wait for the user menu to appear (indicates successful session sync)
      // This should appear after both SessionProvider.update() and router.refresh() complete
      await userMenu.waitFor({ state: 'visible', timeout: 30000 });

      // Final verification that we're logged in
      const isLoggedIn = await this.page.evaluate(() => {
        const userMenu = document.querySelector('[data-testid="user-menu"]');
        const signInButton = document.querySelector('[data-testid="sign-in-button"]');
        return !!userMenu && !signInButton;
      });

      if (!isLoggedIn) {
        throw new Error('Login appeared to succeed but user menu is not visible');
      }

      console.log(`✅ Successfully logged in as ${user.email}`);

    } catch (error) {
      console.error(`❌ Login failed for ${user.email}:`, (error as Error).message);

      // Take screenshot for debugging
      await this.page.screenshot({
        path: `test-results/login-failure-${userType}-${Date.now()}.png`,
        fullPage: true
      });

      throw error;
    }
  }

  /**
   * Login without UI (direct API call for faster tests)
   */
  async loginAPI(userType: keyof typeof TEST_USERS = 'regular') {
    const user = TEST_USERS[userType];

    try {
      // Get CSRF token first
      const csrfToken = await this.getCSRFToken();

      // Make direct API call to NextAuth credentials endpoint
      // IMPORTANT: Set maxRedirects: 0 to prevent following the 302 redirect
      // Following the redirect causes timeout because homepage SSR takes 10+ seconds
      const response = await this.context.request.post('/api/auth/callback/credentials', {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        form: {
          email: user.email,
          password: user.password,
          redirect: 'false',
          callbackUrl: '/',
          csrfToken: csrfToken,
        },
        maxRedirects: 0, // Don't follow redirects - we only need the session cookie
      });

      // Check if we got a successful response (200 or 302)
      if (!response.ok() && response.status() !== 302) {
        throw new Error(`API Login failed: ${response.status()} - ${await response.text()}`);
      }

      // Check for session token in response headers/cookies
      const headers = response.headers();
      const cookies = await this.context.cookies();
      const sessionCookie = cookies.find(c => c.name === 'next-auth.session-token');

      if (!sessionCookie) {
        const responseText = await response.text();
        console.error(`❌ No session cookie found after login`);
        console.error(`Response status: ${response.status()}`);
        console.error(`Response text (first 500 chars): ${responseText.substring(0, 500)}`);
        throw new Error(`Authentication failed: No session cookie found`);
      }

      // IMPORTANT: Add the session cookie to the browser context
      // The API request context and browser page context have separate cookie storage
      // We need to explicitly transfer the cookie so the browser can use it
      await this.context.addCookies([sessionCookie]);

      console.log(`✅ Successfully logged in via API as ${user.email} (session cookie present and added to browser)`);

    } catch (error) {
      console.error(`❌ API Login failed for ${user.email}:`, (error as Error).message);
      throw error;
    }
  }

  /**
   * Get CSRF token for NextAuth
   */
  private async getCSRFToken(): Promise<string> {
    try {
      const response = await this.context.request.get('/api/auth/csrf');
      const data = await response.json();
      return data.csrfToken;
    } catch (error) {
      console.warn('Could not get CSRF token, proceeding without it');
      return '';
    }
  }

  /**
   * Logout current user
   */
  async logout() {
    try {
      // Check if user is actually logged in first
      if (!(await this.isLoggedIn())) {
        console.log('ℹ️ User is already logged out');
        return;
      }

      // Click the user dropdown menu
      const userMenuButton = this.page.locator('[data-testid="user-menu"]');

      await expect(userMenuButton).toBeVisible({ timeout: 15000 });
      await userMenuButton.click();

      // Wait for dropdown menu to be visible
      const dropdownMenu = this.page.locator('[role="menu"]');
      await expect(dropdownMenu).toBeVisible({ timeout: 15000 });
      
      // Click the Sign out option with multiple possible selectors
      const signOutButton = this.page.locator(
        '[role="menuitem"]:has-text("Sign out"), ' +
        '[role="menuitem"]:has-text("Sign Out"), ' +
        '[role="menuitem"]:has-text("Logout"), ' +
        'button:has-text("Sign out"), ' +
        'button:has-text("Sign Out"), ' +
        'button:has-text("Logout")'
      ).first();
      
      await signOutButton.waitFor({ state: 'visible', timeout: 5000 });
      await signOutButton.click();

      // Wait for logout to complete - sign in button should appear
      await this.page.waitForSelector('[data-testid="sign-in-button"]', { timeout: 10000 });
      
      console.log('✅ Successfully logged out');
      
    } catch (error) {
      console.error('❌ Logout failed:', (error as Error).message);
      throw error;
    }
  }

  /**
   * Create a new test user account
   */
  async createAccount(userData: { email: string; password: string; name?: string }) {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');

    // Click the Sign in button to open modal
    await this.page.locator('[data-testid="sign-in-button"]').click();
    
    // Wait for login modal to appear
    await this.page.waitForSelector('[role="dialog"]', { timeout: 10000 });

    // Click the "Need an account? Sign up" link to switch to signup mode
    await this.page.locator('button:has-text("Need an account? Sign up")').click();

    // Fill signup form using actual field IDs from login-modal.tsx
    if (userData.name) {
      await this.page.fill('#name', userData.name);
    }
    await this.page.fill('#email', userData.email);
    await this.page.fill('#password', userData.password);

    // Submit form - look for Create Account button
    await this.page.locator('button[type="submit"]:has-text("Create Account")').click();

    // Wait for account creation success - user should be logged in (user dropdown appears)
    await this.page.waitForSelector('[data-testid="user-menu"]', { timeout: 15000 });
  }

  /**
   * Check if user is currently logged in
   */
  async isLoggedIn(): Promise<boolean> {
    try {
      // Multiple ways to check if user is logged in
      const loggedInChecks = await Promise.allSettled([
        // Check for user menu
        this.page.waitForSelector('[data-testid="user-menu"]', { timeout: 2000 }),
        // Check for absence of sign in button
        this.page.waitForSelector('[data-testid="sign-in-button"]', { state: 'hidden', timeout: 2000 })
      ]);
      
      // If any check succeeded, user is logged in
      return loggedInChecks.some(result => result.status === 'fulfilled');
    } catch (error) {
      return false;
    }
  }

  /**
   * Get current user info from UI
   */
  async getCurrentUser() {
    if (!(await this.isLoggedIn())) {
      return null;
    }

    try {
      // Click on user dropdown to reveal user info (in sidebar)
      const userDropdown = this.page.locator('button:has-text("Sign out")').first();
      await userDropdown.click();

      // Extract user info from the dropdown content
      const userInfo = await this.page.evaluate(() => {
        // Look for user email and name in the dropdown
        const userElements = document.querySelectorAll('[class*="text-xs text-muted-foreground"], [class*="font-medium"]');
        let email = null;
        let name = null;
        
        for (const element of userElements) {
          const text = element.textContent?.trim();
          if (text && text.includes('@')) {
            email = text;
          } else if (text && !text.includes('@') && text !== 'Sign out' && text !== 'Profile & Settings') {
            name = text;
          }
        }

        return { email, name };
      });

      // Close dropdown by pressing escape
      await this.page.keyboard.press('Escape');

      return userInfo;
    } catch (error) {
      console.warn('Could not extract user info:', error);
      return { email: null, name: null };
    }
  }
}
