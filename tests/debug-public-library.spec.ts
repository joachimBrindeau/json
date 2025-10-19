import { test, expect } from '@playwright/test';

test('Debug library page', async ({ page }) => {
  await page.goto('/saved');

  // Wait for page to load completely
  await page.waitForLoadState('networkidle');
  await page.waitForLoadState('networkidle'); // Wait for library page initialization

  // Take a screenshot
  await page.screenshot({ path: 'debug-public-library.png', fullPage: true });

  console.log('=== DEBUGGING PUBLIC LIBRARY PAGE ===');

  // Check URL
  console.log('Current URL:', page.url());

  // Check page title
  const title = await page.title();
  console.log('Page title:', title);

  // Check for main heading
  const heading = await page
    .locator('h1')
    .textContent()
    .catch(() => null);
  console.log('Main heading:', heading);

  // Check for search input more broadly
  const searchInputs = await page.locator('input').count();
  console.log('Number of input elements:', searchInputs);

  // Check different search input possibilities
  const searchInput1 = await page
    .locator('input[placeholder*="search"]')
    .isVisible()
    .catch(() => false);
  const searchInput2 = await page
    .locator('input[placeholder*="Search"]')
    .isVisible()
    .catch(() => false);
  const searchInput3 = await page
    .locator('input[placeholder*="JSON"]')
    .isVisible()
    .catch(() => false);
  console.log('Search inputs visible:', {
    'placeholder with search': searchInput1,
    'placeholder with Search': searchInput2,
    'placeholder with JSON': searchInput3,
  });

  // Check for library content containers
  const containers = await page.locator('div[class*="grid"]').count();
  const cards = await page.locator('[class*="card"]').count();
  const articles = await page.locator('article').count();
  console.log('Content containers:', { grids: containers, cards: cards, articles: articles });

  // Check for loading states
  const loading = await page
    .locator('text=Loading')
    .isVisible()
    .catch(() => false);
  const spinner = await page
    .locator('[class*="animate-spin"]')
    .isVisible()
    .catch(() => false);
  console.log('Loading states:', { textLoading: loading, spinner: spinner });

  // Check for empty states
  const emptyStates = await page.locator('text=No').count();
  const emptyMessage1 = await page
    .locator('text=No JSON examples found')
    .isVisible()
    .catch(() => false);
  const emptyMessage2 = await page
    .locator('text=No items')
    .isVisible()
    .catch(() => false);
  console.log('Empty states:', {
    count: emptyStates,
    examples: emptyMessage1,
    items: emptyMessage2,
  });

  // Check for error messages
  const errorText = await page
    .locator('text=Error')
    .isVisible()
    .catch(() => false);
  const failedText = await page
    .locator('text=Failed')
    .isVisible()
    .catch(() => false);
  console.log('Error messages:', { error: errorText, failed: failedText });

  // Look for any React error boundaries or console errors
  const errorBoundary = await page
    .locator('text=Something went wrong')
    .isVisible()
    .catch(() => false);
  console.log('React error boundary:', errorBoundary);

  // Check network requests in console
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log('Console error:', msg.text());
    }
  });

  // Check API calls
  const response = await page.request.get('/api/saved');
  console.log('API response status:', response.status());
  if (response.ok()) {
    const data = await response.json();
    console.log('API data:', JSON.stringify(data, null, 2));
  }
});
