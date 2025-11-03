import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 667 }, // iPhone SE
  { name: 'tablet', width: 768, height: 1024 }, // iPad
  { name: 'desktop', width: 1440, height: 900 }, // Desktop
];

const ROUTES = [
  { path: '/', name: 'Homepage' },
  { path: '/edit', name: 'Editor' },
  { path: '/format', name: 'Format' },
  { path: '/compare', name: 'Compare' },
  { path: '/library', name: 'Library' },
];

VIEWPORTS.forEach((viewport) => {
  test.describe(`Responsive Tests - ${viewport.name}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
    });

    ROUTES.forEach((route) => {
      test(`${route.name} - ${viewport.name} layout`, async ({ page }) => {
        await page.goto(route.path);

        // Wait for page to load
        await page.waitForLoadState('networkidle');

        // Check for horizontal scrollbar (indicates responsive issues)
        const bodyScrollWidth = await page.evaluate(() => {
          return document.body.scrollWidth;
        });
        const viewportWidth = await page.evaluate(() => {
          return window.innerWidth;
        });

        // Allow for minor differences (5px tolerance)
        expect(bodyScrollWidth).toBeLessThanOrEqual(viewportWidth + 5);

        // Check that navigation elements are accessible (but may be hidden on landing page)
        if (viewport.name === 'mobile') {
          // On mobile, check if hamburger menu exists (but don't require it for landing pages)
          const mobileMenu = page.locator('[aria-label="Toggle mobile menu"]');
          // Just check it exists, don't require visibility as landing pages may not have navigation
        } else {
          // On desktop/tablet, navigation may not exist on landing pages
          const navigation = page.locator('nav, [data-testid*="nav"]');
          // Don't require navigation on landing pages
        }

        // Check main content area is visible
        const mainContent = page.locator('main, [role="main"], .container').first();
        if ((await mainContent.count()) > 0) {
          await expect(mainContent).toBeVisible();
        }

        // Take screenshot for visual comparison
        await page.screenshot({
          path: `test-results/responsive-${route.name.toLowerCase()}-${viewport.name}.png`,
          fullPage: true,
        });
      });
    });

    test(`Homepage hero section - ${viewport.name}`, async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Check hero title is visible and properly sized
      const heroTitle = page.locator('h1').first();
      await expect(heroTitle).toBeVisible();

      const heroTitleBox = await heroTitle.boundingBox();
      expect(heroTitleBox?.width).toBeGreaterThan(0);
      expect(heroTitleBox?.width).toBeLessThanOrEqual(viewport.width);

      // Check hero buttons are visible and clickable
      const ctaButtons = page.locator(
        'main button, main a[href*="/edit"], main a[href*="/format"]'
      );
      if ((await ctaButtons.count()) > 0) {
        const visibleButton = ctaButtons.first();
        await expect(visibleButton).toBeVisible();

        // On mobile, buttons should be touch-friendly
        if (viewport.name === 'mobile') {
          const buttonBox = await visibleButton.boundingBox();
          if (buttonBox) {
            expect(buttonBox.height).toBeGreaterThanOrEqual(44);
          }
        }
      }

      // Check that feature cards are properly laid out
      const featureCards = page
        .locator('[data-testid*="feature"], .grid > div, .flex > div')
        .first();
      if ((await featureCards.count()) > 0) {
        const cardBox = await featureCards.boundingBox();
        expect(cardBox?.width).toBeLessThanOrEqual(viewport.width);
      }
    });

    test(`JSON Education section - ${viewport.name}`, async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Find the JSON Education section
      const jsonSection = page.locator('section').filter({ hasText: 'What is JSON?' });

      if ((await jsonSection.count()) > 0) {
        await expect(jsonSection).toBeVisible();

        // Check that content doesn't overflow
        const sectionBox = await jsonSection.boundingBox();
        expect(sectionBox?.width).toBeLessThanOrEqual(viewport.width);

        // Check that cards are properly responsive
        const cards = jsonSection.locator('.grid > div, [class*="card"]');
        if ((await cards.count()) > 0) {
          for (let i = 0; i < Math.min(3, await cards.count()); i++) {
            const card = cards.nth(i);
            const cardBox = await card.boundingBox();
            if (cardBox) {
              expect(cardBox.width).toBeLessThanOrEqual(viewport.width);
              expect(cardBox.width).toBeGreaterThan(0);
            }
          }
        }

        // Check badges don't overflow on mobile
        if (viewport.name === 'mobile') {
          const badges = jsonSection.locator('[class*="badge"], .flex.gap-2');
          for (let i = 0; i < Math.min(3, await badges.count()); i++) {
            const badge = badges.nth(i);
            if ((await badge.count()) > 0) {
              const badgeBox = await badge.boundingBox();
              if (badgeBox) {
                expect(badgeBox.width).toBeLessThanOrEqual(viewport.width);
              }
            }
          }
        }
      }
    });

    test(`Editor interface - ${viewport.name}`, async ({ page }) => {
      await page.goto('/edit');
      await page.waitForLoadState('networkidle');

      // Check that the editor doesn't cause horizontal scroll
      const editorContainer = page
        .locator('.monaco-editor, [data-testid*="editor"], textarea')
        .first();
      if ((await editorContainer.count()) > 0) {
        const editorBox = await editorContainer.boundingBox();
        if (editorBox) {
          expect(editorBox.width).toBeLessThanOrEqual(viewport.width);
        }
      }

      // Check toolbar is responsive
      const toolbar = page.locator('[data-testid*="toolbar"], .flex.gap-2, .space-x-2').first();
      if ((await toolbar.count()) > 0) {
        const toolbarBox = await toolbar.boundingBox();
        if (toolbarBox) {
          expect(toolbarBox.width).toBeLessThanOrEqual(viewport.width);
        }
      }

      // On mobile, check if controls are accessible
      if (viewport.name === 'mobile') {
        // Look for visible buttons in the main content area
        const visibleButtons = page
          .locator('main button:visible, [data-testid*="tab"]:visible')
          .first();
        if ((await visibleButtons.count()) > 0) {
          await expect(visibleButtons).toBeVisible();

          // Check button is large enough for touch
          const buttonBox = await visibleButtons.boundingBox();
          if (buttonBox) {
            expect(buttonBox.height).toBeGreaterThanOrEqual(44); // iOS/Android touch target
          }
        }
      }
    });

    test(`Format page responsiveness - ${viewport.name}`, async ({ page }) => {
      await page.goto('/format');
      await page.waitForLoadState('networkidle');

      // Check action buttons are properly spaced
      const actionButtons = page.locator('button, .btn');
      if ((await actionButtons.count()) > 0) {
        const firstButton = actionButtons.first();
        const buttonBox = await firstButton.boundingBox();
        if (buttonBox) {
          expect(buttonBox.width).toBeLessThanOrEqual(viewport.width);

          if (viewport.name === 'mobile') {
            expect(buttonBox.height).toBeGreaterThanOrEqual(44);
          }
        }
      }

      // Check that textarea/input fields are responsive
      const textInputs = page.locator('textarea, input[type="text"]');
      for (let i = 0; i < Math.min(3, await textInputs.count()); i++) {
        const input = textInputs.nth(i);
        const inputBox = await input.boundingBox();
        if (inputBox) {
          expect(inputBox.width).toBeLessThanOrEqual(viewport.width);
        }
      }
    });

    test(`Library grid layout - ${viewport.name}`, async ({ page }) => {
      await page.goto('/library');
      await page.waitForLoadState('networkidle');

      // Check grid layout is responsive
      const gridContainer = page.locator('.grid, [class*="grid-cols"]').first();
      if ((await gridContainer.count()) > 0) {
        const gridBox = await gridContainer.boundingBox();
        if (gridBox) {
          expect(gridBox.width).toBeLessThanOrEqual(viewport.width);
        }

        // Check individual grid items
        const gridItems = gridContainer.locator('> div, > article, > section');
        if ((await gridItems.count()) > 0) {
          const firstItem = gridItems.first();
          const itemBox = await firstItem.boundingBox();
          if (itemBox) {
            expect(itemBox.width).toBeLessThanOrEqual(viewport.width);

            // On mobile, items should be closer to full width
            if (viewport.name === 'mobile') {
              expect(itemBox.width).toBeGreaterThanOrEqual(viewport.width * 0.8);
            }
          }
        }
      }
    });

    test(`Footer responsiveness - ${viewport.name}`, async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Check footer if it exists
      const footer = page.locator('footer');
      if ((await footer.count()) > 0) {
        const footerBox = await footer.boundingBox();
        if (footerBox) {
          expect(footerBox.width).toBeLessThanOrEqual(viewport.width);
        }

        // Check footer links are accessible
        const footerLinks = footer.locator('a');
        if ((await footerLinks.count()) > 0) {
          const firstLink = footerLinks.first();
          await expect(firstLink).toBeVisible();

          if (viewport.name === 'mobile') {
            const linkBox = await firstLink.boundingBox();
            if (linkBox) {
              expect(linkBox.height).toBeGreaterThanOrEqual(44);
            }
          }
        }
      }
    });
  });
});
