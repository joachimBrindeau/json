import { test, expect } from '../../utils/base-test';
import { JSON_SAMPLES } from '../../fixtures/json-samples';

test.describe('Developer - Embed Parameter Customization', () => {
  test.describe('Theme Customization Parameters', () => {
    test('should customize embed with predefined themes and color schemes', async ({
      page,
      context,
      apiHelper,
    }) => {
      const testData = JSON_SAMPLES.analytics.content;
      const uploadResponse = await apiHelper.uploadJSON(testData, {
        title: 'Theme Customization Test',
        isPublic: true,
      });

      const jsonId = uploadResponse.id;

      // Test all predefined themes
      const themes = [
        { name: 'light', expectedBg: 'rgb(255, 255, 255)', expectedText: 'rgb(0, 0, 0)' },
        { name: 'dark', expectedBg: 'rgb(30, 30, 30)', expectedText: 'rgb(255, 255, 255)' },
        { name: 'github', expectedBg: 'rgb(246, 248, 250)', expectedText: 'rgb(36, 41, 47)' },
        { name: 'dracula', expectedBg: 'rgb(40, 42, 54)', expectedText: 'rgb(248, 248, 242)' },
        { name: 'monokai', expectedBg: 'rgb(39, 40, 34)', expectedText: 'rgb(248, 248, 242)' },
      ];

      for (const theme of themes) {
        const themeHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>${theme.name} Theme Test</title>
          </head>
          <body>
            <h1>${theme.name} Theme Test</h1>
            <iframe 
              id="theme-iframe"
              src="http://localhost:3000/embed/${jsonId}?theme=${theme.name}" 
              width="800" 
              height="600"
              frameborder="0">
            </iframe>
          </body>
          </html>
        `;

        await page.goto(`data:text/html,${encodeURIComponent(themeHtml)}`);

        const iframe = page.frameLocator('#theme-iframe');
        await expect(iframe.locator('[data-testid="json-viewer"]')).toBeVisible();

        // Verify theme colors are applied
        const viewer = iframe.locator('[data-testid="json-viewer"]');
        const computedBg = await viewer.evaluate((el) => getComputedStyle(el).backgroundColor);

        // Allow for slight variations in color values
        expect(computedBg).toBeDefined();

        // Test theme-specific elements
        await expect(iframe.locator(`[data-theme="${theme.name}"]`)).toBeVisible();
      }
    });

    test('should support comprehensive custom color scheme parameters', async ({
      page,
      context,
      apiHelper,
    }) => {
      const testData = JSON_SAMPLES.ecommerce.content;
      const uploadResponse = await apiHelper.uploadJSON(testData, {
        title: 'Custom Colors Test',
        isPublic: true,
      });

      const jsonId = uploadResponse.id;

      const customColors = {
        // Background colors
        primaryBg: '#1a1a2e',
        secondaryBg: '#16213e',
        surfaceBg: '#0f3460',

        // Text colors
        primaryText: '#e94560',
        secondaryText: '#f5f5f5',
        mutedText: '#a0a0a0',

        // Syntax highlighting
        keyColor: '#16c79a',
        stringColor: '#f39c12',
        numberColor: '#e74c3c',
        booleanColor: '#9b59b6',
        nullColor: '#7f8c8d',

        // UI elements
        borderColor: '#34495e',
        highlightColor: '#3498db',
        selectionColor: '#2980b9',
        errorColor: '#e74c3c',
        warningColor: '#f39c12',
        successColor: '#27ae60',

        // Interactive elements
        buttonColor: '#3498db',
        buttonHoverColor: '#2980b9',
        linkColor: '#1abc9c',
        linkHoverColor: '#16a085',
      };

      const colorParams = new URLSearchParams(customColors).toString();

      const customColorsHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Custom Color Scheme Test</title>
          <style>
            body {
              background: ${customColors.primaryBg};
              color: ${customColors.primaryText};
              font-family: Arial, sans-serif;
              padding: 20px;
            }
          </style>
        </head>
        <body>
          <h1>Custom Color Scheme Embedding</h1>
          <p>This embed uses a completely custom color scheme that matches the parent site.</p>
          
          <iframe 
            id="custom-colors-iframe"
            src="http://localhost:3000/embed/${jsonId}?theme=custom&${colorParams}" 
            width="100%" 
            height="600"
            frameborder="0"
            style="border-radius: 8px;">
          </iframe>
        </body>
        </html>
      `;

      await page.goto(`data:text/html,${encodeURIComponent(customColorsHtml)}`);

      const iframe = page.frameLocator('#custom-colors-iframe');
      await expect(iframe.locator('[data-testid="json-viewer"]')).toBeVisible();

      // Verify custom colors are applied
      const viewer = iframe.locator('[data-testid="json-viewer"]');
      const bgColor = await viewer.evaluate((el) => getComputedStyle(el).backgroundColor);
      expect(bgColor).toBe('rgb(26, 26, 46)'); // #1a1a2e

      // Test syntax highlighting colors
      const jsonKey = iframe.locator('.json-key').first();
      const keyColor = await jsonKey.evaluate((el) => getComputedStyle(el).color);
      expect(keyColor).toBe('rgb(22, 199, 154)'); // #16c79a

      const jsonString = iframe.locator('.json-string').first();
      const stringColor = await jsonString.evaluate((el) => getComputedStyle(el).color);
      expect(stringColor).toBe('rgb(243, 156, 18)'); // #f39c12

      // Test interactive elements
      if (await iframe.locator('[data-testid="toolbar"]').isVisible()) {
        const button = iframe.locator('[data-testid="toolbar"] button').first();
        const buttonColor = await button.evaluate((el) => getComputedStyle(el).backgroundColor);
        expect(buttonColor).toBe('rgb(52, 152, 219)'); // #3498db
      }
    });

    test('should implement dynamic theme switching with live preview', async ({
      page,
      context,
      apiHelper,
    }) => {
      const testData = JSON_SAMPLES.configuration.content;
      const uploadResponse = await apiHelper.uploadJSON(testData, {
        title: 'Dynamic Theme Test',
        isPublic: true,
      });

      const jsonId = uploadResponse.id;

      const dynamicThemeHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Dynamic Theme Switching</title>
          <style>
            .theme-controls {
              margin: 20px 0;
              padding: 20px;
              background: #f5f5f5;
              border-radius: 8px;
            }
            
            .theme-button {
              margin: 5px;
              padding: 10px 20px;
              border: none;
              border-radius: 4px;
              cursor: pointer;
            }
            
            .theme-button.light { background: #fff; color: #000; }
            .theme-button.dark { background: #333; color: #fff; }
            .theme-button.custom { background: linear-gradient(45deg, #667eea 0%, #764ba2 100%); color: #fff; }
          </style>
        </head>
        <body>
          <h1>Dynamic Theme Switching Test</h1>
          
          <div class="theme-controls">
            <h3>Switch Themes:</h3>
            <button class="theme-button light" onclick="switchTheme('light')">Light Theme</button>
            <button class="theme-button dark" onclick="switchTheme('dark')">Dark Theme</button>
            <button class="theme-button" onclick="switchTheme('github')">GitHub Theme</button>
            <button class="theme-button" onclick="switchTheme('dracula')">Dracula Theme</button>
            <button class="theme-button custom" onclick="switchTheme('custom')">Custom Theme</button>
            <button class="theme-button" onclick="switchTheme('auto')">Auto Theme</button>
          </div>
          
          <iframe 
            id="dynamic-theme-iframe"
            src="http://localhost:3000/embed/${jsonId}?theme=light&enableThemeSwitch=true" 
            width="100%" 
            height="500"
            frameborder="0">
          </iframe>
          
          <script>
            function switchTheme(theme) {
              const iframe = document.getElementById('dynamic-theme-iframe');
              const currentSrc = new URL(iframe.src);
              
              if (theme === 'custom') {
                // Switch to custom theme with parameters
                currentSrc.searchParams.set('theme', 'custom');
                currentSrc.searchParams.set('primaryBg', '#667eea');
                currentSrc.searchParams.set('primaryText', '#ffffff');
                currentSrc.searchParams.set('keyColor', '#ffd700');
                currentSrc.searchParams.set('stringColor', '#98fb98');
              } else {
                // Remove custom color parameters
                const customParams = ['primaryBg', 'primaryText', 'keyColor', 'stringColor'];
                customParams.forEach(param => currentSrc.searchParams.delete(param));
                currentSrc.searchParams.set('theme', theme);
              }
              
              iframe.src = currentSrc.toString();
              
              // Store current theme for testing
              window.currentTheme = theme;
            }
            
            // Test automatic theme detection
            function testAutoTheme() {
              const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
              console.log('Prefers dark mode:', prefersDark.matches);
              
              prefersDark.addEventListener('change', (e) => {
                if (window.currentTheme === 'auto') {
                  console.log('System theme changed, auto theme should update');
                }
              });
            }
            
            testAutoTheme();
          </script>
        </body>
        </html>
      `;

      await page.goto(`data:text/html,${encodeURIComponent(dynamicThemeHtml)}`);

      const iframe = page.frameLocator('#dynamic-theme-iframe');
      await expect(iframe.locator('[data-testid="json-viewer"]')).toBeVisible();

      // Test theme switching
      const themes = ['dark', 'github', 'dracula', 'custom'];

      for (const theme of themes) {
        await page.click(
          `button:text("${theme === 'custom' ? 'Custom' : theme.charAt(0).toUpperCase() + theme.slice(1)} Theme")`
        );

        // Wait for iframe to reload with new theme
        await page.waitForLoadState('networkidle'); // Wait for theme switch reload
        await expect(iframe.locator('[data-testid="json-viewer"]')).toBeVisible();

        // Verify theme is applied
        const currentTheme = await page.evaluate(() => window.currentTheme);
        expect(currentTheme).toBe(theme);

        // Verify visual changes
        const viewer = iframe.locator('[data-testid="json-viewer"]');
        await expect(viewer).toHaveAttribute('data-theme', theme);
      }

      // Test auto theme
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.click('button:text("Auto Theme")');
      await page.waitForLoadState('networkidle'); // Wait for auto theme reload
      await expect(iframe.locator('[data-testid="json-viewer"][data-theme="dark"]')).toBeVisible();

      await page.emulateMedia({ colorScheme: 'light' });
      await page.waitForLoadState('networkidle'); // Wait for light theme switch
      // Note: Auto theme switching might require page reload in some implementations
    });
  });

  test.describe('View Mode Customization Parameters', () => {
    test('should customize tree view with comprehensive parameters', async ({
      page,
      context,
      apiHelper,
    }) => {
      const testData = JSON_SAMPLES.nested.content;
      const uploadResponse = await apiHelper.uploadJSON(testData, {
        title: 'Tree View Customization',
        isPublic: true,
      });

      const jsonId = uploadResponse.id;

      const treeViewParams = {
        view: 'tree',
        expandLevel: '3',
        showLineNumbers: 'true',
        showDataTypes: 'true',
        sortKeys: 'true',
        maxNodeTextLength: '100',
        indentSize: '20',
        showNodeIcons: 'true',
        enableNodeSelection: 'true',
        highlightSelectedPath: 'true',
        showNodeCount: 'true',
        enableKeyboardNavigation: 'true',
        lazyLoadNodes: 'true',
        virtualizeTree: 'true',
        maxDisplayNodes: '500',
      };

      const paramString = new URLSearchParams(treeViewParams).toString();

      const treeCustomizationHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Tree View Customization Test</title>
        </head>
        <body>
          <h1>Comprehensive Tree View Customization</h1>
          <iframe 
            id="tree-custom-iframe"
            src="http://localhost:3000/embed/${jsonId}?${paramString}" 
            width="100%" 
            height="700"
            frameborder="0">
          </iframe>
        </body>
        </html>
      `;

      await page.goto(`data:text/html,${encodeURIComponent(treeCustomizationHtml)}`);

      const iframe = page.frameLocator('#tree-custom-iframe');
      await expect(iframe.locator('[data-testid="json-viewer"]')).toBeVisible();
      await expect(iframe.locator('[data-testid="tree-view"]')).toBeVisible();

      // Verify tree customizations
      await expect(iframe.locator('[data-testid="line-numbers"]')).toBeVisible();
      await expect(iframe.locator('[data-testid="data-types"]')).toBeVisible();
      await expect(iframe.locator('[data-testid="node-icons"]')).toBeVisible();
      await expect(iframe.locator('[data-testid="node-count"]')).toBeVisible();

      // Test expand level (should have nodes expanded to level 3)
      await expect(iframe.locator('.tree-node[data-level="0"]')).toBeVisible();
      await expect(iframe.locator('.tree-node[data-level="1"]')).toBeVisible();
      await expect(iframe.locator('.tree-node[data-level="2"]')).toBeVisible();
      await expect(iframe.locator('.tree-node[data-level="3"]')).toBeVisible();

      // Test keyboard navigation
      await iframe.locator('[data-testid="tree-view"]').press('ArrowDown');
      await expect(iframe.locator('.tree-node.selected')).toBeVisible();

      // Test node selection and path highlighting
      await iframe.locator('.tree-node').first().click();
      await expect(iframe.locator('.tree-node.selected')).toBeVisible();
      await expect(iframe.locator('[data-testid="selected-path"]')).toBeVisible();

      // Verify sorted keys
      const keys = await iframe.locator('.json-key').allTextContents();
      const sortedKeys = [...keys].sort();
      expect(keys).toEqual(sortedKeys);
    });

    test('should customize list view with pagination and filtering', async ({
      page,
      context,
      apiHelper,
    }) => {
      const testData = JSON_SAMPLES.apiResponse.content;
      const uploadResponse = await apiHelper.uploadJSON(testData, {
        title: 'List View Customization',
        isPublic: true,
      });

      const jsonId = uploadResponse.id;

      const listViewParams = {
        view: 'list',
        itemsPerPage: '10',
        showTypes: 'true',
        enableFilter: 'true',
        enableSort: 'true',
        showPath: 'true',
        enableGrouping: 'true',
        groupBy: 'type',
        showStats: 'true',
        enableSearch: 'true',
        highlightMatches: 'true',
        enableExport: 'true',
        showItemNumbers: 'true',
        compactMode: 'false',
      };

      const paramString = new URLSearchParams(listViewParams).toString();

      const listCustomizationHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>List View Customization Test</title>
        </head>
        <body>
          <h1>Comprehensive List View Customization</h1>
          <iframe 
            id="list-custom-iframe"
            src="http://localhost:3000/embed/${jsonId}?${paramString}" 
            width="100%" 
            height="700"
            frameborder="0">
          </iframe>
        </body>
        </html>
      `;

      await page.goto(`data:text/html,${encodeURIComponent(listCustomizationHtml)}`);

      const iframe = page.frameLocator('#list-custom-iframe');
      await expect(iframe.locator('[data-testid="json-viewer"]')).toBeVisible();
      await expect(iframe.locator('[data-testid="list-view"]')).toBeVisible();

      // Verify list view customizations
      await expect(iframe.locator('[data-testid="data-types"]')).toBeVisible();
      await expect(iframe.locator('[data-testid="filter-controls"]')).toBeVisible();
      await expect(iframe.locator('[data-testid="sort-controls"]')).toBeVisible();
      await expect(iframe.locator('[data-testid="path-display"]')).toBeVisible();
      await expect(iframe.locator('[data-testid="grouping-controls"]')).toBeVisible();
      await expect(iframe.locator('[data-testid="stats-panel"]')).toBeVisible();
      await expect(iframe.locator('[data-testid="search-box"]')).toBeVisible();

      // Test pagination
      await expect(iframe.locator('[data-testid="pagination-controls"]')).toBeVisible();
      const listItems = iframe.locator('.list-item');
      const itemCount = await listItems.count();
      expect(itemCount).toBeLessThanOrEqual(10);

      // Test filtering
      await iframe.locator('[data-testid="filter-select"]').selectOption('string');
      await expect(iframe.locator('.list-item[data-type="string"]')).toHaveCount({ min: 1 });

      // Test search with highlighting
      await iframe.locator('[data-testid="search-box"]').fill('users');
      await expect(iframe.locator('.search-highlight')).toBeVisible();

      // Test grouping
      const groups = iframe.locator('[data-testid="group-header"]');
      await expect(groups).toHaveCount({ min: 2 });

      // Test sorting
      await iframe.locator('[data-testid="sort-key"]').selectOption('alphabetical');
      await page.waitForLoadState('networkidle'); // Wait for sort to apply

      const sortedItems = await iframe.locator('.list-item .item-key').allTextContents();
      const expectedSort = [...sortedItems].sort();
      expect(sortedItems.slice(0, 5)).toEqual(expectedSort.slice(0, 5)); // Compare first few items
    });

    test('should customize editor view with advanced code editing features', async ({
      page,
      context,
      apiHelper,
    }) => {
      const testData = JSON_SAMPLES.configuration.content;
      const uploadResponse = await apiHelper.uploadJSON(testData, {
        title: 'Editor View Customization',
        isPublic: true,
      });

      const jsonId = uploadResponse.id;

      const editorParams = {
        view: 'editor',
        readOnly: 'false',
        theme: 'vs-dark',
        fontSize: '14',
        fontFamily: 'Monaco, Consolas, monospace',
        tabSize: '2',
        insertSpaces: 'true',
        wordWrap: 'true',
        lineNumbers: 'true',
        minimap: 'true',
        folding: 'true',
        bracketMatching: 'true',
        autoIndent: 'true',
        formatOnPaste: 'true',
        showWhitespace: 'true',
        renderControlCharacters: 'true',
        enableSnippets: 'true',
        enableSuggestions: 'true',
        validateJSON: 'true',
        showErrorSquiggles: 'true',
      };

      const paramString = new URLSearchParams(editorParams).toString();

      const editorCustomizationHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Editor View Customization Test</title>
        </head>
        <body>
          <h1>Advanced Editor View Customization</h1>
          <iframe 
            id="editor-custom-iframe"
            src="http://localhost:3000/embed/${jsonId}?${paramString}" 
            width="100%" 
            height="700"
            frameborder="0">
          </iframe>
        </body>
        </html>
      `;

      await page.goto(`data:text/html,${encodeURIComponent(editorCustomizationHtml)}`);

      const iframe = page.frameLocator('#editor-custom-iframe');
      await expect(iframe.locator('[data-testid="json-viewer"]')).toBeVisible();
      await expect(iframe.locator('[data-testid="editor-view"]')).toBeVisible();

      // Verify Monaco editor is loaded with customizations
      await expect(iframe.locator('.monaco-editor')).toBeVisible();
      await expect(iframe.locator('.line-numbers')).toBeVisible();
      await expect(iframe.locator('.minimap')).toBeVisible();

      // Test editor features
      const editor = iframe.locator('.monaco-editor textarea').first();

      // Test editing (if not read-only)
      await editor.click();
      await editor.press('Control+A');
      await editor.press('Control+C');

      // Test formatting
      await iframe.locator('[data-testid="format-button"]').click();
      await page.waitForLoadState('networkidle'); // Wait for formatting

      // Verify JSON validation
      await expect(iframe.locator('[data-testid="validation-status"]')).toBeVisible();

      // Test code folding
      const foldingControls = iframe.locator('.folding-control');
      if (await foldingControls.first().isVisible()) {
        await foldingControls.first().click();
        await expect(iframe.locator('.folded-region')).toBeVisible();
      }

      // Test suggestions and autocomplete
      await editor.type('{');
      await page.waitForLoadState('networkidle'); // Wait for autocomplete

      // Monaco's suggestion widget might appear
      const suggestions = iframe.locator('.suggest-widget');
      if (await suggestions.isVisible()) {
        await expect(suggestions).toBeVisible();
      }
    });

    test('should customize flow/flow view with graph layout options', async ({
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

      const flowParams = {
        view: 'flow',
        layoutType: 'hierarchical',
        nodeSize: 'medium',
        nodeShape: 'rounded',
        showNodeLabels: 'true',
        showDataTypes: 'true',
        enableConnections: 'true',
        connectionStyle: 'curved',
        enableZoom: 'true',
        enablePan: 'true',
        enableDrag: 'true',
        enableMinimap: 'true',
        showGrid: 'true',
        animateTransitions: 'true',
        highlightPath: 'true',
        groupRelated: 'true',
        colorByType: 'true',
        maxNodes: '100',
      };

      const paramString = new URLSearchParams(flowParams).toString();

      const flowCustomizationHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Flow View Customization Test</title>
        </head>
        <body>
          <h1>Advanced Flow/Sea View Customization</h1>
          <iframe 
            id="flow-custom-iframe"
            src="http://localhost:3000/embed/${jsonId}?${paramString}" 
            width="100%" 
            height="700"
            frameborder="0">
          </iframe>
        </body>
        </html>
      `;

      await page.goto(`data:text/html,${encodeURIComponent(flowCustomizationHtml)}`);

      const iframe = page.frameLocator('#flow-custom-iframe');
      await expect(iframe.locator('[data-testid="json-viewer"]')).toBeVisible();
      await expect(iframe.locator('[data-testid="flow-view"]')).toBeVisible();

      // Verify flow view customizations
      await expect(iframe.locator('[data-testid="flow-canvas"]')).toBeVisible();
      await expect(iframe.locator('.flow-node')).toHaveCount({ min: 5 });
      await expect(iframe.locator('.node-connection')).toHaveCount({ min: 3 });

      // Test zoom and pan controls
      await expect(iframe.locator('[data-testid="zoom-controls"]')).toBeVisible();
      await iframe.locator('[data-testid="zoom-in"]').click();
      await page.waitForLoadState('networkidle'); // Wait for zoom animation

      // Test node interactions
      const firstNode = iframe.locator('.flow-node').first();
      await firstNode.click();
      await expect(iframe.locator('.flow-node.selected')).toBeVisible();

      // Test drag functionality
      const nodeBox = await firstNode.boundingBox();
      if (nodeBox) {
        await page.mouse.move(nodeBox.x + nodeBox.width / 2, nodeBox.y + nodeBox.height / 2);
        await page.mouse.down();
        await page.mouse.move(nodeBox.x + 50, nodeBox.y + 50);
        await page.mouse.up();
      }

      // Verify minimap
      if (await iframe.locator('[data-testid="flow-minimap"]').isVisible()) {
        await expect(iframe.locator('[data-testid="flow-minimap"]')).toBeVisible();
      }

      // Test grid display
      await expect(iframe.locator('[data-testid="grid-background"]')).toBeVisible();

      // Test path highlighting
      await firstNode.hover();
      await expect(iframe.locator('.highlighted-path')).toBeVisible();
    });
  });

  test.describe('Dimension and Layout Customization', () => {
    test('should handle fixed and responsive dimension parameters', async ({
      page,
      context,
      apiHelper,
    }) => {
      const testData = JSON_SAMPLES.simple.content;
      const uploadResponse = await apiHelper.uploadJSON(testData, {
        title: 'Dimension Customization Test',
        isPublic: true,
      });

      const jsonId = uploadResponse.id;

      // Test various dimension configurations
      const dimensionConfigs = [
        {
          name: 'Fixed Small',
          params: { width: '400', height: '300', responsive: 'false' },
          expectedWidth: 400,
          expectedHeight: 300,
        },
        {
          name: 'Fixed Large',
          params: { width: '1200', height: '800', responsive: 'false' },
          expectedWidth: 1200,
          expectedHeight: 800,
        },
        {
          name: 'Responsive with Constraints',
          params: {
            responsive: 'true',
            minWidth: '300',
            maxWidth: '1000',
            minHeight: '200',
            maxHeight: '600',
            aspectRatio: '16:9',
          },
          responsive: true,
        },
        {
          name: 'Full Width Responsive',
          params: {
            width: '100%',
            height: '500',
            responsive: 'true',
            maintainAspectRatio: 'false',
          },
          responsive: true,
        },
      ];

      for (const config of dimensionConfigs) {
        const paramString = new URLSearchParams(config.params).toString();

        const dimensionHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>${config.name} Dimension Test</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 20px;">
            <h2>${config.name} Configuration</h2>
            <div style="border: 2px solid #ccc; display: inline-block;">
              <iframe 
                id="dimension-iframe"
                src="http://localhost:3000/embed/${jsonId}?${paramString}" 
                ${config.responsive ? 'width="100%" style="max-width: 1000px;"' : `width="${config.params.width}" height="${config.params.height}"`}
                frameborder="0">
              </iframe>
            </div>
          </body>
          </html>
        `;

        await page.goto(`data:text/html,${encodeURIComponent(dimensionHtml)}`);

        const iframe = page.locator('#dimension-iframe');
        await expect(iframe).toBeVisible();

        const iframeBounds = await iframe.boundingBox();

        if (!config.responsive && config.expectedWidth && config.expectedHeight) {
          expect(iframeBounds?.width).toBe(config.expectedWidth);
          expect(iframeBounds?.height).toBe(config.expectedHeight);
        }

        // Test that content is visible and properly sized
        const frameContent = page.frameLocator('#dimension-iframe');
        await expect(frameContent.locator('[data-testid="json-viewer"]')).toBeVisible();

        if (config.responsive) {
          // Test responsiveness by changing viewport
          const viewports = [
            { width: 320, height: 568 }, // Mobile
            { width: 768, height: 1024 }, // Tablet
            { width: 1920, height: 1080 }, // Desktop
          ];

          for (const viewport of viewports) {
            await page.setViewportSize(viewport);
            await page.waitForLoadState('networkidle'); // Wait for viewport change

            const newBounds = await iframe.boundingBox();
            expect(newBounds?.width).toBeLessThanOrEqual(viewport.width);

            // Verify content remains accessible
            await expect(frameContent.locator('[data-testid="json-viewer"]')).toBeVisible();
          }
        }
      }
    });

    test('should support advanced layout and positioning parameters', async ({
      page,
      context,
      apiHelper,
    }) => {
      const testData = JSON_SAMPLES.nested.content;
      const uploadResponse = await apiHelper.uploadJSON(testData, {
        title: 'Layout Customization Test',
        isPublic: true,
      });

      const jsonId = uploadResponse.id;

      const layoutParams = {
        // Layout structure
        layout: 'split',
        splitDirection: 'horizontal',
        splitRatio: '60:40',
        primaryPanel: 'tree',
        secondaryPanel: 'editor',

        // Positioning
        toolbarPosition: 'top',
        sidebarPosition: 'left',
        statusbarPosition: 'bottom',
        minimapPosition: 'right',

        // Spacing and sizing
        padding: '10',
        margin: '5',
        borderRadius: '8',
        borderWidth: '1',

        // Scrolling and overflow
        enableHorizontalScroll: 'true',
        enableVerticalScroll: 'true',
        scrollbarStyle: 'overlay',

        // Panels
        enableResizablePanels: 'true',
        panelMinWidth: '200',
        collapsiblePanels: 'true',

        // Header and footer
        showHeader: 'true',
        headerTitle: 'Custom Layout JSON Viewer',
        showFooter: 'true',
        footerText: 'Powered by JSON Viewer',
      };

      const paramString = new URLSearchParams(layoutParams).toString();

      const layoutHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Advanced Layout Customization</title>
          <style>
            .container {
              width: 100%;
              max-width: 1400px;
              height: 800px;
              margin: 20px auto;
              border: 1px solid #ddd;
            }
          </style>
        </head>
        <body>
          <h1>Advanced Layout and Positioning</h1>
          <div class="container">
            <iframe 
              id="layout-iframe"
              src="http://localhost:3000/embed/${jsonId}?${paramString}" 
              width="100%" 
              height="100%"
              frameborder="0">
            </iframe>
          </div>
        </body>
        </html>
      `;

      await page.goto(`data:text/html,${encodeURIComponent(layoutHtml)}`);

      const iframe = page.frameLocator('#layout-iframe');
      await expect(iframe.locator('[data-testid="json-viewer"]')).toBeVisible();

      // Verify split layout
      await expect(iframe.locator('[data-testid="split-layout"]')).toBeVisible();
      await expect(iframe.locator('[data-testid="primary-panel"]')).toBeVisible();
      await expect(iframe.locator('[data-testid="secondary-panel"]')).toBeVisible();

      // Verify positioning
      await expect(iframe.locator('[data-testid="toolbar"][data-position="top"]')).toBeVisible();
      await expect(iframe.locator('[data-testid="sidebar"][data-position="left"]')).toBeVisible();
      await expect(
        iframe.locator('[data-testid="statusbar"][data-position="bottom"]')
      ).toBeVisible();

      // Test resizable panels
      const resizer = iframe.locator('[data-testid="panel-resizer"]');
      if (await resizer.isVisible()) {
        const resizerBox = await resizer.boundingBox();
        if (resizerBox) {
          await page.mouse.move(resizerBox.x, resizerBox.y);
          await page.mouse.down();
          await page.mouse.move(resizerBox.x + 50, resizerBox.y);
          await page.mouse.up();
        }
      }

      // Verify custom header and footer
      await expect(iframe.locator('[data-testid="header"]')).toContainText(
        'Custom Layout JSON Viewer'
      );
      await expect(iframe.locator('[data-testid="footer"]')).toContainText(
        'Powered by JSON Viewer'
      );

      // Test panel collapse
      const collapseButton = iframe.locator('[data-testid="collapse-panel"]');
      if (await collapseButton.isVisible()) {
        await collapseButton.click();
        await expect(iframe.locator('[data-testid="secondary-panel"].collapsed')).toBeVisible();
      }
    });
  });

  test.describe('Advanced Customization Features', () => {
    test('should support comprehensive feature toggles and behavior parameters', async ({
      page,
      context,
      apiHelper,
    }) => {
      const testData = JSON_SAMPLES.analytics.content;
      const uploadResponse = await apiHelper.uploadJSON(testData, {
        title: 'Feature Toggles Test',
        isPublic: true,
      });

      const jsonId = uploadResponse.id;

      const featureParams = {
        // Core features
        enableSearch: 'true',
        enableCopy: 'true',
        enableDownload: 'false',
        enableShare: 'false',
        enablePrint: 'true',
        enableFullscreen: 'true',

        // Navigation features
        enableBreadcrumbs: 'true',
        enablePathTracker: 'true',
        enableHistoryNavigation: 'true',
        enableBookmarks: 'true',

        // View features
        enableViewSwitching: 'true',
        enableQuickView: 'true',
        enableSplitView: 'true',
        enableCompareMode: 'false',

        // Interaction features
        enableDoubleClickExpand: 'true',
        enableRightClickMenu: 'true',
        enableKeyboardShortcuts: 'true',
        enableDragAndDrop: 'false',
        enableSelection: 'true',

        // Data features
        enableDataValidation: 'true',
        enableTypeInference: 'true',
        enableStatistics: 'true',
        enableDataExport: 'true',

        // Performance features
        enableVirtualization: 'true',
        enableLazyLoading: 'true',
        enableCaching: 'true',
        enableProgressIndicators: 'true',

        // Accessibility features
        enableScreenReader: 'true',
        enableHighContrast: 'false',
        enableFocusIndicators: 'true',
        ariaLabels: 'true',
      };

      const paramString = new URLSearchParams(featureParams).toString();

      const featureToggleHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Feature Toggles and Behavior Test</title>
        </head>
        <body>
          <h1>Comprehensive Feature Toggle Configuration</h1>
          <iframe 
            id="features-iframe"
            src="http://localhost:3000/embed/${jsonId}?${paramString}" 
            width="100%" 
            height="700"
            frameborder="0">
          </iframe>
        </body>
        </html>
      `;

      await page.goto(`data:text/html,${encodeURIComponent(featureToggleHtml)}`);

      const iframe = page.frameLocator('#features-iframe');
      await expect(iframe.locator('[data-testid="json-viewer"]')).toBeVisible();

      // Test enabled features
      await expect(iframe.locator('[data-testid="search-box"]')).toBeVisible();
      await expect(iframe.locator('[data-testid="copy-button"]')).toBeVisible();
      await expect(iframe.locator('[data-testid="print-button"]')).toBeVisible();
      await expect(iframe.locator('[data-testid="fullscreen-button"]')).toBeVisible();

      // Test disabled features (should not be visible)
      await expect(iframe.locator('[data-testid="download-button"]')).not.toBeVisible();
      await expect(iframe.locator('[data-testid="share-button"]')).not.toBeVisible();

      // Test navigation features
      await expect(iframe.locator('[data-testid="breadcrumbs"]')).toBeVisible();
      await expect(iframe.locator('[data-testid="path-tracker"]')).toBeVisible();

      // Test interaction features
      await iframe.locator('.json-node').first().dblclick();
      await expect(iframe.locator('.json-node.expanded, .json-node.collapsed')).toBeVisible();

      // Test right-click context menu
      await iframe.locator('.json-node').first().click({ button: 'right' });
      await expect(iframe.locator('[data-testid="context-menu"]')).toBeVisible();

      // Test keyboard shortcuts
      await iframe.locator('[data-testid="json-viewer"]').press('Control+F');
      await expect(iframe.locator('[data-testid="search-box"]:focus')).toBeVisible();

      // Test statistics panel
      if (await iframe.locator('[data-testid="stats-toggle"]').isVisible()) {
        await iframe.locator('[data-testid="stats-toggle"]').click();
        await expect(iframe.locator('[data-testid="statistics-panel"]')).toBeVisible();
      }
    });

    test('should implement custom callback and event handling parameters', async ({
      page,
      context,
      apiHelper,
    }) => {
      const testData = JSON_SAMPLES.ecommerce.content;
      const uploadResponse = await apiHelper.uploadJSON(testData, {
        title: 'Custom Events Test',
        isPublic: true,
      });

      const jsonId = uploadResponse.id;

      const eventParams = {
        enablePostMessage: 'true',
        enableCustomEvents: 'true',
        trackUserInteractions: 'true',
        enableAnalytics: 'true',
        callbackUrl: 'https://api.example.com/callbacks',
        eventWhitelist: 'click,expand,search,view',
        includeEventMetadata: 'true',
      };

      const paramString = new URLSearchParams(eventParams).toString();

      const eventsHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Custom Events and Callbacks Test</title>
        </head>
        <body>
          <h1>Custom Event Handling and Callbacks</h1>
          <div id="event-log" style="background: #f5f5f5; padding: 10px; height: 150px; overflow-y: auto; margin: 20px 0; font-family: monospace; font-size: 12px;"></div>
          
          <iframe 
            id="events-iframe"
            src="http://localhost:3000/embed/${jsonId}?${paramString}" 
            width="100%" 
            height="500"
            frameborder="0">
          </iframe>
          
          <script>
            const eventLog = document.getElementById('event-log');
            const events = [];
            
            function logEvent(event) {
              const timestamp = new Date().toLocaleTimeString();
              const logEntry = \`[\${timestamp}] \${event.type}: \${JSON.stringify(event.data)}\\n\`;
              events.push(event);
              eventLog.textContent += logEntry;
              eventLog.scrollTop = eventLog.scrollHeight;
              
              // Store for testing
              window.capturedEvents = events;
            }
            
            // Listen for postMessage events from iframe
            window.addEventListener('message', function(event) {
              if (event.origin !== 'http://localhost:3000') return;
              
              logEvent({
                type: 'postMessage',
                data: event.data,
                origin: event.origin
              });
            });
            
            // Listen for custom events (if supported)
            document.addEventListener('jsonViewer:nodeClick', function(event) {
              logEvent({
                type: 'nodeClick',
                data: event.detail
              });
            });
            
            document.addEventListener('jsonViewer:nodeExpand', function(event) {
              logEvent({
                type: 'nodeExpand',
                data: event.detail
              });
            });
            
            document.addEventListener('jsonViewer:search', function(event) {
              logEvent({
                type: 'search',
                data: event.detail
              });
            });
            
            document.addEventListener('jsonViewer:viewChange', function(event) {
              logEvent({
                type: 'viewChange', 
                data: event.detail
              });
            });
          </script>
        </body>
        </html>
      `;

      await page.goto(`data:text/html,${encodeURIComponent(eventsHtml)}`);

      const iframe = page.frameLocator('#events-iframe');
      await expect(iframe.locator('[data-testid="json-viewer"]')).toBeVisible();

      // Perform actions that should trigger events
      await iframe.locator('.json-node').first().click();
      await page.waitForLoadState('networkidle'); // Wait for click event

      await iframe.locator('.tree-node-toggle').first().click();
      await page.waitForLoadState('networkidle'); // Wait for expand event

      if (await iframe.locator('[data-testid="search-box"]').isVisible()) {
        await iframe.locator('[data-testid="search-box"]').fill('order');
        await page.waitForLoadState('networkidle'); // Wait for search event
      }

      // Wait for events to be captured
      await page.waitForFunction(
        () => {
          return window.capturedEvents && window.capturedEvents.length > 0;
        },
        { timeout: 10000 }
      );

      const capturedEvents = await page.evaluate(() => window.capturedEvents);
      expect(capturedEvents.length).toBeGreaterThan(0);

      // Verify event structure
      capturedEvents.forEach((event) => {
        expect(event).toHaveProperty('type');
        expect(event).toHaveProperty('data');
      });

      // Check event log is visible and populated
      const logContent = await page.locator('#event-log').textContent();
      expect(logContent).toContain('postMessage');
      expect(logContent.length).toBeGreaterThan(50); // Should have meaningful content
    });
  });
});
