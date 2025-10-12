import { test, expect } from '../../utils/base-test';
import { JSON_SAMPLES } from '../../fixtures/json-samples';

test.describe('Developer - Embeddable Script with Data Attributes', () => {
  test.describe('Basic Data Attribute Integration', () => {
    test('should initialize JSON viewer from data attributes on DOM elements', async ({
      page,
      context,
      apiHelper,
    }) => {
      const testData = JSON_SAMPLES.ecommerce.content;
      const uploadResponse = await apiHelper.uploadJSON(testData, {
        title: 'Data Attributes Test',
        isPublic: true,
      });

      const jsonId = uploadResponse.id;

      // Create page with data attribute integration
      const dataAttributeHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Data Attributes Integration Test</title>
          <style>
            .json-container {
              margin: 20px 0;
              border: 1px solid #ccc;
              border-radius: 8px;
              padding: 10px;
            }
            
            .container-header {
              background: #f5f5f5;
              margin: -10px -10px 10px -10px;
              padding: 10px;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <h1>Automatic JSON Viewer Initialization via Data Attributes</h1>
          
          <!-- Basic data-json-id integration -->
          <div class="json-container">
            <div class="container-header">Basic JSON ID Reference</div>
            <div 
              data-json-viewer
              data-json-id="${jsonId}"
              data-theme="light"
              data-view="tree"
              style="height: 300px;">
            </div>
          </div>

          <!-- Inline JSON content -->
          <div class="json-container">
            <div class="container-header">Inline JSON Content</div>
            <div 
              data-json-viewer
              data-json-content='${JSON.stringify(JSON_SAMPLES.simple.content)}'
              data-theme="dark"
              data-view="list"
              data-toolbar="true"
              style="height: 250px;">
            </div>
          </div>

          <!-- JSON from URL -->
          <div class="json-container">
            <div class="container-header">JSON from External URL</div>
            <div 
              data-json-viewer
              data-json-url="http://localhost:3000/api/json/${jsonId}/content"
              data-theme="github"
              data-view="editor"
              data-read-only="true"
              data-show-line-numbers="true"
              style="height: 400px;">
            </div>
          </div>

          <!-- Advanced configuration -->
          <div class="json-container">
            <div class="container-header">Advanced Configuration</div>
            <div 
              data-json-viewer
              data-json-id="${jsonId}"
              data-theme="custom"
              data-primary-color="#667eea"
              data-secondary-color="#764ba2"
              data-text-color="#ffffff"
              data-view="flow"
              data-layout="split"
              data-toolbar="true"
              data-search="true"
              data-expand-level="2"
              data-enable-zoom="true"
              data-show-minimap="true"
              style="height: 500px;">
            </div>
          </div>

          <!-- Script loading and auto-initialization -->
          <script src="http://localhost:3000/embed/auto-init.js" data-auto-init="true"></script>
          
          <script>
            // Verify initialization events
            let initCount = 0;
            
            document.addEventListener('jsonViewer:initialized', function(event) {
              initCount++;
              console.log('JSON Viewer initialized:', event.detail);
              
              // Store initialization data for testing
              if (!window.initializedViewers) window.initializedViewers = [];
              window.initializedViewers.push(event.detail);
            });
            
            // Custom initialization callback
            window.jsonViewerCallback = function(viewer, element) {
              console.log('Custom callback triggered for:', element);
              element.classList.add('initialized');
              
              // Store callback data for testing
              if (!window.callbackData) window.callbackData = [];
              window.callbackData.push({ viewer, element: element.tagName });
            };
            
            // Wait for all viewers to initialize
            setTimeout(() => {
              window.totalInitialized = initCount;
            }, 3000);
          </script>
        </body>
        </html>
      `;

      await page.goto(`data:text/html,${encodeURIComponent(dataAttributeHtml)}`);

      // Wait for auto-initialization to complete
      await page.waitForFunction(
        () => {
          return window.totalInitialized >= 4; // Expecting 4 viewers
        },
        { timeout: 15000 }
      );

      // Verify all viewers are initialized and visible
      const viewers = page.locator('[data-json-viewer]');
      await expect(viewers).toHaveCount(4);

      for (let i = 0; i < 4; i++) {
        const viewer = viewers.nth(i);
        await expect(viewer.locator('[data-testid="json-viewer"]')).toBeVisible();
        await expect(viewer).toHaveClass(/initialized/);
      }

      // Verify different themes are applied
      await expect(viewers.nth(0)).toHaveAttribute('data-theme', 'light');
      await expect(viewers.nth(1)).toHaveAttribute('data-theme', 'dark');
      await expect(viewers.nth(2)).toHaveAttribute('data-theme', 'github');
      await expect(viewers.nth(3)).toHaveAttribute('data-theme', 'custom');

      // Verify different view modes
      await expect(viewers.nth(0).locator('[data-testid="tree-view"]')).toBeVisible();
      await expect(viewers.nth(1).locator('[data-testid="list-view"]')).toBeVisible();
      await expect(viewers.nth(2).locator('[data-testid="editor-view"]')).toBeVisible();
      await expect(viewers.nth(3).locator('[data-testid="flow-view"]')).toBeVisible();

      // Test callback functionality
      const callbackData = await page.evaluate(() => window.callbackData);
      expect(callbackData).toBeDefined();
      expect(callbackData.length).toBe(4);

      // Verify initialization data
      const initializedViewers = await page.evaluate(() => window.initializedViewers);
      expect(initializedViewers).toBeDefined();
      expect(initializedViewers.length).toBe(4);

      initializedViewers.forEach((viewer) => {
        expect(viewer).toHaveProperty('element');
        expect(viewer).toHaveProperty('config');
        expect(viewer).toHaveProperty('instance');
      });
    });

    test('should support dynamic data attribute updates and re-initialization', async ({
      page,
      context,
      apiHelper,
    }) => {
      const json1 = await apiHelper.uploadJSON(JSON_SAMPLES.simple.content, {
        title: 'Dynamic Update Test 1',
        isPublic: true,
      });
      const json2 = await apiHelper.uploadJSON(JSON_SAMPLES.nested.content, {
        title: 'Dynamic Update Test 2',
        isPublic: true,
      });

      const dynamicUpdateHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Dynamic Data Attribute Updates</title>
          <style>
            .update-controls {
              margin: 20px 0;
              padding: 20px;
              background: #f9f9f9;
              border-radius: 8px;
            }
            
            .control-group {
              margin: 10px 0;
            }
            
            .control-group button {
              margin: 5px;
              padding: 8px 15px;
              cursor: pointer;
            }
            
            .viewer-container {
              height: 400px;
              border: 2px solid #ddd;
              border-radius: 8px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <h1>Dynamic Data Attribute Updates</h1>
          
          <div class="update-controls">
            <div class="control-group">
              <strong>Change JSON Source:</strong>
              <button onclick="updateJsonId('${json1.id}')">Load JSON 1</button>
              <button onclick="updateJsonId('${json2.id}')">Load JSON 2</button>
              <button onclick="updateInlineJson()">Load Inline JSON</button>
            </div>
            
            <div class="control-group">
              <strong>Change Theme:</strong>
              <button onclick="updateTheme('light')">Light</button>
              <button onclick="updateTheme('dark')">Dark</button>
              <button onclick="updateTheme('github')">GitHub</button>
              <button onclick="updateTheme('custom')">Custom</button>
            </div>
            
            <div class="control-group">
              <strong>Change View:</strong>
              <button onclick="updateView('tree')">Tree</button>
              <button onclick="updateView('list')">List</button>
              <button onclick="updateView('editor')">Editor</button>
              <button onclick="updateView('flow')">Flow</button>
            </div>
            
            <div class="control-group">
              <strong>Toggle Features:</strong>
              <button onclick="toggleToolbar()">Toggle Toolbar</button>
              <button onclick="toggleSearch()">Toggle Search</button>
              <button onclick="toggleLineNumbers()">Toggle Line Numbers</button>
            </div>
          </div>
          
          <div 
            id="dynamic-viewer"
            class="viewer-container"
            data-json-viewer
            data-json-id="${json1.id}"
            data-theme="light"
            data-view="tree"
            data-toolbar="false"
            data-search="false"
            data-auto-reload="true">
          </div>
          
          <div id="update-log"></div>
          
          <script src="http://localhost:3000/embed/auto-init.js" data-auto-init="true"></script>
          
          <script>
            const viewer = document.getElementById('dynamic-viewer');
            const updateLog = document.getElementById('update-log');
            let updateCount = 0;
            
            function logUpdate(message) {
              updateCount++;
              const timestamp = new Date().toLocaleTimeString();
              updateLog.innerHTML += \`<p>[\${timestamp}] Update #\${updateCount}: \${message}</p>\`;
              
              // Store for testing
              window.updateHistory = window.updateHistory || [];
              window.updateHistory.push({ count: updateCount, message, timestamp });
            }
            
            function updateJsonId(jsonId) {
              viewer.setAttribute('data-json-id', jsonId);
              logUpdate(\`Changed JSON ID to \${jsonId}\`);
              triggerReinitialization();
            }
            
            function updateInlineJson() {
              viewer.removeAttribute('data-json-id');
              viewer.setAttribute('data-json-content', JSON.stringify({
                dynamic: true,
                timestamp: new Date().toISOString(),
                data: ['item1', 'item2', 'item3']
              }));
              logUpdate('Changed to inline JSON content');
              triggerReinitialization();
            }
            
            function updateTheme(theme) {
              viewer.setAttribute('data-theme', theme);
              if (theme === 'custom') {
                viewer.setAttribute('data-primary-color', '#' + Math.floor(Math.random()*16777215).toString(16));
                viewer.setAttribute('data-secondary-color', '#' + Math.floor(Math.random()*16777215).toString(16));
              }
              logUpdate(\`Changed theme to \${theme}\`);
              triggerReinitialization();
            }
            
            function updateView(view) {
              viewer.setAttribute('data-view', view);
              logUpdate(\`Changed view to \${view}\`);
              triggerReinitialization();
            }
            
            function toggleToolbar() {
              const current = viewer.getAttribute('data-toolbar') === 'true';
              viewer.setAttribute('data-toolbar', (!current).toString());
              logUpdate(\`Toolbar: \${!current}\`);
              triggerReinitialization();
            }
            
            function toggleSearch() {
              const current = viewer.getAttribute('data-search') === 'true';
              viewer.setAttribute('data-search', (!current).toString());
              logUpdate(\`Search: \${!current}\`);
              triggerReinitialization();
            }
            
            function toggleLineNumbers() {
              const current = viewer.getAttribute('data-show-line-numbers') === 'true';
              viewer.setAttribute('data-show-line-numbers', (!current).toString());
              logUpdate(\`Line Numbers: \${!current}\`);
              triggerReinitialization();
            }
            
            function triggerReinitialization() {
              // Dispatch custom event to trigger re-initialization
              viewer.dispatchEvent(new CustomEvent('jsonViewer:reinitialize'));
              
              // Store current config for testing
              window.currentConfig = {
                jsonId: viewer.getAttribute('data-json-id'),
                jsonContent: viewer.getAttribute('data-json-content'),
                theme: viewer.getAttribute('data-theme'),
                view: viewer.getAttribute('data-view'),
                toolbar: viewer.getAttribute('data-toolbar'),
                search: viewer.getAttribute('data-search')
              };
            }
            
            // Listen for reinitialization events
            document.addEventListener('jsonViewer:reinitialized', function(event) {
              logUpdate('Viewer reinitialized successfully');
              window.lastReinitEvent = event.detail;
            });
            
            // Initial configuration
            window.currentConfig = {
              jsonId: '${json1.id}',
              theme: 'light',
              view: 'tree',
              toolbar: 'false',
              search: 'false'
            };
          </script>
        </body>
        </html>
      `;

      await page.goto(`data:text/html,${encodeURIComponent(dynamicUpdateHtml)}`);

      // Wait for initial viewer to load
      await expect(page.locator('#dynamic-viewer [data-testid="json-viewer"]')).toBeVisible({
        timeout: 10000,
      });

      // Test JSON source updates
      await page.click('button:text("Load JSON 2")');
      await page.waitForTimeout(2000);

      let currentConfig = await page.evaluate(() => window.currentConfig);
      expect(currentConfig.jsonId).toBe(json2.id);

      await page.click('button:text("Load Inline JSON")');
      await page.waitForTimeout(2000);

      currentConfig = await page.evaluate(() => window.currentConfig);
      expect(currentConfig.jsonContent).toContain('"dynamic":true');

      // Test theme updates
      await page.click('button:text("Dark")');
      await page.waitForTimeout(2000);

      currentConfig = await page.evaluate(() => window.currentConfig);
      expect(currentConfig.theme).toBe('dark');
      await expect(page.locator('#dynamic-viewer')).toHaveAttribute('data-theme', 'dark');

      // Test view updates
      await page.click('button:text("List")');
      await page.waitForTimeout(2000);

      await expect(page.locator('#dynamic-viewer [data-testid="list-view"]')).toBeVisible();

      // Test feature toggles
      await page.click('button:text("Toggle Toolbar")');
      await page.waitForTimeout(2000);

      currentConfig = await page.evaluate(() => window.currentConfig);
      expect(currentConfig.toolbar).toBe('true');
      await expect(page.locator('#dynamic-viewer [data-testid="toolbar"]')).toBeVisible();

      // Verify update history
      const updateHistory = await page.evaluate(() => window.updateHistory);
      expect(updateHistory.length).toBeGreaterThan(5);
      expect(updateHistory.some((update) => update.message.includes('JSON ID'))).toBe(true);
      expect(updateHistory.some((update) => update.message.includes('theme'))).toBe(true);
      expect(updateHistory.some((update) => update.message.includes('view'))).toBe(true);
    });

    test('should handle error states and validation in data attribute configuration', async ({
      page,
      context,
      apiHelper,
    }) => {
      const validJsonId = (
        await apiHelper.uploadJSON(JSON_SAMPLES.simple.content, {
          title: 'Valid JSON',
          isPublic: true,
        })
      ).id;

      const errorHandlingHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Error Handling and Validation Test</title>
          <style>
            .test-case {
              margin: 20px 0;
              border: 1px solid #ccc;
              border-radius: 8px;
              padding: 15px;
            }
            
            .test-case h3 {
              margin-top: 0;
              color: #333;
            }
            
            .error-indicator {
              background: #ffe6e6;
              border: 1px solid #ff9999;
              padding: 10px;
              border-radius: 4px;
              margin: 10px 0;
              color: #cc0000;
            }
            
            .viewer-container {
              height: 200px;
              border: 1px solid #ddd;
              background: #fafafa;
            }
          </style>
        </head>
        <body>
          <h1>Error Handling and Validation Tests</h1>
          
          <!-- Test Case 1: Invalid JSON ID -->
          <div class="test-case">
            <h3>Test 1: Invalid JSON ID</h3>
            <div 
              data-json-viewer
              data-json-id="invalid-json-id-12345"
              data-theme="light"
              data-view="tree"
              data-show-errors="true"
              class="viewer-container">
            </div>
          </div>

          <!-- Test Case 2: Malformed JSON Content -->
          <div class="test-case">
            <h3>Test 2: Malformed JSON Content</h3>
            <div 
              data-json-viewer
              data-json-content='{"invalid": json, "missing": quotes}'
              data-theme="light"
              data-view="tree"
              data-show-errors="true"
              class="viewer-container">
            </div>
          </div>

          <!-- Test Case 3: Network Error (Invalid URL) -->
          <div class="test-case">
            <h3>Test 3: Network Error</h3>
            <div 
              data-json-viewer
              data-json-url="http://localhost:3000/api/json/nonexistent/content"
              data-theme="light"
              data-view="tree"
              data-show-errors="true"
              data-retry-attempts="3"
              class="viewer-container">
            </div>
          </div>

          <!-- Test Case 4: Missing Required Attributes -->
          <div class="test-case">
            <h3>Test 4: Missing Data Source</h3>
            <div 
              data-json-viewer
              data-theme="light"
              data-view="tree"
              data-show-errors="true"
              class="viewer-container">
            </div>
          </div>

          <!-- Test Case 5: Invalid Configuration Values -->
          <div class="test-case">
            <h3>Test 5: Invalid Configuration</h3>
            <div 
              data-json-viewer
              data-json-id="${validJsonId}"
              data-theme="invalid-theme"
              data-view="invalid-view"
              data-height="-100"
              data-expand-level="invalid-number"
              data-show-errors="true"
              class="viewer-container">
            </div>
          </div>

          <!-- Test Case 6: Fallback Configuration -->
          <div class="test-case">
            <h3>Test 6: Fallback Handling</h3>
            <div 
              data-json-viewer
              data-json-id="invalid-primary-id"
              data-fallback-json-id="${validJsonId}"
              data-fallback-content='{"fallback": true, "message": "Primary source failed"}'
              data-theme="light"
              data-view="tree"
              data-show-errors="true"
              class="viewer-container">
            </div>
          </div>
          
          <script src="http://localhost:3000/embed/auto-init.js" data-auto-init="true"></script>
          
          <script>
            const errorLog = [];
            let initializationComplete = 0;
            let expectedInitializations = 6;
            
            // Listen for error events
            document.addEventListener('jsonViewer:error', function(event) {
              console.error('JSON Viewer Error:', event.detail);
              errorLog.push({
                type: 'error',
                element: event.target,
                error: event.detail,
                timestamp: new Date().toISOString()
              });
              
              // Add visual error indicator
              const errorDiv = document.createElement('div');
              errorDiv.className = 'error-indicator';
              errorDiv.textContent = \`Error: \${event.detail.message || event.detail.toString()}\`;
              event.target.appendChild(errorDiv);
            });
            
            // Listen for successful initializations  
            document.addEventListener('jsonViewer:initialized', function(event) {
              initializationComplete++;
              console.log('Viewer initialized:', event.target);
            });
            
            // Listen for fallback events
            document.addEventListener('jsonViewer:fallback', function(event) {
              console.log('Fallback triggered:', event.detail);
              errorLog.push({
                type: 'fallback',
                element: event.target,
                fallback: event.detail,
                timestamp: new Date().toISOString()
              });
            });
            
            // Wait for all initialization attempts to complete
            setTimeout(() => {
              window.errorTestResults = {
                totalErrors: errorLog.filter(e => e.type === 'error').length,
                totalFallbacks: errorLog.filter(e => e.type === 'fallback').length,
                totalInitialized: initializationComplete,
                errorLog: errorLog
              };
              
              console.log('Error test results:', window.errorTestResults);
            }, 5000);
          </script>
        </body>
        </html>
      `;

      await page.goto(`data:text/html,${encodeURIComponent(errorHandlingHtml)}`);

      // Wait for error handling to complete
      await page.waitForFunction(
        () => {
          return window.errorTestResults !== undefined;
        },
        { timeout: 10000 }
      );

      const errorResults = await page.evaluate(() => window.errorTestResults);

      // Verify error handling
      expect(errorResults.totalErrors).toBeGreaterThan(0);
      expect(errorResults.errorLog.length).toBeGreaterThan(0);

      // Check that error indicators are displayed
      const errorIndicators = page.locator('.error-indicator');
      await expect(errorIndicators).toHaveCount({ min: 4 }); // Expecting multiple errors

      // Verify specific error cases
      const errorMessages = await errorIndicators.allTextContents();
      expect(errorMessages.some((msg) => msg.includes('Error:'))).toBe(true);

      // Check that at least one viewer initialized successfully (fallback case)
      expect(errorResults.totalInitialized).toBeGreaterThanOrEqual(1);

      // Verify fallback mechanism worked
      if (errorResults.totalFallbacks > 0) {
        const fallbackViewer = page
          .locator('.test-case')
          .nth(5)
          .locator('[data-testid="json-viewer"]');
        await expect(fallbackViewer).toBeVisible();
      }

      console.log('Error handling test results:', errorResults);
    });
  });

  test.describe('Advanced Data Attribute Features', () => {
    test('should support conditional loading and lazy initialization', async ({
      page,
      context,
      apiHelper,
    }) => {
      const json1 = await apiHelper.uploadJSON(JSON_SAMPLES.ecommerce.content, {
        title: 'Conditional Load Test 1',
        isPublic: true,
      });
      const json2 = await apiHelper.uploadJSON(JSON_SAMPLES.analytics.content, {
        title: 'Conditional Load Test 2',
        isPublic: true,
      });

      const conditionalLoadingHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Conditional Loading and Lazy Initialization</title>
          <style>
            .section {
              margin: 30px 0;
              padding: 20px;
              border: 1px solid #ddd;
              border-radius: 8px;
            }
            
            .controls {
              margin: 15px 0;
            }
            
            .controls button {
              margin: 5px;
              padding: 8px 15px;
            }
            
            .viewer-placeholder {
              height: 300px;
              border: 2px dashed #ccc;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #666;
              font-style: italic;
            }
            
            .viewer-container {
              height: 300px;
              border: 1px solid #ccc;
            }
            
            .loading-indicator {
              text-align: center;
              padding: 20px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <h1>Conditional Loading and Lazy Initialization Tests</h1>
          
          <!-- Conditional Loading Based on User Action -->
          <div class="section">
            <h3>Conditional Loading - User Triggered</h3>
            <div class="controls">
              <button onclick="loadViewer1()">Load E-commerce Data</button>
              <button onclick="loadViewer2()">Load Analytics Data</button>
              <button onclick="clearViewer1()">Clear Viewer</button>
            </div>
            <div 
              id="conditional-viewer-1"
              data-json-viewer
              data-lazy-load="true"
              data-load-condition="user-action"
              class="viewer-placeholder">
              Click a button above to load JSON data
            </div>
          </div>

          <!-- Intersection Observer Lazy Loading -->
          <div class="section">
            <h3>Intersection Observer Lazy Loading</h3>
            <p>Scroll down to trigger automatic loading when viewer comes into view.</p>
            <div 
              data-json-viewer
              data-json-id="${json1.id}"
              data-lazy-load="true"
              data-load-trigger="intersection"
              data-intersection-threshold="0.5"
              data-theme="dark"
              data-view="tree"
              class="viewer-container">
              <div class="loading-indicator">Loading when 50% visible...</div>
            </div>
          </div>

          <!-- Time-Delayed Loading -->
          <div class="section">
            <h3>Time-Delayed Loading</h3>
            <div 
              data-json-viewer
              data-json-id="${json2.id}"
              data-lazy-load="true"
              data-load-trigger="timer"
              data-load-delay="3000"
              data-theme="light"
              data-view="list"
              class="viewer-container">
              <div class="loading-indicator">Loading in 3 seconds...</div>
            </div>
          </div>

          <!-- Media Query Conditional Loading -->
          <div class="section">
            <h3>Media Query Conditional Loading</h3>
            <div 
              data-json-viewer
              data-json-id="${json1.id}"
              data-lazy-load="true"
              data-load-condition="media-query"
              data-media-query="(min-width: 768px)"
              data-mobile-fallback="true"
              data-theme="github"
              data-view="editor"
              class="viewer-container">
              <div class="loading-indicator">Loading based on screen size...</div>
            </div>
          </div>

          <!-- Dependency-Based Loading -->
          <div class="section">
            <h3>Dependency-Based Loading</h3>
            <div class="controls">
              <button onclick="enableDependency()">Enable Dependency</button>
              <button onclick="disableDependency()">Disable Dependency</button>
            </div>
            <div 
              data-json-viewer
              data-json-content='{"dependency": "example", "loaded": true}'
              data-lazy-load="true"
              data-load-condition="dependency"
              data-dependency="customDependencyMet"
              data-theme="dracula"
              data-view="flow"
              class="viewer-container">
              <div class="loading-indicator">Waiting for dependency...</div>
            </div>
          </div>

          <!-- Create some space for intersection observer testing -->
          <div style="height: 100vh; background: #f0f0f0; display: flex; align-items: center; justify-content: center;">
            <p>Scroll area for intersection observer testing</p>
          </div>
          
          <script src="http://localhost:3000/embed/auto-init.js" data-auto-init="true"></script>
          
          <script>
            let loadingEvents = [];
            let dependencyState = false;
            
            function logLoadingEvent(event, element) {
              const eventData = {
                event,
                element: element.id || element.className,
                timestamp: new Date().toISOString(),
                trigger: element.getAttribute('data-load-trigger'),
                condition: element.getAttribute('data-load-condition')
              };
              
              loadingEvents.push(eventData);
              console.log('Loading event:', eventData);
              
              // Store for testing
              window.loadingEvents = loadingEvents;
            }
            
            // User-triggered loading functions
            function loadViewer1() {
              const viewer = document.getElementById('conditional-viewer-1');
              viewer.setAttribute('data-json-id', '${json1.id}');
              viewer.setAttribute('data-theme', 'light');
              viewer.setAttribute('data-view', 'tree');
              viewer.innerHTML = '';
              
              // Trigger manual initialization
              viewer.dispatchEvent(new CustomEvent('jsonViewer:load'));
              logLoadingEvent('user-triggered-load', viewer);
            }
            
            function loadViewer2() {
              const viewer = document.getElementById('conditional-viewer-1');
              viewer.setAttribute('data-json-id', '${json2.id}');
              viewer.setAttribute('data-theme', 'dark');
              viewer.setAttribute('data-view', 'list');
              viewer.innerHTML = '';
              
              viewer.dispatchEvent(new CustomEvent('jsonViewer:load'));
              logLoadingEvent('user-triggered-load-alt', viewer);
            }
            
            function clearViewer1() {
              const viewer = document.getElementById('conditional-viewer-1');
              viewer.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">Viewer cleared</div>';
              viewer.dispatchEvent(new CustomEvent('jsonViewer:unload'));
              logLoadingEvent('user-triggered-clear', viewer);
            }
            
            // Dependency control functions
            function enableDependency() {
              dependencyState = true;
              window.customDependencyMet = true;
              
              // Trigger dependency check
              document.querySelectorAll('[data-dependency="customDependencyMet"]').forEach(el => {
                el.dispatchEvent(new CustomEvent('jsonViewer:checkDependency'));
                logLoadingEvent('dependency-enabled', el);
              });
            }
            
            function disableDependency() {
              dependencyState = false;
              window.customDependencyMet = false;
              logLoadingEvent('dependency-disabled', document.querySelector('[data-dependency]'));
            }
            
            // Listen for lazy loading events
            document.addEventListener('jsonViewer:lazyLoadTriggered', function(event) {
              logLoadingEvent('lazy-load-triggered', event.target);
              
              // Replace loading indicator
              const loadingIndicator = event.target.querySelector('.loading-indicator');
              if (loadingIndicator) {
                loadingIndicator.textContent = 'Loading JSON viewer...';
              }
            });
            
            document.addEventListener('jsonViewer:lazyLoadComplete', function(event) {
              logLoadingEvent('lazy-load-complete', event.target);
            });
            
            document.addEventListener('jsonViewer:intersectionTriggered', function(event) {
              logLoadingEvent('intersection-triggered', event.target);
            });
            
            document.addEventListener('jsonViewer:timerTriggered', function(event) {
              logLoadingEvent('timer-triggered', event.target);
            });
            
            document.addEventListener('jsonViewer:mediaQueryMatched', function(event) {
              logLoadingEvent('media-query-matched', event.target);
            });
            
            // Set up test completion tracking
            setTimeout(() => {
              window.conditionalLoadingComplete = true;
              window.totalLoadingEvents = loadingEvents.length;
              console.log('Conditional loading test complete. Events:', loadingEvents);
            }, 8000);
          </script>
        </body>
        </html>
      `;

      await page.goto(`data:text/html,${encodeURIComponent(conditionalLoadingHtml)}`);

      // Test user-triggered loading
      await page.click('button:text("Load E-commerce Data")');
      await expect(page.locator('#conditional-viewer-1 [data-testid="json-viewer"]')).toBeVisible({
        timeout: 5000,
      });

      // Test clearing
      await page.click('button:text("Clear Viewer")');
      await expect(
        page.locator('#conditional-viewer-1 [data-testid="json-viewer"]')
      ).not.toBeVisible();

      // Test alternative data loading
      await page.click('button:text("Load Analytics Data")');
      await expect(page.locator('#conditional-viewer-1 [data-testid="json-viewer"]')).toBeVisible();

      // Scroll to trigger intersection observer
      await page.locator('h3:text("Intersection Observer Lazy Loading")').scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);

      // Continue scrolling to trigger the intersection
      await page.evaluate(() => {
        const intersectionViewer = document.querySelector('[data-load-trigger="intersection"]');
        if (intersectionViewer) {
          intersectionViewer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });

      await expect(
        page.locator('[data-load-trigger="intersection"] [data-testid="json-viewer"]')
      ).toBeVisible({ timeout: 5000 });

      // Wait for timer-triggered loading
      await expect(
        page.locator('[data-load-trigger="timer"] [data-testid="json-viewer"]')
      ).toBeVisible({ timeout: 5000 });

      // Test dependency-based loading
      await page.click('button:text("Enable Dependency")');
      await expect(page.locator('[data-dependency] [data-testid="json-viewer"]')).toBeVisible({
        timeout: 3000,
      });

      // Wait for test completion
      await page.waitForFunction(() => window.conditionalLoadingComplete === true, {
        timeout: 10000,
      });

      const loadingEvents = await page.evaluate(() => window.loadingEvents);
      expect(loadingEvents.length).toBeGreaterThan(5);

      // Verify different loading triggers were used
      const eventTypes = loadingEvents.map((e) => e.event);
      expect(eventTypes).toContain('user-triggered-load');
      expect(eventTypes).toContain('lazy-load-triggered');
      expect(eventTypes).toContain('dependency-enabled');

      console.log('Conditional loading events:', loadingEvents);
    });

    test('should support batch initialization and performance optimization', async ({
      page,
      context,
      apiHelper,
    }) => {
      // Create multiple JSON files for batch testing
      const jsonIds = [];
      for (let i = 0; i < 10; i++) {
        const response = await apiHelper.uploadJSON(
          {
            batchTest: true,
            index: i,
            data: Array.from({ length: 50 }, (_, j) => `item-${i}-${j}`),
          },
          { title: `Batch Test JSON ${i}`, isPublic: true }
        );
        jsonIds.push(response.id);
      }

      const batchInitHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Batch Initialization and Performance Test</title>
          <style>
            .performance-stats {
              background: #f5f5f5;
              padding: 15px;
              margin: 20px 0;
              border-radius: 8px;
              font-family: monospace;
              font-size: 14px;
            }
            
            .batch-container {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
              gap: 15px;
              margin: 20px 0;
            }
            
            .viewer-item {
              border: 1px solid #ddd;
              border-radius: 8px;
              height: 250px;
              position: relative;
            }
            
            .viewer-item h4 {
              margin: 0;
              padding: 8px 12px;
              background: #f8f9fa;
              border-bottom: 1px solid #ddd;
              font-size: 12px;
            }
            
            .viewer-content {
              height: calc(100% - 35px);
            }
            
            .batch-controls {
              margin: 20px 0;
              text-align: center;
            }
            
            .batch-controls button {
              margin: 5px;
              padding: 10px 20px;
            }
          </style>
        </head>
        <body>
          <h1>Batch Initialization Performance Test</h1>
          
          <div class="performance-stats">
            <div>Loading Status: <span id="loading-status">Preparing...</span></div>
            <div>Initialized: <span id="initialized-count">0</span>/<span id="total-count">10</span></div>
            <div>Average Init Time: <span id="avg-init-time">0</span>ms</div>
            <div>Total Time: <span id="total-time">0</span>ms</div>
            <div>Memory Usage: <span id="memory-usage">N/A</span></div>
          </div>
          
          <div class="batch-controls">
            <button onclick="startBatchInit()">Start Batch Initialization</button>
            <button onclick="clearAllViewers()">Clear All Viewers</button>
            <button onclick="reinitializeAll()">Reinitialize All</button>
            <button onclick="measurePerformance()">Measure Performance</button>
          </div>
          
          <div class="batch-container">
            ${jsonIds
              .map(
                (id, index) => `
              <div class="viewer-item">
                <h4>Viewer ${index + 1} - ${index % 2 === 0 ? 'Tree' : 'List'} View</h4>
                <div 
                  id="batch-viewer-${index}"
                  class="viewer-content"
                  data-json-viewer
                  data-json-id="${id}"
                  data-theme="${['light', 'dark', 'github'][index % 3]}"
                  data-view="${index % 2 === 0 ? 'tree' : 'list'}"
                  data-batch-init="true"
                  data-lazy-load="true"
                  data-priority="${index < 5 ? 'high' : 'normal'}"
                  data-enable-virtualization="true"
                  data-cache-content="true">
                </div>
              </div>
            `
              )
              .join('')}
          </div>
          
          <script src="http://localhost:3000/embed/auto-init.js" 
                  data-auto-init="false" 
                  data-batch-mode="true"
                  data-max-concurrent="3"
                  data-enable-performance-tracking="true"></script>
          
          <script>
            let initStartTime = 0;
            let initEndTime = 0;
            let initializationTimes = [];
            let initializedCount = 0;
            const totalViewers = 10;
            
            function updateStats() {
              document.getElementById('initialized-count').textContent = initializedCount;
              document.getElementById('total-count').textContent = totalViewers;
              
              if (initializationTimes.length > 0) {
                const avgTime = initializationTimes.reduce((a, b) => a + b, 0) / initializationTimes.length;
                document.getElementById('avg-init-time').textContent = Math.round(avgTime);
              }
              
              if (initStartTime && initEndTime) {
                document.getElementById('total-time').textContent = initEndTime - initStartTime;
              }
              
              // Update memory usage if available
              if (window.performance && window.performance.memory) {
                const memory = window.performance.memory;
                const used = Math.round(memory.usedJSHeapSize / 1024 / 1024);
                document.getElementById('memory-usage').textContent = used + 'MB';
              }
            }
            
            function updateLoadingStatus(status) {
              document.getElementById('loading-status').textContent = status;
            }
            
            function startBatchInit() {
              updateLoadingStatus('Starting batch initialization...');
              initStartTime = performance.now();
              initializationTimes = [];
              initializedCount = 0;
              
              // Trigger batch initialization
              if (window.JSONViewerBatch) {
                window.JSONViewerBatch.initializeAll({
                  priorityOrder: true,
                  maxConcurrent: 3,
                  enableProgress: true
                });
              } else {
                // Fallback: trigger manual initialization
                document.querySelectorAll('[data-json-viewer]').forEach((el, index) => {
                  setTimeout(() => {
                    const startTime = performance.now();
                    el.dispatchEvent(new CustomEvent('jsonViewer:init'));
                    
                    // Simulate initialization timing
                    setTimeout(() => {
                      const endTime = performance.now();
                      initializationTimes.push(endTime - startTime);
                      initializedCount++;
                      
                      if (initializedCount === totalViewers) {
                        initEndTime = performance.now();
                        updateLoadingStatus('Batch initialization complete');
                      }
                      
                      updateStats();
                    }, Math.random() * 1000 + 500); // Random delay 500-1500ms
                  }, index * 100); // Stagger initialization
                });
              }
            }
            
            function clearAllViewers() {
              updateLoadingStatus('Clearing all viewers...');
              document.querySelectorAll('[data-json-viewer]').forEach(el => {
                el.innerHTML = '<div style="text-align: center; padding: 20px; color: #999;">Cleared</div>';
                el.dispatchEvent(new CustomEvent('jsonViewer:destroy'));
              });
              
              initializedCount = 0;
              initializationTimes = [];
              updateStats();
              updateLoadingStatus('All viewers cleared');
            }
            
            function reinitializeAll() {
              clearAllViewers();
              setTimeout(startBatchInit, 1000);
            }
            
            function measurePerformance() {
              const measurements = {
                domNodes: document.querySelectorAll('*').length,
                viewerElements: document.querySelectorAll('[data-json-viewer]').length,
                initializedViewers: document.querySelectorAll('[data-json-viewer] [data-testid="json-viewer"]').length,
                memoryUsage: window.performance && window.performance.memory ? 
                  Math.round(window.performance.memory.usedJSHeapSize / 1024 / 1024) : 'N/A',
                renderTime: performance.now() - initStartTime
              };
              
              console.log('Performance measurements:', measurements);
              window.performanceMeasurements = measurements;
              
              alert(\`Performance Report:\\n\` +
                    \`DOM Nodes: \${measurements.domNodes}\\n\` +
                    \`Viewer Elements: \${measurements.viewerElements}\\n\` +
                    \`Initialized: \${measurements.initializedViewers}\\n\` +
                    \`Memory Usage: \${measurements.memoryUsage}MB\\n\` +
                    \`Total Render Time: \${Math.round(measurements.renderTime)}ms\`);
            }
            
            // Listen for initialization events
            document.addEventListener('jsonViewer:initialized', function(event) {
              const startTime = performance.now();
              initializationTimes.push(startTime - (event.detail.startTime || initStartTime));
              initializedCount++;
              
              if (initializedCount === totalViewers) {
                initEndTime = performance.now();
                updateLoadingStatus('All viewers initialized');
              }
              
              updateStats();
            });
            
            document.addEventListener('jsonViewer:batchProgress', function(event) {
              const progress = event.detail;
              updateLoadingStatus(\`Initializing... \${progress.completed}/\${progress.total}\`);
            });
            
            // Auto-start after page load
            setTimeout(() => {
              updateLoadingStatus('Ready for batch initialization');
              updateStats();
            }, 1000);
          </script>
        </body>
        </html>
      `;

      await page.goto(`data:text/html,${encodeURIComponent(batchInitHtml)}`);

      // Wait for page setup
      await page.waitForTimeout(2000);

      // Start batch initialization
      await page.click('button:text("Start Batch Initialization")');

      // Wait for batch initialization to complete
      await page.waitForFunction(
        () => {
          const status = document.getElementById('loading-status').textContent;
          return status.includes('complete') || status.includes('All viewers initialized');
        },
        { timeout: 20000 }
      );

      // Verify all viewers are initialized
      const viewerCount = await page
        .locator('[data-json-viewer] [data-testid="json-viewer"]')
        .count();
      expect(viewerCount).toBe(10);

      // Check performance measurements
      await page.click('button:text("Measure Performance")');
      await page.waitForTimeout(1000);

      const measurements = await page.evaluate(() => window.performanceMeasurements);
      expect(measurements).toBeDefined();
      expect(measurements.initializedViewers).toBe(10);
      expect(measurements.viewerElements).toBe(10);

      // Test batch clearing and reinitialization
      await page.click('button:text("Clear All Viewers")');
      await page.waitForTimeout(1000);

      const clearedCount = await page
        .locator('[data-json-viewer] [data-testid="json-viewer"]')
        .count();
      expect(clearedCount).toBe(0);

      await page.click('button:text("Reinitialize All")');
      await page.waitForFunction(
        () => {
          const status = document.getElementById('loading-status').textContent;
          return status.includes('complete');
        },
        { timeout: 20000 }
      );

      const reinitializedCount = await page
        .locator('[data-json-viewer] [data-testid="json-viewer"]')
        .count();
      expect(reinitializedCount).toBe(10);

      console.log('Batch initialization performance measurements:', measurements);
    });
  });
});
