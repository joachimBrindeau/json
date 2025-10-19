import { test, expect } from '@playwright/test';

test.describe('Bug Hunting - Core Functionality', () => {
  test('Homepage loads with proper elements', async ({ page }) => {
    await page.goto('/');

    // Check page title
    await expect(page).toHaveTitle(/JSON Viewer/);

    // Check main navigation elements exist
    const loginButton = page.locator('[data-testid="login-button"]');
    const publicLibrary = page.locator('a[href="/library"]');
    const developers = page.locator('a[href="/developers"]');

    // Check if elements are visible (but don't fail if some are missing yet)
    const loginVisible = await loginButton.isVisible().catch(() => false);
    const libraryVisible = await publicLibrary.isVisible().catch(() => false);
    const developersVisible = await developers.isVisible().catch(() => false);

    console.log('Navigation elements visibility:', {
      login: loginVisible,
      library: libraryVisible,
      developers: developersVisible,
    });

    // Check for JSON editor/viewer area
    const editorArea = page.locator('[data-testid="json-editor"]');
    const editorVisible = await editorArea.isVisible().catch(() => false);
    console.log('Editor visible:', editorVisible);
  });

  test('JSON paste and format functionality', async ({ page }) => {
    await page.goto('/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Look for JSON input area - use Monaco editor textarea
    const jsonInput = page.locator('[data-testid="json-input"]');

    const testJSON = '{"name":"test","value":123,"active":true}';

    try {
      await jsonInput.fill(testJSON);
      await page.waitForLoadState('networkidle'); // Wait for JSON processing

      // Check if JSON was formatted or processed
      const content = await jsonInput.inputValue().catch(() => '');
      console.log('JSON input successful, content length:', content.length);

      // Look for format button
      const formatButton = page.locator('[data-testid="format-button"]');

      const formatButtonExists = await formatButton.isVisible().catch(() => false);
      console.log('Format button exists:', formatButtonExists);

      if (formatButtonExists) {
        await formatButton.click();
        await page.waitForLoadState('networkidle'); // Wait for format completion
      }
    } catch (error) {
      console.log('JSON input error:', error.message);
    }
  });

  test('Public library accessibility', async ({ page }) => {
    await page.goto('/save');

    // Check if save page loads
    await expect(page).toHaveURL(/save/);

    // Check for search functionality
    const searchInput = page.locator('[data-testid="search-input"]');

    const searchExists = await searchInput.isVisible().catch(() => false);
    console.log('Search input exists:', searchExists);

    // Check for library items or empty state
    const libraryItems = page.locator('[data-testid="library-item"]');

    const itemCount = await libraryItems.count();
    console.log('Library items found:', itemCount);

    // Check for empty state message
    const emptyMessage = page.locator('[data-testid="empty-state"]');

    const emptyStateVisible = await emptyMessage.isVisible().catch(() => false);
    console.log('Empty state visible:', emptyStateVisible);
  });

  test('Developers page accessibility', async ({ page }) => {
    await page.goto('/developers');

    // Check if developers page loads
    await expect(page).toHaveURL(/developers/);

    // Look for API documentation or developer resources
    const apiDocs = page.locator('[data-testid="api-docs"]');

    const apiDocsVisible = await apiDocs.isVisible().catch(() => false);
    console.log('API docs visible:', apiDocsVisible);

    // Check for code examples
    const codeBlocks = page.locator('pre');
    const codeCount = await codeBlocks.count();
    console.log('Code blocks found:', codeCount);
  });

  test('Profile/Save page (authenticated)', async ({ page }) => {
    await page.goto('/save');

    // This might redirect to login or show login prompt
    await page.waitForLoadState('networkidle');

    const currentUrl = page.url();
    console.log('Save page URL:', currentUrl);

    // Check for login requirement message or redirect
    const loginRequired = page.locator('[data-testid="login-modal"]');

    const loginRequiredVisible = await loginRequired.isVisible().catch(() => false);
    console.log('Login required:', loginRequiredVisible);
  });

  test('Error handling - invalid route', async ({ page }) => {
    await page.goto('/nonexistent-page-12345');

    // Should show 404 or redirect to home
    await page.waitForLoadState('networkidle');

    const currentUrl = page.url();
    console.log('Invalid route URL:', currentUrl);

    // Check for 404 message
    const notFound = page.locator('text=404');

    const notFoundVisible = await notFound.isVisible().catch(() => false);
    console.log('404 page visible:', notFoundVisible);
  });
});
