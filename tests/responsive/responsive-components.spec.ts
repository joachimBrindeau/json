import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];

VIEWPORTS.forEach((viewport) => {
  test.describe(`Component Responsiveness - ${viewport.name}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
    });

    test(`JSON Viewer component - ${viewport.name}`, async ({ page }) => {
      await page.goto('/edit');
      await page.waitForLoadState('networkidle');

      // Test with sample JSON
      const sampleJson = JSON.stringify({
        name: "Test User",
        age: 30,
        skills: ["JavaScript", "TypeScript", "React"],
        address: { city: "New York", country: "USA" }
      }, null, 2);

      // Find and fill JSON input
      const jsonInput = page.locator('textarea, .monaco-editor').first();
      if (await jsonInput.count() > 0) {
        await jsonInput.click();
        await jsonInput.clear();
        await jsonInput.fill(sampleJson);
        
        // Check that the input doesn't overflow
        const inputBox = await jsonInput.boundingBox();
        if (inputBox) {
          expect(inputBox.width).toBeLessThanOrEqual(viewport.width);
        }
      }

      // Check tabs are responsive
      const tabs = page.locator('[role="tablist"], [data-testid*="tab"]');
      if (await tabs.count() > 0) {
        const tabsBox = await tabs.first().boundingBox();
        if (tabsBox) {
          expect(tabsBox.width).toBeLessThanOrEqual(viewport.width);
        }

        // On mobile, check if tabs scroll or stack properly
        if (viewport.name === 'mobile') {
          const tabButtons = tabs.locator('button, [role="tab"]');
          if (await tabButtons.count() > 0) {
            // Each tab should be accessible
            for (let i = 0; i < Math.min(4, await tabButtons.count()); i++) {
              const tab = tabButtons.nth(i);
              await expect(tab).toBeVisible();
              
              const tabBox = await tab.boundingBox();
              if (tabBox) {
                expect(tabBox.height).toBeGreaterThanOrEqual(44);
              }
            }
          }
        }
      }
    });

    test(`Action buttons responsiveness - ${viewport.name}`, async ({ page }) => {
      await page.goto('/format');
      await page.waitForLoadState('networkidle');

      // Check format action buttons
      const actionButtons = page.locator('button').filter({ hasText: /format|minify|validate/i });
      
      if (await actionButtons.count() > 0) {
        for (let i = 0; i < Math.min(5, await actionButtons.count()); i++) {
          const button = actionButtons.nth(i);
          const buttonBox = await button.boundingBox();
          
          if (buttonBox) {
            expect(buttonBox.width).toBeLessThanOrEqual(viewport.width);
            expect(buttonBox.width).toBeGreaterThan(0);
            
            // Mobile touch targets should be at least 44px
            if (viewport.name === 'mobile') {
              expect(buttonBox.height).toBeGreaterThanOrEqual(44);
              expect(buttonBox.width).toBeGreaterThanOrEqual(44);
            }
          }
        }
      }
    });

    test(`Modal dialogs responsiveness - ${viewport.name}`, async ({ page }) => {
      await page.goto('/library');
      await page.waitForLoadState('networkidle');

      // Try to open a modal (if any exist)
      const modalTriggers = page.locator('button').filter({ hasText: /share|export|settings/i });
      
      if (await modalTriggers.count() > 0) {
        await modalTriggers.first().click();
        await page.waitForLoadState('networkidle'); // Wait for modal rendering

        // Check if modal appears
        const modal = page.locator('[role="dialog"], .modal, [data-testid*="modal"]');
        if (await modal.count() > 0) {
          const modalBox = await modal.first().boundingBox();
          
          if (modalBox) {
            // Modal should fit within viewport with some padding
            expect(modalBox.width).toBeLessThanOrEqual(viewport.width - 32);
            expect(modalBox.height).toBeLessThanOrEqual(viewport.height - 64);
            
            // On mobile, modal should use most of the screen
            if (viewport.name === 'mobile') {
              expect(modalBox.width).toBeGreaterThanOrEqual(viewport.width * 0.8);
            }
          }

          // Check close button is accessible
          const closeButton = modal.locator('[aria-label*="close"], button').filter({ hasText: /×|close/i });
          if (await closeButton.count() > 0) {
            await expect(closeButton.first()).toBeVisible();
            
            if (viewport.name === 'mobile') {
              const closeBox = await closeButton.first().boundingBox();
              if (closeBox) {
                expect(closeBox.height).toBeGreaterThanOrEqual(44);
              }
            }
          }
        }
      }
    });

    test(`Form inputs responsiveness - ${viewport.name}`, async ({ page }) => {
      await page.goto('/compare');
      await page.waitForLoadState('networkidle');

      // Check textarea inputs
      const textareas = page.locator('textarea');
      
      for (let i = 0; i < Math.min(3, await textareas.count()); i++) {
        const textarea = textareas.nth(i);
        const textareaBox = await textarea.boundingBox();
        
        if (textareaBox) {
          expect(textareaBox.width).toBeLessThanOrEqual(viewport.width);
          expect(textareaBox.width).toBeGreaterThan(100); // Should have minimum width
          
          // On mobile, should use most available width
          if (viewport.name === 'mobile') {
            expect(textareaBox.width).toBeGreaterThanOrEqual(viewport.width * 0.7);
          }
        }
      }

      // Check input labels are visible
      const labels = page.locator('label');
      for (let i = 0; i < Math.min(3, await labels.count()); i++) {
        const label = labels.nth(i);
        if (await label.isVisible()) {
          const labelBox = await label.boundingBox();
          if (labelBox) {
            expect(labelBox.width).toBeLessThanOrEqual(viewport.width);
          }
        }
      }
    });

    test(`Navigation responsiveness - ${viewport.name}`, async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      if (viewport.name === 'mobile') {
        // Check mobile navigation
        const mobileMenuButton = page.locator('[aria-label*="menu"], button').filter({ hasText: /menu/i });
        if (await mobileMenuButton.count() > 0) {
          await expect(mobileMenuButton.first()).toBeVisible();
          
          // Click to open menu
          await mobileMenuButton.first().click();
          await page.waitForLoadState('networkidle'); // Wait for menu expansion
          
          // Check menu items are accessible
          const menuItems = page.locator('nav a, [role="menuitem"]');
          if (await menuItems.count() > 0) {
            for (let i = 0; i < Math.min(5, await menuItems.count()); i++) {
              const item = menuItems.nth(i);
              if (await item.isVisible()) {
                const itemBox = await item.boundingBox();
                if (itemBox) {
                  expect(itemBox.height).toBeGreaterThanOrEqual(44);
                }
              }
            }
          }
        }
      } else {
        // Check desktop navigation
        const navItems = page.locator('nav a, [data-testid*="nav"]');
        if (await navItems.count() > 0) {
          for (let i = 0; i < Math.min(5, await navItems.count()); i++) {
            const navItem = navItems.nth(i);
            if (await navItem.isVisible()) {
              const itemBox = await navItem.boundingBox();
              if (itemBox) {
                expect(itemBox.width).toBeLessThanOrEqual(viewport.width);
              }
            }
          }
        }
      }
    });

    test(`Card layouts responsiveness - ${viewport.name}`, async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Find card containers
      const cardContainers = page.locator('.grid, [class*="grid-cols"], .flex.flex-wrap');
      
      for (let i = 0; i < Math.min(3, await cardContainers.count()); i++) {
        const container = cardContainers.nth(i);
        const containerBox = await container.boundingBox();
        
        if (containerBox) {
          expect(containerBox.width).toBeLessThanOrEqual(viewport.width);
          
          // Check individual cards
          const cards = container.locator('> div, > article, > section');
          if (await cards.count() > 0) {
            for (let j = 0; j < Math.min(3, await cards.count()); j++) {
              const card = cards.nth(j);
              const cardBox = await card.boundingBox();
              
              if (cardBox) {
                expect(cardBox.width).toBeLessThanOrEqual(viewport.width);
                expect(cardBox.width).toBeGreaterThan(0);
                
                // Check card content doesn't overflow
                const cardContent = card.locator('h3, h4, p').first();
                if (await cardContent.count() > 0) {
                  const contentBox = await cardContent.boundingBox();
                  if (contentBox) {
                    expect(contentBox.width).toBeLessThanOrEqual(cardBox.width);
                  }
                }
              }
            }
          }
        }
      }
    });

    test(`Typography responsiveness - ${viewport.name}`, async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Check headings don't overflow
      const headings = page.locator('h1, h2, h3, h4, h5, h6');
      
      for (let i = 0; i < Math.min(5, await headings.count()); i++) {
        const heading = headings.nth(i);
        if (await heading.isVisible()) {
          const headingBox = await heading.boundingBox();
          if (headingBox) {
            expect(headingBox.width).toBeLessThanOrEqual(viewport.width);
            
            // Check text doesn't get cut off (minimum height)
            expect(headingBox.height).toBeGreaterThan(0);
          }
        }
      }

      // Check paragraph text wraps properly
      const paragraphs = page.locator('p');
      for (let i = 0; i < Math.min(3, await paragraphs.count()); i++) {
        const paragraph = paragraphs.nth(i);
        if (await paragraph.isVisible()) {
          const paragraphBox = await paragraph.boundingBox();
          if (paragraphBox) {
            expect(paragraphBox.width).toBeLessThanOrEqual(viewport.width);
          }
        }
      }
    });

    test(`Image responsiveness - ${viewport.name}`, async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Check images don't overflow
      const images = page.locator('img, [role="img"]');
      
      for (let i = 0; i < Math.min(3, await images.count()); i++) {
        const image = images.nth(i);
        if (await image.isVisible()) {
          const imageBox = await image.boundingBox();
          if (imageBox) {
            expect(imageBox.width).toBeLessThanOrEqual(viewport.width);
            expect(imageBox.height).toBeGreaterThan(0);
          }
        }
      }

      // Check SVG icons are properly sized
      const svgIcons = page.locator('svg');
      for (let i = 0; i < Math.min(5, await svgIcons.count()); i++) {
        const svg = svgIcons.nth(i);
        if (await svg.isVisible()) {
          const svgBox = await svg.boundingBox();
          if (svgBox) {
            // Icons should be reasonably sized
            expect(svgBox.width).toBeLessThanOrEqual(100);
            expect(svgBox.height).toBeLessThanOrEqual(100);
            expect(svgBox.width).toBeGreaterThan(0);
            expect(svgBox.height).toBeGreaterThan(0);
          }
        }
      }
    });
  });
});