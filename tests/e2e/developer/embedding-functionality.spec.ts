import { test, expect } from '../../utils/base-test';
import { JSON_SAMPLES } from '../../fixtures/json-samples';
import { config } from '../../../lib/config';

test.describe('Developer - Embedding Functionality', () => {
  test.describe('Iframe Embedding', () => {
    test('should generate iframe embed code', async ({ page, apiHelper }) => {
      // Upload JSON to get shareable ID
      const testData = JSON_SAMPLES.ecommerce.content;
      const uploadResponse = await apiHelper.uploadJSON(testData, {
        title: 'Iframe Embed Test',
        isPublic: true,
      });

      const jsonId = uploadResponse.id;

      // Navigate to embed page
      await page.goto(`/embed/${jsonId}`);

      // Verify iframe embed interface loads
      await expect(page.locator('[data-testid="embed-generator"]')).toBeVisible();

      // Generate iframe embed code
      await page.click('[data-testid="embed-type-iframe"]');
      await page.fill('[data-testid="embed-width"]', '800');
      await page.fill('[data-testid="embed-height"]', '600');
      await page.selectOption('[data-testid="embed-theme"]', 'light');

      const embedCode = await page.inputValue('[data-testid="generated-embed-code"]');

      // Verify iframe code structure
      expect(embedCode).toContain('<iframe');
      expect(embedCode).toContain(`src="${config.testing.baseUrl}/embed/${jsonId}`);
      expect(embedCode).toContain('width="800"');
      expect(embedCode).toContain('height="600"');
      expect(embedCode).toContain('theme=light');
    });

    test('should load embedded JSON in iframe', async ({ page, context, apiHelper }) => {
      const testData = JSON_SAMPLES.apiResponse.content;
      const uploadResponse = await apiHelper.uploadJSON(testData, {
        title: 'Iframe Load Test',
        isPublic: true,
      });

      const jsonId = uploadResponse.id;

      // Create HTML page with iframe
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Iframe Embed Test</title>
        </head>
        <body>
          <h1>Test Iframe Embed</h1>
          <iframe 
            id="json-embed"
            src="http://localhost:3000/embed/${jsonId}?theme=light&view=tree" 
            width="800" 
            height="600"
            frameborder="0">
          </iframe>
        </body>
        </html>
      `;

      // Create a new page and navigate to data URL
      const embedPage = await context.newPage();
      await embedPage.goto(`data:text/html,${encodeURIComponent(htmlContent)}`);

      // Wait for iframe to load
      const iframe = embedPage.frameLocator('#json-embed');
      await expect(iframe.locator('[data-testid="json-viewer"]')).toBeVisible({ timeout: 10000 });

      // Verify JSON content is displayed
      await expect(iframe.locator('[data-testid="tree-view"]')).toBeVisible();
      const jsonNodeCount = await iframe.locator('.json-node').count();
      expect(jsonNodeCount).toBeGreaterThanOrEqual(10);

      // Verify specific data from the API response sample
      await expect(iframe.locator('text="success"')).toBeVisible();
      await expect(iframe.locator('text="users"')).toBeVisible();
    });

    test('should handle iframe responsive sizing', async ({ page, context, apiHelper }) => {
      const testData = JSON_SAMPLES.simple.content;
      const uploadResponse = await apiHelper.uploadJSON(testData, {
        title: 'Responsive Iframe Test',
        isPublic: true,
      });

      const jsonId = uploadResponse.id;

      // Test different viewport sizes
      const viewports = [
        { width: 320, height: 568 }, // Mobile
        { width: 768, height: 1024 }, // Tablet
        { width: 1920, height: 1080 }, // Desktop
      ];

      for (const viewport of viewports) {
        await page.setViewportSize(viewport);

        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Responsive Iframe Test</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              .embed-container {
                width: 100%;
                max-width: 800px;
                margin: 0 auto;
              }
              .responsive-iframe {
                width: 100%;
                height: 400px;
                border: none;
              }
            </style>
          </head>
          <body>
            <div class="embed-container">
              <iframe 
                class="responsive-iframe"
                src="http://localhost:3000/embed/${jsonId}?responsive=true&theme=auto"
                frameborder="0">
              </iframe>
            </div>
          </body>
          </html>
        `;

        await page.goto(`data:text/html,${encodeURIComponent(htmlContent)}`);

        // Verify iframe adapts to container
        const iframe = page.frameLocator('.responsive-iframe');
        await expect(iframe.locator('[data-testid="json-viewer"]')).toBeVisible();

        // Check if the viewer adapts to different screen sizes
        const viewerWidth = await iframe.locator('[data-testid="json-viewer"]').boundingBox();
        expect(viewerWidth?.width).toBeLessThanOrEqual(viewport.width);
      }
    });

    test('should support iframe communication via postMessage', async ({
      page,
      context,
      apiHelper,
    }) => {
      const testData = JSON_SAMPLES.nested.content;
      const uploadResponse = await apiHelper.uploadJSON(testData, {
        title: 'PostMessage Test',
        isPublic: true,
      });

      const jsonId = uploadResponse.id;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>PostMessage Test</title>
        </head>
        <body>
          <div id="status">Waiting for messages...</div>
          <iframe 
            id="json-embed"
            src="http://localhost:3000/embed/${jsonId}?enablePostMessage=true" 
            width="800" 
            height="600">
          </iframe>
          
          <script>
            const messages = [];
            
            window.addEventListener('message', function(event) {
              if (event.origin !== 'http://localhost:3000') return;
              
              messages.push(event.data);
              document.getElementById('status').textContent = 
                'Received: ' + JSON.stringify(event.data);
              
              // Store messages for test verification
              window.receivedMessages = messages;
            });
            
            // Send commands to iframe
            function sendCommand(command) {
              document.getElementById('json-embed').contentWindow.postMessage(command, 'http://localhost:3000');
            }
            
            // Expose function for tests
            window.sendCommand = sendCommand;
          </script>
        </body>
        </html>
      `;

      await page.goto(`data:text/html,${encodeURIComponent(htmlContent)}`);

      // Wait for iframe to load
      const iframe = page.locator('#json-embed');
      await iframe.waitFor({ state: 'attached' });
      await page.waitForTimeout(1000); // Allow iframe to fully load

      // Send command to iframe
      await page.evaluate(() => {
        window.sendCommand({ type: 'expandAll' });
      });

      // Wait for response
      await page.waitForFunction(() => {
        return window.receivedMessages && window.receivedMessages.length > 0;
      });

      // Verify message was received
      const messages = await page.evaluate(() => window.receivedMessages);
      expect(messages.length).toBeGreaterThan(0);
      expect(messages[0]).toHaveProperty('type');
    });
  });

  test.describe('JavaScript Widget Embedding', () => {
    test('should load JavaScript widget embed', async ({ page, context, apiHelper }) => {
      const testData = JSON_SAMPLES.configuration.content;
      const uploadResponse = await apiHelper.uploadJSON(testData, {
        title: 'JS Widget Test',
        isPublic: true,
      });

      const jsonId = uploadResponse.id;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>JS Widget Test</title>
        </head>
        <body>
          <div id="json-widget-container"></div>
          
          <script src="http://localhost:3000/embed/widget.js"></script>
          <script>
            JSONViewerWidget.create({
              container: '#json-widget-container',
              jsonId: '${jsonId}',
              theme: 'dark',
              height: '500px',
              viewMode: 'tree',
              showToolbar: true,
              enableSearch: true
            });
          </script>
        </body>
        </html>
      `;

      await page.goto(`data:text/html,${encodeURIComponent(htmlContent)}`);

      // Wait for widget to load
      await expect(page.locator('#json-widget-container [data-testid="json-viewer"]')).toBeVisible({
        timeout: 15000,
      });

      // Verify widget features
      await expect(page.locator('#json-widget-container [data-testid="toolbar"]')).toBeVisible();
      await expect(page.locator('#json-widget-container [data-testid="search-box"]')).toBeVisible();
      await expect(page.locator('#json-widget-container [data-testid="tree-view"]')).toBeVisible();

      // Test widget interactions
      await page.click('#json-widget-container [data-testid="search-box"]');
      await page.fill('#json-widget-container [data-testid="search-box"]', 'database');

      // Verify search functionality
      await expect(page.locator('#json-widget-container .search-highlight')).toBeVisible();
    });

    test('should support multiple JavaScript widgets on same page', async ({
      page,
      context,
      apiHelper,
    }) => {
      // Create multiple test JSONs
      const json1 = await apiHelper.uploadJSON(JSON_SAMPLES.simple.content, {
        title: 'Widget 1',
        isPublic: true,
      });
      const json2 = await apiHelper.uploadJSON(JSON_SAMPLES.nested.content, {
        title: 'Widget 2',
        isPublic: true,
      });

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Multiple Widgets Test</title>
          <style>
            .widget-container {
              margin: 20px 0;
              border: 1px solid #ccc;
              padding: 10px;
            }
          </style>
        </head>
        <body>
          <h2>Widget 1 - Simple JSON</h2>
          <div id="widget-1" class="widget-container"></div>
          
          <h2>Widget 2 - Nested JSON</h2>
          <div id="widget-2" class="widget-container"></div>
          
          <script src="http://localhost:3000/embed/widget.js"></script>
          <script>
            // Create first widget
            JSONViewerWidget.create({
              container: '#widget-1',
              jsonId: '${json1.id}',
              theme: 'light',
              height: '300px',
              viewMode: 'list'
            });
            
            // Create second widget
            JSONViewerWidget.create({
              container: '#widget-2',
              jsonId: '${json2.id}',
              theme: 'dark',
              height: '400px',
              viewMode: 'tree'
            });
          </script>
        </body>
        </html>
      `;

      await page.goto(`data:text/html,${encodeURIComponent(htmlContent)}`);

      // Verify both widgets load
      await expect(page.locator('#widget-1 [data-testid="json-viewer"]')).toBeVisible();
      await expect(page.locator('#widget-2 [data-testid="json-viewer"]')).toBeVisible();

      // Verify different view modes
      await expect(page.locator('#widget-1 [data-testid="list-view"]')).toBeVisible();
      await expect(page.locator('#widget-2 [data-testid="tree-view"]')).toBeVisible();

      // Verify widgets operate independently
      await page.click('#widget-2 .tree-node-toggle');

      // Widget 1 should remain unchanged
      const widget1Content = await page.locator('#widget-1').innerHTML();
      expect(widget1Content).toContain('list-view');
    });

    test('should handle JavaScript widget configuration options', async ({
      page,
      context,
      apiHelper,
    }) => {
      const testData = JSON_SAMPLES.mixedTypes.content;
      const uploadResponse = await apiHelper.uploadJSON(testData, {
        title: 'Config Test',
        isPublic: true,
      });

      const jsonId = uploadResponse.id;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Widget Configuration Test</title>
        </head>
        <body>
          <div id="config-widget"></div>
          
          <script src="http://localhost:3000/embed/widget.js"></script>
          <script>
            const widget = JSONViewerWidget.create({
              container: '#config-widget',
              jsonId: '${jsonId}',
              theme: 'dark',
              height: '600px',
              viewMode: 'tree',
              showToolbar: true,
              showLineNumbers: true,
              enableSearch: true,
              enableCopy: true,
              enableDownload: false,
              maxDepth: 3,
              sortKeys: true,
              showDataTypes: true,
              onLoad: function(data) {
                console.log('Widget loaded with data:', data);
                window.widgetLoaded = true;
              },
              onError: function(error) {
                console.error('Widget error:', error);
                window.widgetError = error;
              }
            });
            
            // Expose widget for testing
            window.jsonWidget = widget;
          </script>
        </body>
        </html>
      `;

      await page.goto(`data:text/html,${encodeURIComponent(htmlContent)}`);

      // Wait for widget to load
      await page.waitForFunction(() => window.widgetLoaded === true);

      // Verify configuration options applied
      await expect(page.locator('[data-testid="toolbar"]')).toBeVisible();
      await expect(page.locator('[data-testid="line-numbers"]')).toBeVisible();
      await expect(page.locator('[data-testid="search-box"]')).toBeVisible();
      await expect(page.locator('[data-testid="copy-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="download-button"]')).not.toBeVisible();

      // Test maxDepth configuration
      const deepNodes = page.locator('.tree-node[data-depth="4"]');
      await expect(deepNodes).toHaveCount(0); // Should not show nodes deeper than maxDepth

      // Test sortKeys configuration
      const keys = await page.locator('.json-key').allTextContents();
      const sortedKeys = [...keys].sort();
      expect(keys).toEqual(sortedKeys);
    });

    test('should support widget API methods', async ({ page, context, apiHelper }) => {
      const testData = JSON_SAMPLES.ecommerce.content;
      const uploadResponse = await apiHelper.uploadJSON(testData, {
        title: 'API Methods Test',
        isPublic: true,
      });

      const jsonId = uploadResponse.id;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Widget API Test</title>
        </head>
        <body>
          <div id="api-widget"></div>
          <div id="controls">
            <button onclick="expandAll()">Expand All</button>
            <button onclick="collapseAll()">Collapse All</button>
            <button onclick="setTheme('light')">Light Theme</button>
            <button onclick="setTheme('dark')">Dark Theme</button>
            <button onclick="getData()">Get Data</button>
          </div>
          <div id="output"></div>
          
          <script src="http://localhost:3000/embed/widget.js"></script>
          <script>
            const widget = JSONViewerWidget.create({
              container: '#api-widget',
              jsonId: '${jsonId}',
              theme: 'light',
              height: '400px'
            });
            
            function expandAll() {
              widget.expandAll();
            }
            
            function collapseAll() {
              widget.collapseAll();
            }
            
            function setTheme(theme) {
              widget.setTheme(theme);
            }
            
            function getData() {
              const data = widget.getData();
              document.getElementById('output').textContent = JSON.stringify(data, null, 2);
            }
            
            // Expose for testing
            window.testWidget = widget;
          </script>
        </body>
        </html>
      `;

      await page.goto(`data:text/html,${encodeURIComponent(htmlContent)}`);

      // Wait for widget to load
      await expect(page.locator('#api-widget [data-testid="json-viewer"]')).toBeVisible();

      // Test expand/collapse methods
      await page.click('button:text("Collapse All")');
      const collapsedCount = await page.locator('.tree-node.collapsed').count();
      expect(collapsedCount).toBeGreaterThanOrEqual(1);

      await page.click('button:text("Expand All")');
      const expandedCount = await page.locator('.tree-node.expanded').count();
      expect(expandedCount).toBeGreaterThanOrEqual(1);

      // Test theme switching
      await page.click('button:text("Dark Theme")');
      await expect(page.locator('#api-widget')).toHaveClass(/dark-theme/);

      await page.click('button:text("Light Theme")');
      await expect(page.locator('#api-widget')).toHaveClass(/light-theme/);

      // Test data retrieval
      await page.click('button:text("Get Data")');
      const outputText = await page.locator('#output').textContent();
      const outputData = JSON.parse(outputText);
      expect(outputData).toHaveProperty('order');
    });
  });

  test.describe('Embed Security', () => {
    test('should enforce CORS policies for iframe embeds', async ({ page, context, apiHelper }) => {
      const testData = JSON_SAMPLES.simple.content;
      const uploadResponse = await apiHelper.uploadJSON(testData, {
        title: 'CORS Test',
        isPublic: true,
      });

      const jsonId = uploadResponse.id;

      // Test from allowed origin
      const allowedOriginContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Allowed Origin Test</title>
        </head>
        <body>
          <iframe src="http://localhost:3000/embed/${jsonId}" width="800" height="600"></iframe>
        </body>
        </html>
      `;

      await page.goto(`data:text/html,${encodeURIComponent(allowedOriginContent)}`);
      const iframe = page.frameLocator('iframe');
      await expect(iframe.locator('[data-testid="json-viewer"]')).toBeVisible();

      // Test CORS headers in API response
      const corsResponse = await page.request.get(`http://localhost:3000/api/embed/${jsonId}`, {
        headers: {
          Origin: 'https://example.com',
        },
      });

      expect(corsResponse.headers()['access-control-allow-origin']).toBeDefined();
    });

    test('should sanitize embedded content', async ({ page, context, apiHelper }) => {
      // Create JSON with potentially malicious content
      const maliciousData = {
        script: '<script>alert("XSS")</script>',
        html: '<img src="x" onerror="alert(\'XSS\')">',
        normal: 'safe content',
      };

      const uploadResponse = await apiHelper.uploadJSON(maliciousData, {
        title: 'Security Test',
        isPublic: true,
      });

      const jsonId = uploadResponse.id;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Security Test</title>
        </head>
        <body>
          <iframe src="http://localhost:3000/embed/${jsonId}" width="800" height="600"></iframe>
        </body>
        </html>
      `;

      await page.goto(`data:text/html,${encodeURIComponent(htmlContent)}`);

      const iframe = page.frameLocator('iframe');
      await expect(iframe.locator('[data-testid="json-viewer"]')).toBeVisible();

      // Verify malicious content is properly escaped/sanitized
      const scriptContent = await iframe.locator('.json-value:has-text("script")').textContent();
      expect(scriptContent).toContain('&lt;script&gt;');
      expect(scriptContent).not.toContain('<script>');

      // Ensure no alert dialogs appear (XSS prevention)
      let alertTriggered = false;
      page.on('dialog', () => {
        alertTriggered = true;
      });

      await page.waitForLoadState('networkidle'); // Wait for content rendering to complete
      expect(alertTriggered).toBe(false);
    });

    test('should validate embed permissions and access control', async ({
      page,
      context,
      apiHelper,
      authHelper,
    }) => {
      // Create private JSON
      await authHelper.loginAPI('developer');
      const privateData = JSON_SAMPLES.configuration.content;
      const privateUpload = await apiHelper.uploadJSON(privateData, {
        title: 'Private JSON',
        isPublic: false,
      });

      const privateId = privateUpload.id;

      // Try to embed private JSON without authentication
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <body>
          <iframe src="http://localhost:3000/embed/${privateId}" width="800" height="600"></iframe>
        </body>
        </html>
      `;

      await page.goto(`data:text/html,${encodeURIComponent(htmlContent)}`);

      const iframe = page.frameLocator('iframe');

      // Should show access denied or login required message
      await expect(iframe.locator('[data-testid="access-denied"]')).toBeVisible();
      await expect(iframe.locator('text="Access Denied"')).toBeVisible();
    });
  });
});
