import { test, expect } from '@playwright/test';

/**
 * Verifies that the Monaco editor is tall enough and that JSON content is visible.
 * Saves both an element-only screenshot of the editor and a full-page screenshot.
 */
test('Monaco editor shows JSON and is visible in screenshot', async ({ page }) => {
  // Go to a page that embeds dual Monaco editors
  await page.goto('/format');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle').catch(() => {});

  // Inject a unique JSON payload
  const sampleJson = JSON.stringify({ MONACO_VIS_TEST_123: true, nested: { a: 1, b: 2 } }, null, 2);

  // Type into the first Monaco editor like a user would
  const firstEditor = page.locator('.monaco-editor').first();
  await firstEditor.waitFor({ state: 'visible', timeout: 5000 });
  await firstEditor.click();
  // Clear any existing content
  await page.keyboard.press('Meta+A').catch(() => {});
  await page.keyboard.press('Control+A').catch(() => {});
  await page.keyboard.press('Backspace').catch(() => {});
  // Insert our sample JSON
  await page.keyboard.insertText(sampleJson);

  // Wait a bit for layout/paint
  await page.waitForTimeout(300);

  const bbox = await firstEditor.boundingBox();
  console.log('Monaco editor bounding box:', bbox);

  // Save screenshots
  await firstEditor.screenshot({ path: 'test-results/screenshots/monaco-visibility-editor.png' });
  await page.screenshot({
    path: 'test-results/screenshots/monaco-visibility-full.png',
    fullPage: true,
  });

  // Basic assertions: height and text presence
  expect(bbox && bbox.height).toBeGreaterThan(300);

  // Monaco renders text in .view-lines; check content includes our unique key
  const visibleText = await page
    .locator('.monaco-editor .view-lines')
    .first()
    .innerText()
    .catch(() => '');
  expect(visibleText).toContain('MONACO_VIS_TEST_123');
});
