import { test, expect } from '../../utils/base-test';
import { JSON_SAMPLES } from '../../fixtures/json-samples';

test.describe('Developer - Iframe and JavaScript Widget Embedding', () => {
  test.describe('Iframe Embedding Implementation', () => {
    test('should generate and validate iframe embed codes with all parameters', async ({
      page,
      apiHelper,
      context,
    }) => {
      // Upload test JSON for embedding
      const testData = JSON_SAMPLES.ecommerce.content;
      const uploadResponse = await apiHelper.uploadJSON(testData, {
        title: 'Iframe Embed Test',
        isPublic: true,
      });

      const jsonId = uploadResponse.id;

      // Navigate to embed generator
      await page.goto(`/embed/generator?jsonId=${jsonId}`);

      // Configure iframe embed parameters
      await page.selectOption('[data-testid="embed-type"]', 'iframe');
      await page.fill('[data-testid="embed-width"]', '800');
      await page.fill('[data-testid="embed-height"]', '600');
      await page.selectOption('[data-testid="embed-theme"]', 'dark');
      await page.selectOption('[data-testid="embed-view-mode"]', 'tree');
      await page.check('[data-testid="embed-show-toolbar"]');
      await page.check('[data-testid="embed-enable-search"]');
      await page.check('[data-testid="embed-allow-fullscreen"]');

      // Generate embed code
      await page.click('[data-testid="generate-embed-code"]');

      const embedCode = await page.inputValue('[data-testid="generated-embed-code"]');

      // Validate embed code structure
      expect(embedCode).toContain('<iframe');
      expect(embedCode).toContain(
        `src="${process.env.BASE_URL || 'http://localhost:3000'}/embed/${jsonId}`
      );
      expect(embedCode).toContain('width="800"');
      expect(embedCode).toContain('height="600"');
      expect(embedCode).toContain('theme=dark');
      expect(embedCode).toContain('view=tree');
      expect(embedCode).toContain('toolbar=true');
      expect(embedCode).toContain('search=true');
      expect(embedCode).toContain('allowfullscreen');

      // Test live preview
      const previewFrame = page.frameLocator('[data-testid="embed-preview"] iframe');
      await expect(previewFrame.locator('[data-testid="json-viewer"]')).toBeVisible();
      await expect(previewFrame.locator('[data-testid="toolbar"]')).toBeVisible();
      await expect(previewFrame.locator('[data-testid="search-box"]')).toBeVisible();
      await expect(previewFrame.locator('[data-testid="tree-view"]')).toBeVisible();
    });

    test('should embed and render JSON in external webpage via iframe', async ({
      page,
      context,
      apiHelper,
    }) => {
      const testData = JSON_SAMPLES.apiResponse.content;
      const uploadResponse = await apiHelper.uploadJSON(testData, {
        title: 'External Iframe Test',
        isPublic: true,
      });

      const jsonId = uploadResponse.id;

      // Create external HTML page with iframe embed
      const externalHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>External Iframe Embed Test</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .embed-container { 
              border: 2px solid #ccc; 
              border-radius: 8px; 
              overflow: hidden;
              margin: 20px 0;
            }
            .embed-header {
              background: #f5f5f5;
              padding: 10px;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <h1>External Website with Embedded JSON Viewer</h1>
          <p>This is an external website demonstrating iframe embedding.</p>
          
          <div class="embed-container">
            <div class="embed-header">API Response Data</div>
            <iframe 
              id="json-embed"
              src="http://localhost:3000/embed/${jsonId}?theme=light&view=tree&toolbar=true&search=true" 
              width="100%" 
              height="500"
              frameborder="0"
              sandbox="allow-scripts allow-same-origin allow-popups">
            </iframe>
          </div>

          <div class="embed-container">
            <div class="embed-header">Same Data - List View</div>
            <iframe 
              id="json-embed-list"
              src="http://localhost:3000/embed/${jsonId}?theme=dark&view=list&toolbar=true&pagination=10" 
              width="100%" 
              height="400"
              frameborder="0"
              sandbox="allow-scripts allow-same-origin">
            </iframe>
          </div>
        </body>
        </html>
      `;

      // Navigate to external page
      await page.goto(`data:text/html,${encodeURIComponent(externalHtml)}`);

      // Verify first iframe loads and renders correctly
      const iframe1 = page.frameLocator('#json-embed');
      await expect(iframe1.locator('[data-testid="json-viewer"]')).toBeVisible({ timeout: 10000 });
      await expect(iframe1.locator('[data-testid="tree-view"]')).toBeVisible();
      await expect(iframe1.locator('[data-testid="toolbar"]')).toBeVisible();

      // Verify content is displayed
      await expect(iframe1.locator('text="success"')).toBeVisible();
      await expect(iframe1.locator('text="users"')).toBeVisible();

      // Verify second iframe with different view mode
      const iframe2 = page.frameLocator('#json-embed-list');
      await expect(iframe2.locator('[data-testid="json-viewer"]')).toBeVisible();
      await expect(iframe2.locator('[data-testid="list-view"]')).toBeVisible();

      // Test iframe interactions
      await iframe1.locator('[data-testid="search-box"]').fill('users');
      await expect(iframe1.locator('.search-highlight')).toBeVisible();

      // Verify iframes are isolated (interactions don't affect each other)
      const iframe2Content = await iframe2.locator('[data-testid="json-viewer"]').innerHTML();
      expect(iframe2Content).not.toContain('search-highlight');
    });

    test('should handle responsive iframe embedding across different screen sizes', async ({
      page,
      context,
      apiHelper,
    }) => {
      const testData = JSON_SAMPLES.nested.content;
      const uploadResponse = await apiHelper.uploadJSON(testData, {
        title: 'Responsive Iframe Test',
        isPublic: true,
      });

      const jsonId = uploadResponse.id;

      // Create responsive embed HTML
      const responsiveHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Responsive Iframe Test</title>
          <style>
            .responsive-embed {
              position: relative;
              width: 100%;
              max-width: 1200px;
              margin: 0 auto;
            }
            
            .embed-16x9 {
              position: relative;
              width: 100%;
              height: 0;
              padding-bottom: 56.25%; /* 16:9 */
            }
            
            .embed-4x3 {
              position: relative;
              width: 100%;
              height: 0;
              padding-bottom: 75%; /* 4:3 */
            }
            
            .responsive-iframe {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              border: none;
            }
            
            @media (max-width: 768px) {
              .responsive-embed { padding: 10px; }
            }
          </style>
        </head>
        <body>
          <div class="responsive-embed">
            <h2>16:9 Aspect Ratio Embed</h2>
            <div class="embed-16x9">
              <iframe 
                class="responsive-iframe"
                src="http://localhost:3000/embed/${jsonId}?responsive=true&theme=auto&minWidth=300"
                title="16:9 JSON Viewer">
              </iframe>
            </div>
            
            <h2>4:3 Aspect Ratio Embed</h2>
            <div class="embed-4x3">
              <iframe 
                class="responsive-iframe"
                src="http://localhost:3000/embed/${jsonId}?responsive=true&theme=auto&aspectRatio=4:3"
                title="4:3 JSON Viewer">
              </iframe>
            </div>
          </div>
        </body>
        </html>
      `;

      // Test different viewport sizes
      const viewports = [
        { width: 1920, height: 1080, device: 'desktop' },
        { width: 1024, height: 768, device: 'tablet' },
        { width: 375, height: 667, device: 'mobile' },
      ];

      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await page.goto(`data:text/html,${encodeURIComponent(responsiveHtml)}`);

        // Verify both embeds load and adapt
        const iframe16x9 = page.frameLocator('.embed-16x9 .responsive-iframe');
        const iframe4x3 = page.frameLocator('.embed-4x3 .responsive-iframe');

        await expect(iframe16x9.locator('[data-testid="json-viewer"]')).toBeVisible();
        await expect(iframe4x3.locator('[data-testid="json-viewer"]')).toBeVisible();

        // Check that content adapts to viewport
        const viewer16x9 = iframe16x9.locator('[data-testid="json-viewer"]');
        const viewer4x3 = iframe4x3.locator('[data-testid="json-viewer"]');

        const bounds16x9 = await viewer16x9.boundingBox();
        const bounds4x3 = await viewer4x3.boundingBox();

        expect(bounds16x9?.width).toBeLessThanOrEqual(viewport.width);
        expect(bounds4x3?.width).toBeLessThanOrEqual(viewport.width);

        // Verify responsive behavior
        if (viewport.width < 768) {
          // Mobile view should show compact interface
          await expect(iframe16x9.locator('[data-testid="mobile-view"]')).toBeVisible();
        } else {
          // Desktop/tablet should show full interface
          await expect(iframe16x9.locator('[data-testid="desktop-view"]')).toBeVisible();
        }
      }
    });

    test('should implement secure iframe embedding with CSP and sandboxing', async ({
      page,
      context,
      apiHelper,
    }) => {
      const testData = JSON_SAMPLES.configuration.content;
      const uploadResponse = await apiHelper.uploadJSON(testData, {
        title: 'Secure Iframe Test',
        isPublic: true,
      });

      const jsonId = uploadResponse.id;

      // Create secure embed with strict CSP
      const secureHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta http-equiv="Content-Security-Policy" content="
            default-src 'self'; 
            frame-src http://localhost:3000; 
            script-src 'self' 'unsafe-inline'; 
            style-src 'self' 'unsafe-inline';
          ">
          <title>Secure Iframe Test</title>
        </head>
        <body>
          <h1>Secure Iframe Embedding</h1>
          
          <!-- Sandboxed iframe with minimal permissions -->
          <iframe 
            id="secure-embed"
            src="http://localhost:3000/embed/${jsonId}?secure=true&origin=external" 
            width="800" 
            height="600"
            sandbox="allow-scripts allow-same-origin"
            referrerpolicy="strict-origin-when-cross-origin"
            loading="lazy">
          </iframe>

          <!-- Iframe with stricter sandboxing -->
          <iframe 
            id="strict-embed"
            src="http://localhost:3000/embed/${jsonId}?secure=true&readonly=true" 
            width="800" 
            height="400"
            sandbox="allow-scripts"
            title="Read-only JSON Viewer">
          </iframe>

          <script>
            // Test postMessage communication security
            let messageCount = 0;
            
            window.addEventListener('message', function(event) {
              // Verify origin
              if (event.origin !== 'http://localhost:3000') {
                console.error('Unauthorized message origin:', event.origin);
                return;
              }
              
              messageCount++;
              console.log('Secure message received:', event.data);
              
              // Store for test verification
              window.secureMessages = window.secureMessages || [];
              window.secureMessages.push(event.data);
            });
          </script>
        </body>
        </html>
      `;

      await page.goto(`data:text/html,${encodeURIComponent(secureHtml)}`);

      // Verify secure iframe loads
      const secureIframe = page.frameLocator('#secure-embed');
      await expect(secureIframe.locator('[data-testid="json-viewer"]')).toBeVisible();

      // Verify strict iframe loads with read-only mode
      const strictIframe = page.frameLocator('#strict-embed');
      await expect(strictIframe.locator('[data-testid="json-viewer"]')).toBeVisible();
      await expect(strictIframe.locator('[data-testid="readonly-indicator"]')).toBeVisible();

      // Test that sandboxing prevents unauthorized actions
      const editButton = strictIframe.locator('[data-testid="edit-button"]');
      if (await editButton.isVisible()) {
        await editButton.click();
        await expect(strictIframe.locator('[data-testid="access-denied"]')).toBeVisible();
      }

      // Verify secure postMessage communication
      await secureIframe.locator('[data-testid="json-node"]').first().click();

      // Wait for secure messages
      await page.waitForFunction(() => {
        return window.secureMessages && window.secureMessages.length > 0;
      });

      const messages = await page.evaluate(() => window.secureMessages);
      expect(messages.length).toBeGreaterThan(0);
      expect(messages[0]).toHaveProperty('type');
    });
  });

  test.describe('JavaScript Widget Implementation', () => {
    test('should load and initialize JavaScript widget with full API', async ({
      page,
      context,
      apiHelper,
    }) => {
      const testData = JSON_SAMPLES.analytics.content;
      const uploadResponse = await apiHelper.uploadJSON(testData, {
        title: 'JS Widget API Test',
        isPublic: true,
      });

      const jsonId = uploadResponse.id;

      // Create page with JavaScript widget
      const widgetHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>JavaScript Widget API Test</title>
          <style>
            .widget-container {
              width: 100%;
              max-width: 1200px;
              height: 600px;
              border: 1px solid #ccc;
              border-radius: 8px;
              margin: 20px auto;
            }
            
            .controls {
              margin: 20px 0;
              text-align: center;
            }
            
            .controls button {
              margin: 0 10px;
              padding: 10px 20px;
              cursor: pointer;
            }
          </style>
        </head>
        <body>
          <h1>JSON Viewer Widget API Test</h1>
          
          <div class="controls">
            <button onclick="widget.expandAll()">Expand All</button>
            <button onclick="widget.collapseAll()">Collapse All</button>
            <button onclick="widget.setTheme('dark')">Dark Theme</button>
            <button onclick="widget.setTheme('light')">Light Theme</button>
            <button onclick="widget.setView('tree')">Tree View</button>
            <button onclick="widget.setView('list')">List View</button>
            <button onclick="getData()">Get Data</button>
            <button onclick="searchData()">Search</button>
          </div>
          
          <div id="json-widget" class="widget-container"></div>
          <div id="output"></div>
          
          <script src="http://localhost:3000/embed/widget.js"></script>
          <script>
            // Initialize widget with comprehensive configuration
            const widget = new JSONViewerWidget({
              container: '#json-widget',
              jsonId: '${jsonId}',
              
              // Appearance
              theme: 'light',
              height: '100%',
              
              // View options
              defaultView: 'tree',
              showToolbar: true,
              showLineNumbers: true,
              enableMinimap: false,
              
              // Features
              enableSearch: true,
              enableCopy: true,
              enableDownload: true,
              enableFullscreen: true,
              enableKeyboardShortcuts: true,
              
              // Tree view options
              expandLevel: 2,
              sortKeys: false,
              showDataTypes: true,
              maxNodeTextLength: 200,
              
              // List view options  
              pagination: true,
              itemsPerPage: 20,
              enableFiltering: true,
              
              // Performance
              virtualScrolling: true,
              lazyLoading: true,
              maxDisplayNodes: 1000,
              
              // Events
              onLoad: function(data) {
                console.log('Widget loaded:', data);
                window.widgetLoaded = true;
                window.loadedData = data;
              },
              
              onError: function(error) {
                console.error('Widget error:', error);
                window.widgetError = error;
              },
              
              onViewChange: function(view) {
                console.log('View changed to:', view);
                window.currentView = view;
              },
              
              onSearch: function(query, results) {
                console.log('Search performed:', query, results);
                window.lastSearch = { query, results };
              },
              
              onNodeClick: function(node, path) {
                console.log('Node clicked:', node, path);
                window.lastClickedNode = { node, path };
              },
              
              onNodeExpand: function(node, path) {
                console.log('Node expanded:', path);
              },
              
              onThemeChange: function(theme) {
                console.log('Theme changed to:', theme);
                window.currentTheme = theme;
              }
            });
            
            // Helper functions for testing
            function getData() {
              const data = widget.getData();
              document.getElementById('output').innerHTML = 
                '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
            }
            
            function searchData() {
              const results = widget.search('users');
              console.log('Search results:', results);
            }
            
            // Expose widget for testing
            window.testWidget = widget;
          </script>
        </body>
        </html>
      `;

      await page.goto(`data:text/html,${encodeURIComponent(widgetHtml)}`);

      // Wait for widget to load
      await page.waitForFunction(() => window.widgetLoaded === true, { timeout: 15000 });

      // Verify widget initialized correctly
      await expect(page.locator('#json-widget [data-testid="json-viewer"]')).toBeVisible();
      await expect(page.locator('#json-widget [data-testid="toolbar"]')).toBeVisible();
      await expect(page.locator('#json-widget [data-testid="tree-view"]')).toBeVisible();

      // Test widget API methods
      await page.click('button:text("Collapse All")');
      await expect(page.locator('#json-widget .tree-node.collapsed')).toHaveCount({ min: 1 });

      await page.click('button:text("Expand All")');
      await expect(page.locator('#json-widget .tree-node.expanded')).toHaveCount({ min: 1 });

      // Test theme switching
      await page.click('button:text("Dark Theme")');
      await page.waitForFunction(() => window.currentTheme === 'dark');
      await expect(page.locator('#json-widget')).toHaveClass(/dark-theme/);

      // Test view switching
      await page.click('button:text("List View")');
      await page.waitForFunction(() => window.currentView === 'list');
      await expect(page.locator('#json-widget [data-testid="list-view"]')).toBeVisible();

      // Test data retrieval
      await page.click('button:text("Get Data")');
      const outputContent = await page.locator('#output').textContent();
      expect(outputContent).toContain('period');
      expect(outputContent).toContain('overview');

      // Test search functionality
      await page.click('button:text("Search")');
      await page.waitForFunction(() => window.lastSearch !== undefined);

      const searchResults = await page.evaluate(() => window.lastSearch);
      expect(searchResults.query).toBe('users');
      expect(searchResults.results).toBeDefined();

      // Test node interactions
      await page.click('button:text("Tree View")');
      await page.waitForFunction(() => window.currentView === 'tree');

      await page.click('#json-widget .tree-node-toggle');
      await page.waitForFunction(() => window.lastClickedNode !== undefined);

      const clickedNode = await page.evaluate(() => window.lastClickedNode);
      expect(clickedNode.node).toBeDefined();
      expect(clickedNode.path).toBeDefined();
    });

    test('should support multiple widget instances with independent configurations', async ({
      page,
      context,
      apiHelper,
    }) => {
      // Create multiple test JSONs
      const json1 = await apiHelper.uploadJSON(JSON_SAMPLES.simple.content, {
        title: 'Widget Instance 1',
        isPublic: true,
      });
      const json2 = await apiHelper.uploadJSON(JSON_SAMPLES.ecommerce.content, {
        title: 'Widget Instance 2',
        isPublic: true,
      });
      const json3 = await apiHelper.uploadJSON(JSON_SAMPLES.configuration.content, {
        title: 'Widget Instance 3',
        isPublic: true,
      });

      const multiWidgetHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Multiple Widget Instances Test</title>
          <style>
            .widget-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin: 20px;
            }
            
            .widget-container {
              border: 2px solid #ddd;
              border-radius: 8px;
              padding: 10px;
            }
            
            .widget-header {
              background: #f5f5f5;
              margin: -10px -10px 10px -10px;
              padding: 10px;
              font-weight: bold;
            }
            
            .widget-viewer {
              height: 400px;
            }
            
            .full-width {
              grid-column: 1 / -1;
            }
          </style>
        </head>
        <body>
          <h1>Multiple Independent Widget Instances</h1>
          
          <div class="widget-grid">
            <div class="widget-container">
              <div class="widget-header">Simple JSON - Light Theme</div>
              <div id="widget-1" class="widget-viewer"></div>
            </div>
            
            <div class="widget-container">
              <div class="widget-header">E-commerce JSON - Dark Theme</div>
              <div id="widget-2" class="widget-viewer"></div>
            </div>
            
            <div class="widget-container full-width">
              <div class="widget-header">Configuration JSON - Custom Theme</div>
              <div id="widget-3" class="widget-viewer"></div>
            </div>
          </div>
          
          <script src="http://localhost:3000/embed/widget.js"></script>
          <script>
            // Widget 1 - Simple, light theme, tree view
            const widget1 = new JSONViewerWidget({
              container: '#widget-1',
              jsonId: '${json1.id}',
              theme: 'light',
              defaultView: 'tree',
              showToolbar: false,
              expandLevel: 3,
              showDataTypes: false,
              onLoad: () => { window.widget1Loaded = true; }
            });
            
            // Widget 2 - E-commerce, dark theme, list view  
            const widget2 = new JSONViewerWidget({
              container: '#widget-2',
              jsonId: '${json2.id}',
              theme: 'dark',
              defaultView: 'list',
              showToolbar: true,
              enableSearch: true,
              itemsPerPage: 5,
              onLoad: () => { window.widget2Loaded = true; }
            });
            
            // Widget 3 - Configuration, custom theme, editor view
            const widget3 = new JSONViewerWidget({
              container: '#widget-3',
              jsonId: '${json3.id}',
              theme: 'custom',
              customColors: {
                background: '#1a1a2e',
                text: '#eee',
                key: '#16c79a',
                string: '#f39c12',
                number: '#e74c3c',
                boolean: '#9b59b6'
              },
              defaultView: 'editor',
              showToolbar: true,
              enableCopy: true,
              readOnly: true,
              onLoad: () => { window.widget3Loaded = true; }
            });
            
            // Expose widgets for testing
            window.testWidgets = { widget1, widget2, widget3 };
          </script>
        </body>
        </html>
      `;

      await page.goto(`data:text/html,${encodeURIComponent(multiWidgetHtml)}`);

      // Wait for all widgets to load
      await page.waitForFunction(
        () => {
          return window.widget1Loaded && window.widget2Loaded && window.widget3Loaded;
        },
        { timeout: 20000 }
      );

      // Verify all widgets are visible and have correct configurations
      await expect(page.locator('#widget-1 [data-testid="json-viewer"]')).toBeVisible();
      await expect(page.locator('#widget-2 [data-testid="json-viewer"]')).toBeVisible();
      await expect(page.locator('#widget-3 [data-testid="json-viewer"]')).toBeVisible();

      // Verify widget 1 (tree view, no toolbar)
      await expect(page.locator('#widget-1 [data-testid="tree-view"]')).toBeVisible();
      await expect(page.locator('#widget-1 [data-testid="toolbar"]')).not.toBeVisible();
      await expect(page.locator('#widget-1')).toHaveClass(/light-theme/);

      // Verify widget 2 (list view, dark theme, toolbar)
      await expect(page.locator('#widget-2 [data-testid="list-view"]')).toBeVisible();
      await expect(page.locator('#widget-2 [data-testid="toolbar"]')).toBeVisible();
      await expect(page.locator('#widget-2')).toHaveClass(/dark-theme/);

      // Verify widget 3 (editor view, custom theme)
      await expect(page.locator('#widget-3 [data-testid="editor-view"]')).toBeVisible();
      await expect(page.locator('#widget-3 [data-testid="toolbar"]')).toBeVisible();
      await expect(page.locator('#widget-3')).toHaveClass(/custom-theme/);

      // Test that widgets are independent (interactions don't affect others)
      await page.click('#widget-2 [data-testid="search-box"]');
      await page.fill('#widget-2 [data-testid="search-box"]', 'order');

      // Widget 2 should show search highlights
      await expect(page.locator('#widget-2 .search-highlight')).toBeVisible();

      // Widgets 1 and 3 should not be affected
      await expect(page.locator('#widget-1 .search-highlight')).not.toBeVisible();
      await expect(page.locator('#widget-3 .search-highlight')).not.toBeVisible();

      // Test independent theme changes
      await page.evaluate(() => {
        window.testWidgets.widget1.setTheme('dark');
      });

      await expect(page.locator('#widget-1')).toHaveClass(/dark-theme/);
      await expect(page.locator('#widget-2')).toHaveClass(/dark-theme/); // Should remain dark
      await expect(page.locator('#widget-3')).toHaveClass(/custom-theme/); // Should remain custom
    });

    test('should implement widget lifecycle management and cleanup', async ({
      page,
      context,
      apiHelper,
    }) => {
      const testData = JSON_SAMPLES.mixedTypes.content;
      const uploadResponse = await apiHelper.uploadJSON(testData, {
        title: 'Lifecycle Test JSON',
        isPublic: true,
      });

      const jsonId = uploadResponse.id;

      const lifecycleHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Widget Lifecycle Test</title>
          <style>
            #widget-container { 
              height: 500px; 
              border: 1px solid #ccc; 
              margin: 20px 0; 
            }
            .controls { text-align: center; margin: 20px 0; }
            .controls button { margin: 0 10px; padding: 10px 20px; }
            #log { 
              background: #f5f5f5; 
              padding: 10px; 
              height: 200px; 
              overflow-y: auto; 
              font-family: monospace; 
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <h1>Widget Lifecycle Management Test</h1>
          
          <div class="controls">
            <button onclick="createWidget()">Create Widget</button>
            <button onclick="destroyWidget()">Destroy Widget</button>
            <button onclick="recreateWidget()">Recreate Widget</button>
            <button onclick="updateWidget()">Update Configuration</button>
            <button onclick="checkMemory()">Check Memory Usage</button>
          </div>
          
          <div id="widget-container"></div>
          <div id="log"></div>
          
          <script src="http://localhost:3000/embed/widget.js"></script>
          <script>
            let widget = null;
            let creationCount = 0;
            
            function log(message) {
              const logElement = document.getElementById('log');
              const timestamp = new Date().toLocaleTimeString();
              logElement.innerHTML += \`[\${timestamp}] \${message}\\n\`;
              logElement.scrollTop = logElement.scrollHeight;
            }
            
            function createWidget() {
              if (widget) {
                log('Widget already exists, destroying first...');
                widget.destroy();
              }
              
              creationCount++;
              log(\`Creating widget instance #\${creationCount}\`);
              
              widget = new JSONViewerWidget({
                container: '#widget-container',
                jsonId: '${jsonId}',
                theme: 'light',
                defaultView: 'tree',
                showToolbar: true,
                
                onLoad: function(data) {
                  log('Widget loaded successfully');
                  window.widgetInstanceActive = true;
                },
                
                onDestroy: function() {
                  log('Widget destroyed');
                  window.widgetInstanceActive = false;
                },
                
                onError: function(error) {
                  log('Widget error: ' + error.message);
                }
              });
              
              window.currentWidget = widget;
            }
            
            function destroyWidget() {
              if (widget) {
                log('Destroying widget...');
                widget.destroy();
                widget = null;
                window.currentWidget = null;
                
                // Clear container
                document.getElementById('widget-container').innerHTML = '';
              } else {
                log('No widget to destroy');
              }
            }
            
            function recreateWidget() {
              log('Recreating widget...');
              destroyWidget();
              setTimeout(createWidget, 100); // Small delay to ensure cleanup
            }
            
            function updateWidget() {
              if (widget) {
                log('Updating widget configuration...');
                widget.updateConfig({
                  theme: widget.getConfig().theme === 'light' ? 'dark' : 'light',
                  expandLevel: Math.floor(Math.random() * 5) + 1
                });
                log('Widget configuration updated');
              } else {
                log('No widget to update');
              }
            }
            
            function checkMemory() {
              if (window.performance && window.performance.memory) {
                const memory = window.performance.memory;
                log(\`Memory - Used: \${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB, Total: \${Math.round(memory.totalJSHeapSize / 1024 / 1024)}MB\`);
              } else {
                log('Memory information not available');
              }
              
              // Check for memory leaks
              const elements = document.querySelectorAll('[data-widget-instance]');
              log(\`Active widget DOM elements: \${elements.length}\`);
            }
            
            // Auto-create initial widget
            createWidget();
          </script>
        </body>
        </html>
      `;

      await page.goto(`data:text/html,${encodeURIComponent(lifecycleHtml)}`);

      // Wait for initial widget to load
      await page.waitForFunction(() => window.widgetInstanceActive === true);

      // Test widget creation
      await expect(page.locator('#widget-container [data-testid="json-viewer"]')).toBeVisible();

      // Test widget destruction
      await page.click('button:text("Destroy Widget")');
      await page.waitForFunction(() => window.widgetInstanceActive === false);
      await expect(page.locator('#widget-container [data-testid="json-viewer"]')).not.toBeVisible();

      // Test widget recreation
      await page.click('button:text("Recreate Widget")');
      await page.waitForFunction(() => window.widgetInstanceActive === true);
      await expect(page.locator('#widget-container [data-testid="json-viewer"]')).toBeVisible();

      // Test configuration updates
      await page.click('button:text("Update Configuration")');
      await expect(page.locator('#widget-container')).toHaveClass(/dark-theme|light-theme/);

      // Test multiple recreations to check for memory leaks
      for (let i = 0; i < 5; i++) {
        await page.click('button:text("Recreate Widget")');
        await page.waitForFunction(() => window.widgetInstanceActive === true);
        await page.click('button:text("Check Memory")');
      }

      // Verify log shows proper lifecycle events
      const logContent = await page.locator('#log').textContent();
      expect(logContent).toContain('Widget loaded successfully');
      expect(logContent).toContain('Widget destroyed');
      expect(logContent).toContain('Creating widget instance');

      // Check for excessive DOM elements (potential memory leaks)
      const domElementCount = await page.evaluate(() => {
        return document.querySelectorAll('[data-widget-instance]').length;
      });
      expect(domElementCount).toBeLessThan(10); // Should not accumulate many elements
    });
  });

  test.describe('Cross-Browser and Compatibility Testing', () => {
    test('should work consistently across different browsers and JavaScript engines', async ({
      page,
      context,
      apiHelper,
      browserName,
    }) => {
      const testData = JSON_SAMPLES.ecommerce.content;
      const uploadResponse = await apiHelper.uploadJSON(testData, {
        title: `Cross-Browser Test - ${browserName}`,
        isPublic: true,
      });

      const jsonId = uploadResponse.id;

      const compatibilityHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Cross-Browser Compatibility Test - \${browserName}</title>
          <style>
            .test-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin: 20px;
            }
            
            .test-container {
              border: 1px solid #ccc;
              padding: 10px;
              min-height: 400px;
            }
          </style>
        </head>
        <body>
          <h1>Cross-Browser Test - \${browserName}</h1>
          
          <div class="test-grid">
            <div class="test-container">
              <h3>Iframe Embed</h3>
              <iframe 
                src="http://localhost:3000/embed/\${jsonId}?theme=light&view=tree" 
                width="100%" 
                height="350"
                frameborder="0">
              </iframe>
            </div>
            
            <div class="test-container">
              <h3>JavaScript Widget</h3>
              <div id="js-widget" style="height: 350px;"></div>
            </div>
          </div>
          
          <div id="browser-info"></div>
          <div id="compatibility-results"></div>
          
          <script src="http://localhost:3000/embed/widget.js"></script>
          <script>
            // Detect browser and capabilities
            const browserInfo = {
              userAgent: navigator.userAgent,
              browserName: '\${browserName}',
              supportsES6: (() => {
                try {
                  eval('const test = () => {}');
                  return true;
                } catch (e) {
                  return false;
                }
              })(),
              supportsModules: 'noModule' in document.createElement('script'),
              supportsCustomElements: 'customElements' in window,
              supportsIntersectionObserver: 'IntersectionObserver' in window,
              supportsResizeObserver: 'ResizeObserver' in window
            };
            
            document.getElementById('browser-info').innerHTML = 
              '<h3>Browser Capabilities</h3>' +
              '<pre>' + JSON.stringify(browserInfo, null, 2) + '</pre>';
            
            // Initialize widget with feature detection
            const widgetConfig = {
              container: '#js-widget',
              jsonId: '\${jsonId}',
              theme: 'dark',
              defaultView: 'list',
              
              // Enable features based on browser support
              virtualScrolling: browserInfo.supportsIntersectionObserver,
              animations: browserInfo.supportsCustomElements,
              
              onLoad: function(data) {
                console.log('Widget loaded in', browserInfo.browserName);
                window.widgetLoadedSuccessfully = true;
                
                // Test browser-specific functionality
                setTimeout(testBrowserFeatures, 1000);
              },
              
              onError: function(error) {
                console.error('Widget error in', browserInfo.browserName, ':', error);
                window.widgetError = error;
              }
            };
            
            const widget = new JSONViewerWidget(widgetConfig);
            
            function testBrowserFeatures() {
              const results = {
                iframeLoaded: document.querySelector('iframe').contentDocument !== null,
                widgetLoaded: window.widgetLoadedSuccessfully,
                domManipulation: testDOMManipulation(),
                eventHandling: testEventHandling(),
                cssSupport: testCSSSupport(),
                performanceAPI: testPerformanceAPI()
              };
              
              document.getElementById('compatibility-results').innerHTML = 
                '<h3>Compatibility Test Results</h3>' +
                '<pre>' + JSON.stringify(results, null, 2) + '</pre>';
                
              window.compatibilityResults = results;
            }
            
            function testDOMManipulation() {
              try {
                const testDiv = document.createElement('div');
                testDiv.className = 'test-element';
                testDiv.textContent = 'DOM test';
                document.body.appendChild(testDiv);
                const found = document.querySelector('.test-element');
                document.body.removeChild(testDiv);
                return found !== null;
              } catch (e) {
                return false;
              }
            }
            
            function testEventHandling() {
              try {
                let eventTriggered = false;
                const testHandler = () => { eventTriggered = true; };
                document.addEventListener('test-event', testHandler);
                document.dispatchEvent(new Event('test-event'));
                document.removeEventListener('test-event', testHandler);
                return eventTriggered;
              } catch (e) {
                return false;
              }
            }
            
            function testCSSSupport() {
              try {
                const testDiv = document.createElement('div');
                testDiv.style.display = 'flex';
                return testDiv.style.display === 'flex';
              } catch (e) {
                return false;
              }
            }
            
            function testPerformanceAPI() {
              return 'performance' in window && 'now' in window.performance;
            }
            
            window.testWidget = widget;
          </script>
        </body>
        </html>
      `;

      await page.goto(`data:text/html,${encodeURIComponent(compatibilityHtml)}`);

      // Wait for both iframe and widget to load
      const iframe = page.frameLocator('iframe');
      await expect(iframe.locator('[data-testid="json-viewer"]')).toBeVisible({ timeout: 15000 });

      await page.waitForFunction(() => window.widgetLoadedSuccessfully === true, {
        timeout: 15000,
      });
      await expect(page.locator('#js-widget [data-testid="json-viewer"]')).toBeVisible();

      // Wait for compatibility tests to complete
      await page.waitForFunction(() => window.compatibilityResults !== undefined, {
        timeout: 10000,
      });

      const compatibilityResults = await page.evaluate(() => window.compatibilityResults);

      // Verify core functionality works across browsers
      expect(compatibilityResults.iframeLoaded).toBe(true);
      expect(compatibilityResults.widgetLoaded).toBe(true);
      expect(compatibilityResults.domManipulation).toBe(true);
      expect(compatibilityResults.eventHandling).toBe(true);
      expect(compatibilityResults.cssSupport).toBe(true);

      // Test widget interactions work across browsers
      await page.click('#js-widget [data-testid="toolbar"] button');
      await expect(page.locator('#js-widget [data-testid="search-box"]')).toBeVisible();

      // Test iframe interactions
      await iframe.locator('[data-testid="toolbar"] [data-testid="expand-all"]').click();
      await expect(iframe.locator('.tree-node.expanded')).toHaveCount({ min: 1 });

      console.log(`Cross-browser test completed for ${browserName}:`, compatibilityResults);
    });
  });
});
