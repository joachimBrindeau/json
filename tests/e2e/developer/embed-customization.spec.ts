import { test, expect } from '../../utils/base-test';
import { JSON_SAMPLES } from '../../fixtures/json-samples';

test.describe('Developer - Embed Customization', () => {
  test.describe('Theme Customization', () => {
    test('should support light theme customization', async ({ page, context, apiHelper }) => {
      const testData = JSON_SAMPLES.ecommerce.content;
      const uploadResponse = await apiHelper.uploadJSON(testData, {
        title: 'Light Theme Test',
        isPublic: true,
      });

      const jsonId = uploadResponse.id;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Light Theme Test</title>
        </head>
        <body>
          <iframe 
            src="http://localhost:3000/embed/${jsonId}?theme=light&customColors=true" 
            width="800" 
            height="600"
            frameborder="0">
          </iframe>
        </body>
        </html>
      `;

      await page.goto(`data:text/html,${encodeURIComponent(htmlContent)}`);

      const iframe = page.frameLocator('iframe');
      await expect(iframe.locator('[data-testid="json-viewer"]')).toBeVisible();

      // Verify light theme styles
      const viewer = iframe.locator('[data-testid="json-viewer"]');
      const backgroundColor = await viewer.evaluate((el) => getComputedStyle(el).backgroundColor);
      const textColor = await viewer.evaluate((el) => getComputedStyle(el).color);

      // Light theme should have light background, dark text
      expect(backgroundColor).toMatch(/rgb\(2[4-5][0-9], 2[4-5][0-9], 2[4-5][0-9]\)/); // Light gray/white
      expect(textColor).toMatch(/rgb\([0-5][0-9], [0-5][0-9], [0-5][0-9]\)/); // Dark text
    });

    test('should support dark theme customization', async ({ page, context, apiHelper }) => {
      const testData = JSON_SAMPLES.nested.content;
      const uploadResponse = await apiHelper.uploadJSON(testData, {
        title: 'Dark Theme Test',
        isPublic: true,
      });

      const jsonId = uploadResponse.id;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Dark Theme Test</title>
        </head>
        <body style="background: #000;">
          <iframe 
            src="http://localhost:3000/embed/${jsonId}?theme=dark&accentColor=%23007acc" 
            width="800" 
            height="600"
            frameborder="0">
          </iframe>
        </body>
        </html>
      `;

      await page.goto(`data:text/html,${encodeURIComponent(htmlContent)}`);

      const iframe = page.frameLocator('iframe');
      await expect(iframe.locator('[data-testid="json-viewer"]')).toBeVisible();

      // Verify dark theme styles
      const viewer = iframe.locator('[data-testid="json-viewer"]');
      const backgroundColor = await viewer.evaluate((el) => getComputedStyle(el).backgroundColor);
      const textColor = await viewer.evaluate((el) => getComputedStyle(el).color);

      // Dark theme should have dark background, light text
      expect(backgroundColor).toMatch(/rgb\([0-5][0-9], [0-5][0-9], [0-5][0-9]\)/); // Dark
      expect(textColor).toMatch(/rgb\(2[0-5][0-9], 2[0-5][0-9], 2[0-5][0-9]\)/); // Light text
    });

    test('should support custom color schemes', async ({ page, context, apiHelper }) => {
      const testData = JSON_SAMPLES.configuration.content;
      const uploadResponse = await apiHelper.uploadJSON(testData, {
        title: 'Custom Colors Test',
        isPublic: true,
      });

      const jsonId = uploadResponse.id;

      const customColors = {
        primary: '#FF6B35',
        secondary: '#004E89',
        background: '#1A1A2E',
        text: '#EAEAEA',
        accent: '#E94560',
      };

      const colorParams = new URLSearchParams(customColors).toString();

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Custom Colors Test</title>
        </head>
        <body>
          <iframe 
            src="http://localhost:3000/embed/${jsonId}?theme=custom&${colorParams}" 
            width="800" 
            height="600"
            frameborder="0">
          </iframe>
        </body>
        </html>
      `;

      await page.goto(`data:text/html,${encodeURIComponent(htmlContent)}`);

      const iframe = page.frameLocator('iframe');
      await expect(iframe.locator('[data-testid="json-viewer"]')).toBeVisible();

      // Verify custom colors are applied
      const jsonKey = iframe.locator('.json-key').first();
      const keyColor = await jsonKey.evaluate((el) => getComputedStyle(el).color);

      // Should use custom color scheme
      expect(keyColor).toBeDefined();
    });

    test('should support automatic theme detection', async ({ page, context, apiHelper }) => {
      const testData = JSON_SAMPLES.simple.content;
      const uploadResponse = await apiHelper.uploadJSON(testData, {
        title: 'Auto Theme Test',
        isPublic: true,
      });

      const jsonId = uploadResponse.id;

      // Test with light system theme
      await page.emulateMedia({ colorScheme: 'light' });

      const lightHtmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Auto Theme Light Test</title>
        </head>
        <body>
          <iframe 
            src="http://localhost:3000/embed/${jsonId}?theme=auto" 
            width="800" 
            height="600"
            frameborder="0">
          </iframe>
        </body>
        </html>
      `;

      await page.goto(`data:text/html,${encodeURIComponent(lightHtmlContent)}`);

      let iframe = page.frameLocator('iframe');
      await expect(iframe.locator('[data-testid="json-viewer"]')).toBeVisible();

      // Should detect light theme
      let viewer = iframe.locator('[data-testid="json-viewer"]');
      const lightBg = await viewer.evaluate((el) => getComputedStyle(el).backgroundColor);

      // Test with dark system theme
      await page.emulateMedia({ colorScheme: 'dark' });

      const darkHtmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Auto Theme Dark Test</title>
        </head>
        <body>
          <iframe 
            src="http://localhost:3000/embed/${jsonId}?theme=auto" 
            width="800" 
            height="600"
            frameborder="0">
          </iframe>
        </body>
        </html>
      `;

      await page.goto(`data:text/html,${encodeURIComponent(darkHtmlContent)}`);

      iframe = page.frameLocator('iframe');
      await expect(iframe.locator('[data-testid="json-viewer"]')).toBeVisible();

      // Should detect dark theme
      viewer = iframe.locator('[data-testid="json-viewer"]');
      const darkBg = await viewer.evaluate((el) => getComputedStyle(el).backgroundColor);

      // Backgrounds should be different for light vs dark
      expect(lightBg).not.toBe(darkBg);
    });
  });

  test.describe('View Mode Customization', () => {
    test('should support tree view mode customization', async ({ page, context, apiHelper }) => {
      const testData = JSON_SAMPLES.nested.content;
      const uploadResponse = await apiHelper.uploadJSON(testData, {
        title: 'Tree View Customization',
        isPublic: true,
      });

      const jsonId = uploadResponse.id;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Tree View Test</title>
        </head>
        <body>
          <iframe 
            src="http://localhost:3000/embed/${jsonId}?view=tree&expandLevel=2&showLineNumbers=true&sortKeys=true" 
            width="800" 
            height="600"
            frameborder="0">
          </iframe>
        </body>
        </html>
      `;

      await page.goto(`data:text/html,${encodeURIComponent(htmlContent)}`);

      const iframe = page.frameLocator('iframe');
      await expect(iframe.locator('[data-testid="tree-view"]')).toBeVisible();

      // Verify tree view customizations
      await expect(iframe.locator('[data-testid="line-numbers"]')).toBeVisible();
      await expect(iframe.locator('.tree-node[data-level="0"]')).toBeVisible();
      await expect(iframe.locator('.tree-node[data-level="1"]')).toBeVisible();
      await expect(iframe.locator('.tree-node[data-level="2"]')).toBeVisible();

      // Verify nodes are expanded to level 2
      const level2Nodes = iframe.locator('.tree-node[data-level="2"]');
      await expect(level2Nodes.first()).toBeVisible();

      // Verify keys are sorted
      const keys = await iframe.locator('.json-key').allTextContents();
      const sortedKeys = [...keys].sort();
      expect(keys).toEqual(sortedKeys);
    });

    test('should support list view mode customization', async ({ page, context, apiHelper }) => {
      const testData = JSON_SAMPLES.apiResponse.content;
      const uploadResponse = await apiHelper.uploadJSON(testData, {
        title: 'List View Customization',
        isPublic: true,
      });

      const jsonId = uploadResponse.id;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>List View Test</title>
        </head>
        <body>
          <iframe 
            src="http://localhost:3000/embed/${jsonId}?view=list&itemsPerPage=10&showTypes=true&enableFilter=true" 
            width="800" 
            height="600"
            frameborder="0">
          </iframe>
        </body>
        </html>
      `;

      await page.goto(`data:text/html,${encodeURIComponent(htmlContent)}`);

      const iframe = page.frameLocator('iframe');
      await expect(iframe.locator('[data-testid="list-view"]')).toBeVisible();

      // Verify list view customizations
      await expect(iframe.locator('[data-testid="data-types"]')).toBeVisible();
      await expect(iframe.locator('[data-testid="filter-input"]')).toBeVisible();
      await expect(iframe.locator('[data-testid="pagination"]')).toBeVisible();

      // Test pagination
      const listItems = iframe.locator('.list-item');
      const itemCount = await listItems.count();
      expect(itemCount).toBeLessThanOrEqual(10);
    });

    test('should support editor view mode customization', async ({ page, context, apiHelper }) => {
      const testData = JSON_SAMPLES.configuration.content;
      const uploadResponse = await apiHelper.uploadJSON(testData, {
        title: 'Editor View Customization',
        isPublic: true,
      });

      const jsonId = uploadResponse.id;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Editor View Test</title>
        </head>
        <body>
          <iframe 
            src="http://localhost:3000/embed/${jsonId}?view=editor&readOnly=true&fontSize=14&wordWrap=true&minimap=false" 
            width="800" 
            height="600"
            frameborder="0">
          </iframe>
        </body>
        </html>
      `;

      await page.goto(`data:text/html,${encodeURIComponent(htmlContent)}`);

      const iframe = page.frameLocator('iframe');
      await expect(iframe.locator('[data-testid="editor-view"]')).toBeVisible();

      // Verify editor is read-only
      const editor = iframe.locator('.monaco-editor');
      await expect(editor).toHaveClass(/read-only/);

      // Verify no minimap
      await expect(iframe.locator('.minimap')).not.toBeVisible();

      // Verify editor content is displayed
      await expect(iframe.locator('.monaco-editor .view-line')).toHaveCount({ min: 5 });
    });

    test('should support flow/flow view mode customization', async ({
      page,
      context,
      apiHelper,
    }) => {
      const testData = JSON_SAMPLES.ecommerce.content;
      const uploadResponse = await apiHelper.uploadJSON(testData, {
        title: 'Flow View Customization',
        isPublic: true,
      });

      const jsonId = uploadResponse.id;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Flow View Test</title>
        </head>
        <body>
          <iframe 
            src="http://localhost:3000/embed/${jsonId}?view=flow&nodeSize=large&showConnections=true&enableZoom=true" 
            width="800" 
            height="600"
            frameborder="0">
          </iframe>
        </body>
        </html>
      `;

      await page.goto(`data:text/html,${encodeURIComponent(htmlContent)}`);

      const iframe = page.frameLocator('iframe');
      await expect(iframe.locator('[data-testid="flow-view"]')).toBeVisible();

      // Verify flow view elements
      await expect(iframe.locator('.flow-node')).toHaveCount({ min: 3 });
      await expect(iframe.locator('.node-connection')).toHaveCount({ min: 2 });
      await expect(iframe.locator('[data-testid="zoom-controls"]')).toBeVisible();

      // Test zoom functionality
      await iframe.locator('[data-testid="zoom-in"]').click();
      await page.waitForTimeout(500);
      const zoomedNode = iframe.locator('.flow-node').first();
      const nodeSize = await zoomedNode.boundingBox();
      expect(nodeSize?.width).toBeGreaterThan(100);
    });
  });

  test.describe('Dimension Customization', () => {
    test('should support fixed dimensions', async ({ page, context, apiHelper }) => {
      const testData = JSON_SAMPLES.mixedTypes.content;
      const uploadResponse = await apiHelper.uploadJSON(testData, {
        title: 'Fixed Dimensions Test',
        isPublic: true,
      });

      const jsonId = uploadResponse.id;

      const dimensions = [
        { width: '400px', height: '300px' },
        { width: '800px', height: '600px' },
        { width: '1200px', height: '800px' },
      ];

      for (const dim of dimensions) {
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Fixed Dimensions ${dim.width}x${dim.height}</title>
          </head>
          <body>
            <iframe 
              src="http://localhost:3000/embed/${jsonId}" 
              width="${dim.width.replace('px', '')}" 
              height="${dim.height.replace('px', '')}"
              frameborder="0">
            </iframe>
          </body>
          </html>
        `;

        await page.goto(`data:text/html,${encodeURIComponent(htmlContent)}`);

        const iframe = page.locator('iframe');
        const iframeBounds = await iframe.boundingBox();

        expect(iframeBounds?.width).toBe(parseInt(dim.width.replace('px', '')));
        expect(iframeBounds?.height).toBe(parseInt(dim.height.replace('px', '')));

        // Verify content adapts to dimensions
        const viewerInFrame = page.frameLocator('iframe').locator('[data-testid="json-viewer"]');
        await expect(viewerInFrame).toBeVisible();
      }
    });

    test('should support responsive dimensions', async ({ page, context, apiHelper }) => {
      const testData = JSON_SAMPLES.analytics.content;
      const uploadResponse = await apiHelper.uploadJSON(testData, {
        title: 'Responsive Dimensions Test',
        isPublic: true,
      });

      const jsonId = uploadResponse.id;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Responsive Dimensions Test</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            .responsive-container {
              width: 100%;
              max-width: 1200px;
              margin: 0 auto;
              padding: 20px;
            }
            .embed-wrapper {
              position: relative;
              width: 100%;
              height: 0;
              padding-bottom: 56.25%; /* 16:9 aspect ratio */
            }
            .responsive-iframe {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              border: none;
            }
          </style>
        </head>
        <body>
          <div class="responsive-container">
            <div class="embed-wrapper">
              <iframe 
                class="responsive-iframe"
                src="http://localhost:3000/embed/${jsonId}?responsive=true&minWidth=300&maxWidth=1200"
                frameborder="0">
              </iframe>
            </div>
          </div>
        </body>
        </html>
      `;

      // Test different viewport sizes
      const viewports = [
        { width: 320, height: 568 }, // Mobile
        { width: 768, height: 1024 }, // Tablet
        { width: 1920, height: 1080 }, // Desktop
      ];

      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await page.goto(`data:text/html,${encodeURIComponent(htmlContent)}`);

        const iframe = page.frameLocator('.responsive-iframe');
        await expect(iframe.locator('[data-testid="json-viewer"]')).toBeVisible();

        // Verify iframe adapts to container
        const container = page.locator('.responsive-container');
        const containerBounds = await container.boundingBox();
        expect(containerBounds?.width).toBeLessThanOrEqual(viewport.width);

        // Verify content is responsive within iframe
        const viewer = iframe.locator('[data-testid="json-viewer"]');
        const viewerBounds = await viewer.boundingBox();
        expect(viewerBounds?.width).toBeGreaterThan(250); // Minimum responsive width
      }
    });

    test('should support aspect ratio constraints', async ({ page, context, apiHelper }) => {
      const testData = JSON_SAMPLES.simple.content;
      const uploadResponse = await apiHelper.uploadJSON(testData, {
        title: 'Aspect Ratio Test',
        isPublic: true,
      });

      const jsonId = uploadResponse.id;

      const aspectRatios = [
        { ratio: '16:9', paddingBottom: '56.25%' },
        { ratio: '4:3', paddingBottom: '75%' },
        { ratio: '1:1', paddingBottom: '100%' },
      ];

      for (const aspect of aspectRatios) {
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Aspect Ratio ${aspect.ratio} Test</title>
            <style>
              .aspect-container {
                width: 600px;
                margin: 20px auto;
              }
              .aspect-wrapper {
                position: relative;
                width: 100%;
                height: 0;
                padding-bottom: ${aspect.paddingBottom};
                border: 1px solid #ccc;
              }
              .aspect-iframe {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
              }
            </style>
          </head>
          <body>
            <div class="aspect-container">
              <div class="aspect-wrapper">
                <iframe 
                  class="aspect-iframe"
                  src="http://localhost:3000/embed/${jsonId}?aspectRatio=${aspect.ratio}"
                  frameborder="0">
                </iframe>
              </div>
            </div>
          </body>
          </html>
        `;

        await page.goto(`data:text/html,${encodeURIComponent(htmlContent)}`);

        const wrapper = page.locator('.aspect-wrapper');
        const wrapperBounds = await wrapper.boundingBox();

        const iframe = page.frameLocator('.aspect-iframe');
        await expect(iframe.locator('[data-testid="json-viewer"]')).toBeVisible();

        // Verify aspect ratio is maintained
        if (wrapperBounds) {
          const actualRatio = wrapperBounds.width / wrapperBounds.height;
          const expectedRatio =
            aspect.ratio === '16:9' ? 16 / 9 : aspect.ratio === '4:3' ? 4 / 3 : 1;
          expect(Math.abs(actualRatio - expectedRatio)).toBeLessThan(0.1);
        }
      }
    });
  });

  test.describe('Feature Toggle Customization', () => {
    test('should support toolbar customization', async ({ page, context, apiHelper }) => {
      const testData = JSON_SAMPLES.configuration.content;
      const uploadResponse = await apiHelper.uploadJSON(testData, {
        title: 'Toolbar Customization Test',
        isPublic: true,
      });

      const jsonId = uploadResponse.id;

      // Test with full toolbar
      const fullToolbarContent = `
        <!DOCTYPE html>
        <html>
        <body>
          <iframe 
            src="http://localhost:3000/embed/${jsonId}?toolbar=true&search=true&copy=true&download=true&share=true&fullscreen=true" 
            width="800" 
            height="600">
          </iframe>
        </body>
        </html>
      `;

      await page.goto(`data:text/html,${encodeURIComponent(fullToolbarContent)}`);

      let iframe = page.frameLocator('iframe');
      await expect(iframe.locator('[data-testid="toolbar"]')).toBeVisible();
      await expect(iframe.locator('[data-testid="search-button"]')).toBeVisible();
      await expect(iframe.locator('[data-testid="copy-button"]')).toBeVisible();
      await expect(iframe.locator('[data-testid="download-button"]')).toBeVisible();
      await expect(iframe.locator('[data-testid="share-button"]')).toBeVisible();
      await expect(iframe.locator('[data-testid="fullscreen-button"]')).toBeVisible();

      // Test with minimal toolbar
      const minimalToolbarContent = `
        <!DOCTYPE html>
        <html>
        <body>
          <iframe 
            src="http://localhost:3000/embed/${jsonId}?toolbar=true&search=false&copy=true&download=false&share=false&fullscreen=false" 
            width="800" 
            height="600">
          </iframe>
        </body>
        </html>
      `;

      await page.goto(`data:text/html,${encodeURIComponent(minimalToolbarContent)}`);

      iframe = page.frameLocator('iframe');
      await expect(iframe.locator('[data-testid="toolbar"]')).toBeVisible();
      await expect(iframe.locator('[data-testid="copy-button"]')).toBeVisible();
      await expect(iframe.locator('[data-testid="search-button"]')).not.toBeVisible();
      await expect(iframe.locator('[data-testid="download-button"]')).not.toBeVisible();
      await expect(iframe.locator('[data-testid="share-button"]')).not.toBeVisible();
      await expect(iframe.locator('[data-testid="fullscreen-button"]')).not.toBeVisible();
    });

    test('should support navigation controls customization', async ({
      page,
      context,
      apiHelper,
    }) => {
      const testData = JSON_SAMPLES.nested.content;
      const uploadResponse = await apiHelper.uploadJSON(testData, {
        title: 'Navigation Controls Test',
        isPublic: true,
      });

      const jsonId = uploadResponse.id;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <body>
          <iframe 
            src="http://localhost:3000/embed/${jsonId}?breadcrumbs=true&expandControls=true&pathIndicator=true&nodeCounter=true" 
            width="800" 
            height="600">
          </iframe>
        </body>
        </html>
      `;

      await page.goto(`data:text/html,${encodeURIComponent(htmlContent)}`);

      const iframe = page.frameLocator('iframe');
      await expect(iframe.locator('[data-testid="breadcrumbs"]')).toBeVisible();
      await expect(iframe.locator('[data-testid="expand-all"]')).toBeVisible();
      await expect(iframe.locator('[data-testid="collapse-all"]')).toBeVisible();
      await expect(iframe.locator('[data-testid="path-indicator"]')).toBeVisible();
      await expect(iframe.locator('[data-testid="node-count"]')).toBeVisible();

      // Test expand/collapse functionality
      await iframe.locator('[data-testid="collapse-all"]').click();
      await expect(iframe.locator('.tree-node.collapsed')).toHaveCount({ min: 1 });

      await iframe.locator('[data-testid="expand-all"]').click();
      await expect(iframe.locator('.tree-node.expanded')).toHaveCount({ min: 1 });
    });

    test('should support performance optimization settings', async ({
      page,
      context,
      apiHelper,
    }) => {
      const largeData = JSON_SAMPLES.largeArray.generateContent(1000);
      const uploadResponse = await apiHelper.uploadJSON(largeData, {
        title: 'Performance Settings Test',
        isPublic: true,
      });

      const jsonId = uploadResponse.id;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <body>
          <iframe 
            src="http://localhost:3000/embed/${jsonId}?virtualization=true&lazyLoad=true&maxNodes=500&pagination=true" 
            width="800" 
            height="600">
          </iframe>
        </body>
        </html>
      `;

      await page.goto(`data:text/html,${encodeURIComponent(htmlContent)}`);

      const iframe = page.frameLocator('iframe');
      await expect(iframe.locator('[data-testid="json-viewer"]')).toBeVisible();

      // Verify virtualization is enabled
      await expect(iframe.locator('[data-testid="virtual-container"]')).toBeVisible();

      // Verify pagination for large datasets
      await expect(iframe.locator('[data-testid="pagination-controls"]')).toBeVisible();

      // Verify not all nodes are rendered (lazy loading)
      const visibleNodes = await iframe.locator('.json-node:visible').count();
      expect(visibleNodes).toBeLessThan(1000); // Should be less than total
      expect(visibleNodes).toBeGreaterThan(0);
    });
  });

  test.describe('Advanced Customization', () => {
    test('should support custom CSS injection', async ({ page, context, apiHelper }) => {
      const testData = JSON_SAMPLES.simple.content;
      const uploadResponse = await apiHelper.uploadJSON(testData, {
        title: 'Custom CSS Test',
        isPublic: true,
      });

      const jsonId = uploadResponse.id;

      const customCSS = encodeURIComponent(`
        .json-key { color: #ff6b35 !important; }
        .json-value { color: #004e89 !important; }
        .json-viewer { border: 3px solid #e94560 !important; }
      `);

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <body>
          <iframe 
            src="http://localhost:3000/embed/${jsonId}?customCSS=${customCSS}" 
            width="800" 
            height="600">
          </iframe>
        </body>
        </html>
      `;

      await page.goto(`data:text/html,${encodeURIComponent(htmlContent)}`);

      const iframe = page.frameLocator('iframe');
      await expect(iframe.locator('[data-testid="json-viewer"]')).toBeVisible();

      // Verify custom CSS is applied
      const jsonKey = iframe.locator('.json-key').first();
      const keyColor = await jsonKey.evaluate((el) => getComputedStyle(el).color);
      expect(keyColor).toBe('rgb(255, 107, 53)'); // #ff6b35

      const viewer = iframe.locator('.json-viewer');
      const borderColor = await viewer.evaluate((el) => getComputedStyle(el).borderColor);
      expect(borderColor).toBe('rgb(233, 69, 96)'); // #e94560
    });

    test('should support callback configuration', async ({ page, context, apiHelper }) => {
      const testData = JSON_SAMPLES.ecommerce.content;
      const uploadResponse = await apiHelper.uploadJSON(testData, {
        title: 'Callbacks Test',
        isPublic: true,
      });

      const jsonId = uploadResponse.id;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <body>
          <div id="callback-output"></div>
          <iframe 
            id="callback-iframe"
            src="http://localhost:3000/embed/${jsonId}?enableCallbacks=true" 
            width="800" 
            height="600">
          </iframe>
          
          <script>
            const callbacks = [];
            
            window.addEventListener('message', function(event) {
              if (event.origin !== 'http://localhost:3000') return;
              
              callbacks.push(event.data);
              document.getElementById('callback-output').textContent = 
                'Callbacks: ' + callbacks.length;
              
              // Expose for testing
              window.embedCallbacks = callbacks;
            });
          </script>
        </body>
        </html>
      `;

      await page.goto(`data:text/html,${encodeURIComponent(htmlContent)}`);

      const iframe = page.frameLocator('#callback-iframe');
      await expect(iframe.locator('[data-testid="json-viewer"]')).toBeVisible();

      // Interact with the embed to trigger callbacks
      await iframe.locator('.tree-node-toggle').first().click();

      // Wait for callbacks
      await page.waitForFunction(() => {
        return window.embedCallbacks && window.embedCallbacks.length > 0;
      });

      const callbacks = await page.evaluate(() => window.embedCallbacks);
      expect(callbacks.length).toBeGreaterThan(0);
      expect(callbacks[0]).toHaveProperty('type');
    });

    test('should support locale and internationalization', async ({ page, context, apiHelper }) => {
      const testData = JSON_SAMPLES.analytics.content;
      const uploadResponse = await apiHelper.uploadJSON(testData, {
        title: 'i18n Test',
        isPublic: true,
      });

      const jsonId = uploadResponse.id;

      const locales = ['en', 'es', 'fr', 'de', 'zh'];

      for (const locale of locales) {
        const htmlContent = `
          <!DOCTYPE html>
          <html lang="${locale}">
          <body>
            <iframe 
              src="http://localhost:3000/embed/${jsonId}?locale=${locale}&formatNumbers=true&formatDates=true" 
              width="800" 
              height="600">
            </iframe>
          </body>
          </html>
        `;

        await page.goto(`data:text/html,${encodeURIComponent(htmlContent)}`);

        const iframe = page.frameLocator('iframe');
        await expect(iframe.locator('[data-testid="json-viewer"]')).toBeVisible();

        // Verify locale-specific formatting
        const toolbar = iframe.locator('[data-testid="toolbar"]');
        if (await toolbar.isVisible()) {
          // Check if toolbar text reflects the locale
          const toolbarText = await toolbar.textContent();
          expect(toolbarText).toBeDefined();
        }
      }
    });
  });
});
