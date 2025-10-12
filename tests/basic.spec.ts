import { test, expect } from '@playwright/test';

test('basic app loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/JSON/);
});
