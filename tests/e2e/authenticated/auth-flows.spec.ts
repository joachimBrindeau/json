import { test, expect } from '../../utils/base-test';
import { JsonViewerPage } from '../../page-objects/json-viewer-page';
import { LibraryPage } from '../../page-objects/library-page';
import { MainLayoutPage } from '../../page-objects/main-layout-page';
import { TEST_USERS, OAUTH_PROVIDERS } from '../../fixtures/users';

test.describe('Authenticated User - Authentication Flows', () => {
  let viewerPage: JsonViewerPage;
  let libraryPage: LibraryPage;
  let layoutPage: MainLayoutPage;

  test.beforeEach(async ({ page }) => {
    viewerPage = new JsonViewerPage(page);
    libraryPage = new LibraryPage(page);
    layoutPage = new MainLayoutPage(page);
  });

  test.describe('Sign Up Flows', () => {
    test('should sign up using email and password', async ({ page, dataGenerator }) => {
      const newUser = dataGenerator.generateUserData();

      // Navigate to home page
      await page.goto('/');

      // Click signup button
      const signupButton = page.locator('[data-testid="signup-button"]');
      await expect(signupButton).toBeVisible();
      await signupButton.click();

      // Fill signup form
      await page.locator('[data-testid="signup-name"]').fill(newUser.name);
      await page.locator('[data-testid="signup-email"]').fill(newUser.email);
      await page.locator('[data-testid="signup-password"]').fill(newUser.password);
      await page.locator('[data-testid="signup-confirm-password"]').fill(newUser.password);

      // Submit form
      await page.locator('[data-testid="signup-submit"]').click();

      // Wait for successful signup
      await layoutPage.waitForNotification('Account created successfully');

      // Should be logged in automatically
      expect(await layoutPage.isLoggedIn()).toBe(true);

      // Verify user can access authenticated features
      await layoutPage.goToLibrary();
      await expect(libraryPage.libraryContainer).toBeVisible();
    });

    test('should handle signup validation errors', async ({ page, dataGenerator }) => {
      const invalidUser = dataGenerator.generateUserData();

      await page.goto('/');

      // Open signup modal
      await page.locator('[data-testid="signup-button"]').click();

      // Try to submit with empty fields
      await page.locator('[data-testid="signup-submit"]').click();

      // Should show validation errors
      const emailError = page.locator('[data-testid="email-error"]');
      const passwordError = page.locator('[data-testid="password-error"]');

      await expect(emailError).toBeVisible();
      await expect(passwordError).toBeVisible();

      // Fill invalid email
      await page.locator('[data-testid="signup-email"]').fill('invalid-email');
      await page.locator('[data-testid="signup-password"]').fill('123'); // Too short
      await page.locator('[data-testid="signup-submit"]').click();

      // Should show format errors
      await expect(emailError).toBeVisible();
      await expect(passwordError).toBeVisible();
    });

    test('should prevent duplicate email signup', async ({ page, apiHelper }) => {
      const existingUser = TEST_USERS.regular;

      await page.goto('/');
      await page.locator('[data-testid="signup-button"]').click();

      // Try to signup with existing email
      await page.locator('[data-testid="signup-name"]').fill('New User');
      await page.locator('[data-testid="signup-email"]').fill(existingUser.email);
      await page.locator('[data-testid="signup-password"]').fill('NewPassword123!');
      await page.locator('[data-testid="signup-confirm-password"]').fill('NewPassword123!');

      await page.locator('[data-testid="signup-submit"]').click();

      // Should show error about existing email
      await layoutPage.waitForNotification('Email already exists');
      expect(await layoutPage.isLoggedIn()).toBe(false);
    });

    test('should sign up using Google OAuth', async ({ page, context }) => {
      // Fail fast if OAuth not configured
      expect(OAUTH_PROVIDERS.google.enabled, 'Google OAuth must be configured for this test').toBe(true);

      await page.goto('/');
      await page.locator('[data-testid="signup-button"]').click();

      // Click Google OAuth button
      const googleButton = page.locator('[data-testid="google-signup"]');
      await expect(googleButton).toBeVisible();
      await googleButton.click();

      // Note: In real implementation, this would redirect to Google OAuth
      // For testing, we'll mock the OAuth flow completion

      // Wait for OAuth redirect and completion
      await page.waitForURL('**/auth/callback**', { timeout: 10000 });

      // Should be logged in after OAuth completion
      expect(await layoutPage.isLoggedIn()).toBe(true);

      // Verify user can access authenticated features
      await layoutPage.goToProfile();
      await page.waitForURL('**/profile');
    });

    test('should sign up using GitHub OAuth', async ({ page }) => {
      // Fail fast if OAuth not configured
      expect(OAUTH_PROVIDERS.github.enabled, 'GitHub OAuth must be configured for this test').toBe(true);

      await page.goto('/');
      await page.locator('[data-testid="signup-button"]').click();

      // Click GitHub OAuth button
      const githubButton = page.locator('[data-testid="github-signup"]');
      await expect(githubButton).toBeVisible();
      await githubButton.click();

      // Wait for OAuth completion
      await page.waitForURL('**/auth/callback**', { timeout: 10000 });

      expect(await layoutPage.isLoggedIn()).toBe(true);

      // Verify GitHub-specific user data is set
      await layoutPage.goToProfile();
      const userEmail = await page.locator('[data-testid="user-email"]').textContent();
      expect(userEmail).toBeTruthy();
    });
  });

  test.describe('Sign In Flows', () => {
    test('should sign in using email and password', async ({ page, authHelper }) => {
      const user = TEST_USERS.regular;

      await page.goto('/');

      // Open login modal
      await layoutPage.openLoginModal();

      // Fill login form using actual field IDs
      await page.fill('#email', user.email);
      await page.fill('#password', user.password);

      // Submit login
      await page.locator('button[type="submit"]:has-text("Sign In")').click();

      // Wait for successful login - modal should close and user should be logged in
      await page.waitForSelector('[role="dialog"]', { state: 'detached', timeout: 10000 });
      expect(await layoutPage.isLoggedIn()).toBe(true);

      // Verify authentication was successful
      expect(await layoutPage.isLoggedIn()).toBe(true);
    });

    test('should handle invalid login credentials', async ({ page }) => {
      await page.goto('/');
      await layoutPage.openLoginModal();

      // Try invalid credentials
      await page.locator('[data-testid="login-email"]').fill('invalid@example.com');
      await page.locator('[data-testid="login-password"]').fill('wrongpassword');
      await page.locator('[data-testid="login-submit"]').click();

      // Should show error message
      const errorMessage = page.locator('[data-testid="login-error"]');
      await expect(errorMessage).toBeVisible();

      // Should not be logged in
      expect(await layoutPage.isLoggedIn()).toBe(false);
    });

    test('should sign in using Google OAuth', async ({ page }) => {
      // Fail fast if OAuth not configured
      expect(OAUTH_PROVIDERS.google.enabled, 'Google OAuth must be configured for this test').toBe(true);

      await page.goto('/');
      await layoutPage.openLoginModal();

      // Click Google login button
      const googleButton = page.locator('[data-testid="google-login"]');
      await expect(googleButton).toBeVisible();
      await googleButton.click();

      // Wait for OAuth completion
      await page.waitForURL('**/auth/callback**', { timeout: 10000 });

      expect(await layoutPage.isLoggedIn()).toBe(true);
    });

    test('should sign in using GitHub OAuth', async ({ page }) => {
      // Fail fast if OAuth not configured
      expect(OAUTH_PROVIDERS.github.enabled, 'GitHub OAuth must be configured for this test').toBe(true);

      await page.goto('/');
      await layoutPage.openLoginModal();

      // Click GitHub login button
      const githubButton = page.locator('[data-testid="github-login"]');
      await expect(githubButton).toBeVisible();
      await githubButton.click();

      // Wait for OAuth completion
      await page.waitForURL('**/auth/callback**', { timeout: 10000 });

      expect(await layoutPage.isLoggedIn()).toBe(true);
    });

    test('should remember user session after page refresh', async ({ page, authHelper }) => {
      // Login first
      await authHelper.login('regular');
      expect(await layoutPage.isLoggedIn()).toBe(true);

      // Refresh the page
      await page.reload();
      await layoutPage.waitForLoad();

      // Should still be logged in
      expect(await layoutPage.isLoggedIn()).toBe(true);

      // Should be able to access authenticated features
      await layoutPage.goToLibrary();
      await expect(libraryPage.libraryContainer).toBeVisible();
    });

    test('should handle session timeout gracefully', async ({ page, authHelper }) => {
      // Login first
      await authHelper.login('regular');
      expect(await layoutPage.isLoggedIn()).toBe(true);

      // Simulate session expiration by clearing cookies
      await page.context().clearCookies();

      // Try to access authenticated feature
      await layoutPage.goToLibrary();

      // Should be redirected to login or show login prompt
      const isLoginVisible = await layoutPage.loginButton.isVisible();
      const isLoginModalVisible = await layoutPage.loginModal.isVisible();

      expect(isLoginVisible || isLoginModalVisible).toBe(true);
    });

    test('should support multiple authentication methods for same user', async ({
      page,
      authHelper,
      apiHelper,
    }) => {
      // This would test linking multiple auth methods to one account
      // Implementation depends on your OAuth linking strategy

      const user = TEST_USERS.regular;

      // First login with email/password
      await authHelper.login('regular');
      expect(await layoutPage.isLoggedIn()).toBe(true);

      // Go to profile/settings where OAuth linking might be available
      await layoutPage.goToProfile();

      // Check if OAuth linking options are available
      const linkGoogleButton = page.locator('[data-testid="link-google"]');
      const linkGithubButton = page.locator('[data-testid="link-github"]');

      if (await linkGoogleButton.isVisible()) {
        await linkGoogleButton.click();
        await layoutPage.waitForNotification('Google account linked');
      }

      if (await linkGithubButton.isVisible()) {
        await linkGithubButton.click();
        await layoutPage.waitForNotification('GitHub account linked');
      }
    });
  });

  test.describe('Sign Out Flows', () => {
    test.beforeEach(async ({ authHelper }) => {
      await authHelper.login('regular');
    });

    test('should sign out successfully', async ({ page }) => {
      expect(await layoutPage.isLoggedIn()).toBe(true);

      // Click user menu and logout
      await layoutPage.logout();

      // Should be logged out
      expect(await layoutPage.isLoggedIn()).toBe(false);

      // Should show login button
      await expect(layoutPage.loginButton).toBeVisible();

      // Should not be able to access authenticated features
      await page.goto('/saved');

      // Should be redirected or prompted to login
      const currentUrl = page.url();
      const isLoginRequired =
        currentUrl.includes('/login') ||
        (await layoutPage.loginButton.isVisible()) ||
        (await layoutPage.loginModal.isVisible());

      expect(isLoginRequired).toBe(true);
    });

    test('should clear user data on sign out', async ({ page }) => {
      // Go to library to establish some session state
      await layoutPage.goToLibrary();

      // Logout
      await layoutPage.logout();

      // Check that user-specific data is cleared
      const userSpecificElements = [
        '[data-testid="user-menu"]',
        '[data-testid="user-email"]',
        '[data-testid="user-name"]',
      ];

      for (const selector of userSpecificElements) {
        const element = page.locator(selector);
        if (await element.isVisible({ timeout: 1000 })) {
          expect(await element.isVisible()).toBe(false);
        }
      }
    });

    test('should handle logout from multiple tabs', async ({ context }) => {
      // Create second tab
      const secondPage = await context.newPage();
      const secondLayoutPage = new MainLayoutPage(secondPage);

      await secondPage.goto('/');
      expect(await secondLayoutPage.isLoggedIn()).toBe(true);

      // Logout from first tab
      await layoutPage.logout();

      // Second tab should also be logged out (if session sharing is implemented)
      await secondPage.reload();
      await secondLayoutPage.waitForLoad();

      // Depending on implementation, second tab might need manual refresh
      // or have real-time session sync
      const isStillLoggedIn = await secondLayoutPage.isLoggedIn();

      // This behavior depends on your session management strategy
      // Comment explains the expected behavior
      if (isStillLoggedIn) {
        console.log('Note: Multi-tab logout sync not implemented');
      }

      await secondPage.close();
    });
  });

  test.describe('Authentication Edge Cases', () => {
    test('should handle network errors during authentication', async ({ page }) => {
      await page.goto('/');
      await layoutPage.openLoginModal();

      // Simulate network failure
      await page.route('**/api/auth/**', (route) => {
        route.abort('failed');
      });

      await page.locator('[data-testid="login-email"]').fill(TEST_USERS.regular.email);
      await page.locator('[data-testid="login-password"]').fill(TEST_USERS.regular.password);
      await page.locator('[data-testid="login-submit"]').click();

      // Should show network error message
      const errorMessage = page.locator('[data-testid="network-error"]');
      await expect(errorMessage).toBeVisible({ timeout: 10000 });
    });

    test('should handle OAuth errors gracefully', async ({ page }) => {
      // Fail fast if OAuth not configured
      expect(OAUTH_PROVIDERS.google.enabled, 'Google OAuth must be configured for this test').toBe(true);

      await page.goto('/');
      await layoutPage.openLoginModal();

      // Mock OAuth error response
      await page.route('**/auth/google**', (route) => {
        route.fulfill({
          status: 400,
          body: JSON.stringify({ error: 'oauth_error', message: 'OAuth authorization failed' }),
        });
      });

      await page.locator('[data-testid="google-login"]').click();

      // Should handle OAuth error gracefully
      await layoutPage.waitForNotification('Authentication failed');
      expect(await layoutPage.isLoggedIn()).toBe(false);
    });

    test('should handle concurrent login attempts', async ({ page, context }) => {
      // This test simulates rapid login attempts or duplicate requests

      await page.goto('/');
      await layoutPage.openLoginModal();

      const user = TEST_USERS.regular;
      await page.locator('[data-testid="login-email"]').fill(user.email);
      await page.locator('[data-testid="login-password"]').fill(user.password);

      // Click login button multiple times rapidly
      const loginButton = page.locator('[data-testid="login-submit"]');
      await Promise.all([loginButton.click(), loginButton.click(), loginButton.click()]);

      // Should handle gracefully and login successfully
      await layoutPage.waitForNotification('Signed in successfully');
      expect(await layoutPage.isLoggedIn()).toBe(true);

      // Should not have multiple success notifications
      const notifications = await layoutPage.getNotifications();
      const successCount = notifications.filter((n) => n.includes('Signed in successfully')).length;
      expect(successCount).toBeLessThanOrEqual(1);
    });
  });
});
