import { test, expect } from '@playwright/test';

test('Debug homepage elements', async ({ page }) => {
  await page.goto('/');

  // Wait for page to load completely
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Take a screenshot to see what's actually rendered
  await page.screenshot({ path: 'debug-homepage.png', fullPage: true });

  // Check all the elements that should exist
  console.log('=== DEBUGGING HOMEPAGE ===');

  // Check sidebar elements
  const sidebar = await page
    .locator('.sidebar')
    .or(page.locator('[class*="sidebar"]'))
    .or(page.locator('aside'))
    .first()
    .isVisible()
    .catch(() => false);
  const sidebarWidth = await page
    .locator('div.w-64')
    .isVisible()
    .catch(() => false);
  console.log('Sidebar visible:', sidebar, 'w-64 element:', sidebarWidth);

  // Check for login button in sidebar
  const loginButton = await page.locator('text=Sign in').isVisible();
  console.log('Login button visible:', loginButton);

  // Check for navigation links in sidebar
  const publicLibraryLink = await page.locator('text=Library').isVisible();
  const libraryLink = await page.locator('text=Library').isVisible();
  console.log('Library link visible:', publicLibraryLink);
  console.log('Library link visible:', libraryLink);

  // Check for JSON editor area
  const monacoEditor = await page
    .locator('.monaco-editor')
    .isVisible()
    .catch(() => false);
  const editorContainer = await page
    .locator('[data-testid="json-editor"]')
    .isVisible()
    .catch(() => false);
  const loadingText = await page
    .locator('text=Loading Monaco Editor')
    .isVisible()
    .catch(() => false);
  console.log('Monaco editor visible:', monacoEditor);
  console.log('Editor container visible:', editorContainer);
  console.log('Loading text visible:', loadingText);

  // Check for tabs
  const editorTab = await page
    .locator('text=Editor')
    .isVisible()
    .catch(() => false);
  const flowTab = await page
    .locator('text=Flow')
    .isVisible()
    .catch(() => false);
  console.log('Editor tab visible:', editorTab);
  console.log('Flow tab visible:', flowTab);

  // Check header/breadcrumb
  const jsonViewerTitle = await page.locator('text=JSON Viewer').isVisible();
  console.log('JSON Viewer title visible:', jsonViewerTitle);

  // Print page HTML structure for debugging
  const bodyHTML = await page.locator('body').innerHTML();
  console.log('Page structure preview:', bodyHTML.substring(0, 500) + '...');

  // Check CSS classes
  const mainLayout = await page
    .locator('[class*="h-screen"]')
    .isVisible()
    .catch(() => false);
  const flexLayout = await page
    .locator('[class*="flex"]')
    .first()
    .isVisible()
    .catch(() => false);
  console.log('Main layout visible:', mainLayout);
  console.log('Flex layout visible:', flexLayout);
});
