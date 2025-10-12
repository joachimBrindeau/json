import { Page, BrowserContext } from '@playwright/test';
import { TEST_USERS } from '../fixtures/users';

export class AuthHelper {
  constructor(
    private page: Page,
    private context: BrowserContext
  ) {}

  /**
   * Login with test user credentials
   */
  async login(userType: keyof typeof TEST_USERS = 'regular') {
    const user = TEST_USERS[userType];

    // Navigate to homepage
    await this.page.goto('/');
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(2000); // Wait for React hydration

    try {
      // Look for sign in button with multiple selectors
      const signInButton = this.page.locator('[data-testid="sign-in-button"]');
      
      await signInButton.waitFor({ state: 'visible', timeout: 10000 });
      await signInButton.click();
      
      // Wait for login modal to appear with multiple possible selectors
      await this.page.waitForSelector(
        '[role="dialog"], .modal, [data-testid="login-modal"]',
        { timeout: 10000 }
      );
      
      // Wait a moment for modal to fully render
      await this.page.waitForTimeout(1000);

      // Fill in credentials with more robust selectors
      const emailField = this.page.locator('#email, [name="email"], input[type="email"]').first();
      const passwordField = this.page.locator('#password, [name="password"], input[type="password"]').first();
      
      await emailField.waitFor({ state: 'visible', timeout: 5000 });
      await emailField.fill(user.email);
      
      await passwordField.waitFor({ state: 'visible', timeout: 5000 });
      await passwordField.fill(user.password);
      
      // Wait for form to be ready
      await this.page.waitForTimeout(500);

      // Submit login form with multiple possible selectors
      const submitButton = this.page.locator(
        'button[type="submit"]:has-text("Sign In"), ' +
        'button[type="submit"]:has-text("Sign in"), ' +
        'button[type="submit"]:has-text("Login"), ' +
        'form button:has-text("Sign In"), ' +
        'form button:has-text("Login")'
      ).first();
      
      await submitButton.click();
      
      // Wait for successful login with multiple success indicators
      await Promise.race([
        this.page.waitForSelector('[data-testid="user-menu"]', { timeout: 15000 }),
        this.page.waitForFunction(() => {
          return !document.querySelector('[role="dialog"]:has(input[type="email"])');
        }, { timeout: 15000 })
      ]);
      
      // Additional wait for any post-login navigation or state updates
      await this.page.waitForTimeout(2000);
      
      // Ensure the user menu is actually visible and clickable
      await this.page.waitForSelector('[data-testid="user-menu"]', { state: 'visible', timeout: 10000 });
      
      // Wait for React state to fully update
      await this.page.waitForFunction(() => {
        const userMenu = document.querySelector('[data-testid="user-menu"]');
        const signInButton = document.querySelector('[data-testid="sign-in-button"]');
        return userMenu && !signInButton;
      }, { timeout: 10000 });
      
      console.log(`✅ Successfully logged in as ${user.email}`);
      
    } catch (error) {
      console.error(`❌ Login failed for ${user.email}:`, error.message);
      
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
      });

      if (!response.ok()) {
        throw new Error(`API Login failed: ${response.status()} - ${await response.text()}`);
      }

      // Check for successful authentication in response
      const responseText = await response.text();
      if (responseText.includes('CredentialsSignin') || responseText.includes('error')) {
        throw new Error(`Authentication failed: Invalid credentials`);
      }
      
      console.log(`✅ Successfully logged in via API as ${user.email}`);
      
      // Set a flag that we're logged in via API
      await this.page.evaluate((email) => {
        localStorage.setItem('test-logged-in-user', email);
      }, user.email);
      
    } catch (error) {
      console.error(`❌ API Login failed for ${user.email}:`, error.message);
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

      // Click the user dropdown menu with multiple possible selectors
      const userMenuButton = this.page.locator('[data-testid="user-menu"]');
      
      await userMenuButton.waitFor({ state: 'visible', timeout: 5000 });
      await userMenuButton.click();
      
      // Wait for dropdown to open
      await this.page.waitForTimeout(500);
      
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

      // Wait for logout to complete with multiple success indicators
      await Promise.race([
        this.page.waitForSelector('[data-testid="sign-in-button"]', { timeout: 10000 }),
        this.page.waitForFunction(() => {
          return !localStorage.getItem('test-logged-in-user');
        }, { timeout: 10000 })
      ]);
      
      // Clear any test login flags
      await this.page.evaluate(() => {
        localStorage.removeItem('test-logged-in-user');
      });
      
      console.log('✅ Successfully logged out');
      
    } catch (error) {
      console.error('❌ Logout failed:', error.message);
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
      const isLoggedIn = loggedInChecks.some(result => result.status === 'fulfilled');
      
      // Also check localStorage flag for API logins
      if (!isLoggedIn) {
        const hasTestLoginFlag = await this.page.evaluate(() => {
          return !!localStorage.getItem('test-logged-in-user');
        });
        return hasTestLoginFlag;
      }
      
      return isLoggedIn;
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
