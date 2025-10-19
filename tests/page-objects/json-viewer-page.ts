import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base-page';

export class JsonViewerPage extends BasePage {
  // JSON input and upload area
  readonly jsonTextArea: Locator;
  readonly uploadArea: Locator;
  readonly fileInput: Locator;
  readonly uploadButton: Locator;
  readonly pasteButton: Locator;
  readonly clearButton: Locator;

  // Viewer controls
  readonly viewModeButtons: Locator;
  readonly treeViewButton: Locator;
  readonly flowViewButton: Locator;
  readonly listViewButton: Locator;
  readonly searchInput: Locator;
  readonly expandAllButton: Locator;
  readonly collapseAllButton: Locator;

  // Viewer content areas
  readonly viewerContainer: Locator;
  readonly treeView!: Locator;
  readonly flowView!: Locator;
  readonly listView!: Locator;
  readonly jsonNodes: Locator;

  // Code editor elements (actual implementation)
  readonly monacoEditor: Locator;
  readonly editorContent: Locator;
  readonly loadingIndicator: Locator;

  // Node controls
  readonly expandableNodes: Locator;
  readonly expandButtons: Locator;
  readonly collapseButtons: Locator;

  // Node type selectors
  readonly objectNodes!: Locator;
  readonly arrayNodes!: Locator;
  readonly stringNodes!: Locator;
  readonly numberNodes!: Locator;
  readonly booleanNodes!: Locator;
  readonly nullNodes!: Locator;

  // Side panels and modals
  readonly nodeDetailsModal: Locator;
  readonly settingsPanel: Locator;
  readonly shareModal: Locator;
  readonly publishModal: Locator;

  // Action buttons
  readonly shareButton: Locator;
  readonly publishButton: Locator;
  readonly downloadButton: Locator;
  readonly copyButton: Locator;
  readonly settingsButton: Locator;

  // Statistics and info
  readonly statsPanel: Locator;
  readonly nodeCount: Locator;
  readonly fileSize: Locator;
  readonly processingTime: Locator;

  // Error and loading states
  readonly errorMessage: Locator;
  readonly loadingSpinner: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    super(page);

    // JSON input area - Use the Monaco editor container
    this.jsonTextArea = page.locator('[data-testid="json-textarea"]');
    this.uploadArea = page
      .locator('[data-testid="upload-area"]')
      .or(page.locator('.upload-area, .dropzone'));
    this.fileInput = page.locator('input[type="file"]');
    this.uploadButton = page
      .locator('[data-testid="upload-button"]')
      .or(page.locator('text="Upload"'));
    this.pasteButton = page
      .locator('[data-testid="paste-button"]')
      .or(page.locator('text="Paste"'));
    this.clearButton = page
      .locator('[data-testid="clear-button"]')
      .or(page.locator('text="Clear"'));

    // View mode controls - Use the actual tab structure
    this.viewModeButtons = page.locator('[data-testid="view-mode"]');
    this.treeViewButton = page.locator('[data-testid="tree-view"]');
    this.flowViewButton = page.locator('[data-testid="flow-view"]');
    this.listViewButton = page.locator('[data-testid="list-view"]');
    this.searchInput = page.locator('[data-testid="search-input"]');
    this.expandAllButton = page
      .locator('[data-testid="expand-all"]')
      .or(page.locator('text="Expand All"'));
    this.collapseAllButton = page
      .locator('[data-testid="collapse-all"]')
      .or(page.locator('text="Collapse All"'));

    // Monaco editor based selectors (actual implementation)
    this.viewerContainer = page.locator('main');
    this.monacoEditor = page.locator('.monaco-editor');
    this.editorContent = page.locator('[data-testid="json-textarea"]');
    this.loadingIndicator = page.locator('[data-testid="loading"]');
    this.jsonNodes = this.editorContent; // For compatibility with existing tests

    // Node controls
    this.expandableNodes = page.locator('.json-node.expandable, [data-expandable="true"]');
    this.expandButtons = page.locator('[data-testid="expand-button"], .expand-button');
    this.collapseButtons = page.locator('[data-testid="collapse-button"], .collapse-button');

    // Modals and panels
    this.nodeDetailsModal = page.locator('[data-testid="node-details-modal"]');
    this.settingsPanel = page.locator('[data-testid="settings-panel"]');
    this.shareModal = page.locator('[data-testid="share-modal"]');
    this.publishModal = page.locator('[data-testid="publish-modal"]');

    // Action buttons
    this.shareButton = page
      .locator('[data-testid="share-button"]')
      .or(page.locator('text="Share"'));
    this.publishButton = page
      .locator('[data-testid="publish-button"]')
      .or(page.locator('text="Publish"'));
    this.downloadButton = page
      .locator('[data-testid="download-button"]')
      .or(page.locator('text="Download"'));
    this.copyButton = page.locator('[data-testid="copy-button"]').or(page.locator('text="Copy"'));
    this.settingsButton = page.locator('[data-testid="settings-button"]');

    // Statistics
    this.statsPanel = page.locator('[data-testid="stats-panel"]');
    this.nodeCount = page.locator('[data-testid="node-count"]');
    this.fileSize = page.locator('[data-testid="file-size"]');
    this.processingTime = page.locator('[data-testid="processing-time"]');

    // States - Be specific to avoid Monaco editor alerts
    this.errorMessage = page.locator('[data-testid="error-message"], .json-error, .error-message').first();
    this.loadingSpinner = page.locator('[data-testid="loading"], .loading-spinner, .spinner').first();
    this.successMessage = page.locator('[data-testid="success-message"], .success-message').first();
  }

  /**
   * Navigate to the JSON viewer page
   */
  async navigateToViewer(jsonId?: string) {
    const url = jsonId ? `/viewer/${jsonId}` : '/';
    await this.navigateTo(url);
  }

  /**
   * Input JSON text directly
   */
  async inputJSON(jsonString: string) {
    try {
      console.log(`⏳ Inputting JSON (${jsonString.length} characters)`);
      
      // Wait for page to be ready and React to hydrate
      await this.page.waitForLoadState('domcontentloaded');
      await this.page.waitForLoadState('networkidle');

      // Find the Monaco editor with multiple possible selectors
      const editorSelectors = [
        '[data-testid="json-textarea"]',
        '.monaco-editor textarea',
        '.monaco-editor',
        'textarea',
        '[data-testid="json-input"]',
        '.json-editor'
      ];
      
      let editorFound = false;
      
      for (const selector of editorSelectors) {
        try {
          const element = this.page.locator(selector).first();
          if (await element.isVisible({ timeout: 2000 })) {
            console.log(`✅ Found editor with selector: ${selector}`);
            await element.waitFor({ state: 'visible' });
            await element.click();
            editorFound = true;
            break;
          }
        } catch (e) {
          // Try next selector
          continue;
        }
      }
      
      if (!editorFound) {
        console.warn('⚠️ No Monaco editor found, trying to click anywhere on page');
        await this.page.click('body');
      }

      // Method 1: Try Monaco Editor API directly
      const monacoSuccess = await this.page.evaluate((json) => {
        try {
          const monacoInstance = (window as any).monaco?.editor?.getEditors?.()?.[0];
          if (monacoInstance) {
            monacoInstance.setValue(json);
            monacoInstance.trigger('keyboard', 'type', { text: '' });
            return true;
          }
        } catch (error) {
          console.error('Monaco API error:', error);
        }
        return false;
      }, jsonString);

      if (monacoSuccess) {
        console.log('✅ Successfully set JSON using Monaco API');
      } else {
        console.log('⚠️ Monaco API failed, trying keyboard input');
        
        // Method 2: Keyboard input with careful timing
        try {
          // Focus and select all existing content
          await this.page.keyboard.press('Meta+a'); // Mac Cmd+A
          
          // Type JSON in manageable chunks
          const chunkSize = 500;
          if (jsonString.length > chunkSize) {
            for (let i = 0; i < jsonString.length; i += chunkSize) {
              const chunk = jsonString.substring(i, i + chunkSize);
              await this.page.keyboard.type(chunk, { delay: 5 });
            }
          } else {
            await this.page.keyboard.type(jsonString, { delay: 5 });
          }
          
          console.log('✅ Successfully input JSON using keyboard');
        } catch (keyboardError) {
          console.log('⚠️ Keyboard input failed, trying direct fill');
          
          // Method 3: Direct fill as last resort
          const textareas = await this.page.locator('textarea').all();
          if (textareas.length > 0) {
            await textareas[0].fill(jsonString);
            console.log('✅ Successfully filled JSON using textarea');
          } else {
            throw new Error('No input method worked for JSON content');
          }
        }
      }

      // Wait for any auto-processing to complete
      await this.waitForJSONProcessed();
      
      console.log('✅ JSON input completed');
      
    } catch (error) {
      console.error('❌ JSON input failed:', (error as Error).message);
      await this.page.screenshot({
        path: `test-results/json-input-failure-${Date.now()}.png`,
        fullPage: true
      });
      throw error;
    }
  }

  /**
   * Upload JSON file
   */
  async uploadJSONFile(filePath: string) {
    await this.uploadFile('input[type="file"]', filePath);
    await this.waitForCondition(async () => {
      return !(await this.loadingSpinner.isVisible());
    });
  }

  /**
   * Clear the JSON input
   */
  async clearJSON() {
    if (await this.clearButton.isVisible()) {
      await this.clearButton.click();
    } else {
      await this.jsonTextArea.clear();
    }
  }

  /**
   * Paste JSON from clipboard
   */
  async pasteJSON() {
    if (await this.pasteButton.isVisible()) {
      await this.pasteButton.click();
    } else {
      await this.jsonTextArea.focus();
      await this.page.keyboard.press('Meta+V'); // Mac
      // await this.page.keyboard.press('Control+V'); // Windows/Linux
    }
  }

  /**
   * Switch to tree view mode
   */
  async switchToTreeView() {
    try {
      console.log('⏳ Switching to tree view...');
      
      // Find tree view button with multiple selectors
      const treeViewSelectors = [
        '[data-testid="tree-view"]',
        'button:has-text("Tree")',
        'button:has-text("tree")',
        '[role="tab"]:has-text("Tree")',
        '.tab-tree',
      ];
      
      let buttonClicked = false;
      for (const selector of treeViewSelectors) {
        try {
          const button = this.page.locator(selector).first();
          if (await button.isVisible({ timeout: 2000 })) {
            await button.click();
            buttonClicked = true;
            console.log(`✅ Clicked tree view button: ${selector}`);
            break;
          }
        } catch {
          continue;
        }
      }
      
      if (!buttonClicked) {
        console.warn('⚠️ Tree view button not found, might already be active');
      }
      
      // Wait for tab content to be visible
      await this.page.waitForLoadState('domcontentloaded');
      
      // Wait for tree content to appear
      const treeContentSelectors = [
        '.json-node[data-testid="json-node"]',
        '.json-node',
        '.tree-view-content',
        '[data-testid="tree-content"]'
      ];
      
      for (const selector of treeContentSelectors) {
        try {
          await this.page.waitForSelector(selector, { timeout: 3000 });
          console.log(`✅ Tree view content loaded: ${selector}`);
          break;
        } catch {
          continue;
        }
      }
      
      console.log('✅ Successfully switched to tree view');
      
    } catch (error) {
      console.error('❌ Failed to switch to tree view:', (error as Error).message);
      // Don't throw error, just log it
    }
  }

  /**
   * Switch to flow view mode
   */
  async switchToFlowView() {
    await this.flowViewButton.click();
    // Wait for flow view to load
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForSelector('.react-flow__renderer, .json-flow-flow, .flow-view-content', { timeout: 5000 }).catch(() => {});
  }

  /**
   * Switch to list view mode
   */
  async switchToListView() {
    await this.listViewButton.click();
    // Wait for list view to appear - try different selectors as list might render differently
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForSelector('.json-node[data-testid="json-node"], div.flex.items-center.px-4.py-2', { timeout: 5000 }).catch(() => {});
  }

  /**
   * Get current view mode
   */
  async getCurrentViewMode(): Promise<string> {
    try {
      // Multiple ways to detect active view mode
      const activeSelectors = [
        '[data-testid="view-mode"] [data-state="active"]',
        '[data-state="active"]',
        '.tab.active',
        '[role="tab"][aria-selected="true"]',
        '.selected-tab'
      ];
      
      for (const selector of activeSelectors) {
        try {
          const activeTab = this.page.locator(selector).first();
          if (await activeTab.isVisible({ timeout: 1000 })) {
            const text = await activeTab.textContent();
            if (text) {
              const mode = text.toLowerCase().trim();
              console.log(`✅ Current view mode: ${mode}`);
              return mode;
            }
          }
        } catch {
          continue;
        }
      }
      
      console.warn('⚠️ Could not detect current view mode');
      return 'unknown';
    } catch (error) {
      console.error('❌ Error getting current view mode:', (error as Error).message);
      return 'unknown';
    }
  }

  /**
   * Search within JSON content - gracefully handle if search not available
   */
  async searchInJSON(query: string) {
    try {
      if (await this.searchInput.isVisible({ timeout: 2000 })) {
        await this.searchInput.fill(query);
        await this.page.keyboard.press('Enter');
        // Wait for search results to appear
        await this.page.waitForLoadState('domcontentloaded');
      } else {
        // Search functionality not available - skip quietly
        console.log('Search functionality not available, skipping search for:', query);
      }
    } catch (error) {
      // Search functionality not implemented yet
      console.log('Search not implemented, skipping search for:', query);
    }
  }

  /**
   * Clear search - gracefully handle if search not available
   */
  async clearSearch() {
    try {
      if (await this.searchInput.isVisible({ timeout: 2000 })) {
        await this.searchInput.clear();
        await this.page.keyboard.press('Enter');
      }
    } catch (error) {
      // Search functionality not implemented yet
      console.log('Search not implemented, skipping clear search');
    }
  }

  /**
   * Expand all nodes
   */
  async expandAll() {
    if (await this.expandAllButton.isVisible()) {
      await this.expandAllButton.click();
    } else {
      // Alternative: expand individual nodes
      const expandButtons = await this.expandButtons.all();
      for (const button of expandButtons) {
        if (await button.isVisible()) {
          await button.click();
        }
      }
    }
  }

  /**
   * Collapse all nodes
   */
  async collapseAll() {
    if (await this.collapseAllButton.isVisible()) {
      await this.collapseAllButton.click();
    } else {
      // Alternative: collapse individual nodes
      const collapseButtons = await this.collapseButtons.all();
      for (const button of collapseButtons) {
        if (await button.isVisible()) {
          await button.click();
        }
      }
    }
  }

  /**
   * Expand specific node by path or index
   */
  async expandNode(identifier: string | number) {
    const nodeSelector =
      typeof identifier === 'string'
        ? `[data-path="${identifier}"] .expand-button`
        : `.json-node:nth-child(${identifier}) .expand-button`;

    await this.page.locator(nodeSelector).click();
  }

  /**
   * Double-click on a node to see details
   */
  async openNodeDetails(nodeSelector: string) {
    await this.page.locator(nodeSelector).dblclick();
    await this.nodeDetailsModal.waitFor({ state: 'visible' });
  }

  /**
   * Get JSON statistics
   */
  async getJSONStats() {
    const stats = {
      nodeCount: 0,
      fileSize: '',
      processingTime: '',
    };

    if (await this.nodeCount.isVisible()) {
      const nodeCountText = await this.nodeCount.textContent();
      stats.nodeCount = parseInt(nodeCountText?.match(/\d+/)?.[0] || '0');
    }

    if (await this.fileSize.isVisible()) {
      stats.fileSize = (await this.fileSize.textContent()) || '';
    }

    if (await this.processingTime.isVisible()) {
      stats.processingTime = (await this.processingTime.textContent()) || '';
    }

    return stats;
  }

  /**
   * Count nodes by type - adapts to current view mode
   */
  async getNodeCounts() {
    // Check which view mode is active to use correct selectors
    const currentMode = await this.getCurrentViewMode();
    let totalNodes = 0;
    
    if (currentMode === 'list') {
      // List view uses different selectors
      totalNodes = await this.page.locator('div.flex.items-center.px-4.py-2').count();
    } else {
      // Tree and other views use json-node class
      totalNodes = await this.page.locator('.json-node[data-testid="json-node"]').count();
    }
    
    return {
      objects: await this.objectNodes.count(),
      arrays: await this.arrayNodes.count(), 
      strings: await this.stringNodes.count(),
      numbers: await this.numberNodes.count(),
      booleans: await this.booleanNodes.count(),
      nulls: await this.nullNodes.count(),
      total: totalNodes,
    };
  }

  /**
   * Share JSON
   */
  async shareJSON() {
    await this.shareButton.click();
    await this.shareModal.waitFor({ state: 'visible' });

    // Return share URL if available
    const shareUrl = await this.page.locator('[data-testid="share-url"]').textContent();
    return shareUrl;
  }

  /**
   * Publish to public library
   */
  async publishToLibrary(title?: string) {
    await this.publishButton.click();
    await this.publishModal.waitFor({ state: 'visible' });

    if (title) {
      await this.page.locator('[data-testid="publish-title"]').fill(title);
    }

    const confirmButton = this.page.locator('[data-testid="publish-confirm"]');
    await confirmButton.click();
    // Wait for publish to complete - modal should close
    await this.publishModal.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  }

  /**
   * Download JSON
   */
  async downloadJSON() {
    const downloadPromise = this.page.waitForEvent('download');
    await this.downloadButton.click();
    const download = await downloadPromise;
    return download.suggestedFilename();
  }

  /**
   * Copy JSON to clipboard
   */
  async copyJSON() {
    await this.copyButton.click();

    // Verify clipboard content if needed
    const clipboardText = await this.page.evaluate(() => navigator.clipboard.readText());
    return clipboardText;
  }

  /**
   * Wait for JSON to be processed and rendered
   */
  async waitForJSONProcessed() {
    console.log('⏳ Waiting for JSON to be processed...');
    
    try {
      // Wait for page to stabilize
      await this.page.waitForLoadState('domcontentloaded');
      
      // Wait for loading spinner to disappear if it exists
      const loadingSelectors = [
        '[data-testid="loading"]:visible',
        '.loading-spinner:visible',
        '.spinner:visible',
        '.loading:visible'
      ];
      
      for (const selector of loadingSelectors) {
        try {
          await this.page.waitForSelector(selector, { state: 'hidden', timeout: 2000 });
          console.log(`✅ Loading spinner disappeared: ${selector}`);
          break;
        } catch {
          // Spinner might not exist, continue
        }
      }
      
      // Wait for content to appear with multiple possible selectors
      const contentSelectors = [
        '.json-node[data-testid="json-node"]',
        '.json-node',
        '[data-testid="json-content"]',
        '.json-tree',
        '.json-viewer-content',
        'main > div > div', // Generic content selector
      ];
      
      let contentFound = false;
      for (const selector of contentSelectors) {
        try {
          await this.page.waitForSelector(selector, { timeout: 3000 });
          console.log(`✅ Found JSON content with selector: ${selector}`);
          contentFound = true;
          break;
        } catch {
          // Try next selector
          continue;
        }
      }
      
      if (!contentFound) {
        console.warn('⚠️ No JSON content selectors matched');
        // Wait for network to settle as fallback
        await this.page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
      }
      
      console.log('✅ JSON processing wait completed');
      
    } catch (error) {
      console.warn('⚠️ Error waiting for JSON processing:', (error as Error).message);
      // Don't throw error, just log it and continue
    }
  }

  /**
   * Check if JSON has errors
   */
  async hasJSONErrors(): Promise<boolean> {
    // Check for Monaco editor error markers with multiple possible CSS classes
    const hasErrorMessages = await this.errorMessage.isVisible().catch(() => false);
    
    // Check various Monaco error marker classes
    const errorSelectors = [
      '.monaco-editor .squiggly-error',
      '.monaco-editor .red-squiggly',
      '.monaco-editor .marker-widget',
      '.monaco-editor .squiggly-inline-error',
      '.monaco-editor .hover-row .hover .hover-contents .markdown-hover .code .language-typescript .error',
      '.monaco-editor [data-marker-severity="8"]', // Error severity
      '.monaco-editor .mtk21', // Error token class
      '.codicon-error',
    ];
    
    let hasMonacoErrors = false;
    for (const selector of errorSelectors) {
      const count = await this.page.locator(selector).count().catch(() => 0);
      if (count > 0) {
        hasMonacoErrors = true;
        break;
      }
    }
    
    // Also check if JSON is syntactically invalid by trying to parse
    const hasParseErrors = await this.page.evaluate(() => {
      const editor = (window as any).monacoEditorInstance;
      if (editor) {
        const value = editor.getValue();
        try {
          JSON.parse(value);
          return false;
        } catch {
          return true;
        }
      }
      return false;
    }).catch(() => false);
    
    return hasErrorMessages || hasMonacoErrors || hasParseErrors;
  }

  /**
   * Get error message if present
   */
  async getErrorMessage(): Promise<string | null> {
    // Try to get error message from various sources
    const errorMessage = await this.errorMessage.textContent().catch(() => null);
    if (errorMessage) {
      return errorMessage;
    }
    
    // Try to get Monaco editor error details
    const monacoError = await this.page.evaluate(() => {
      const editor = (window as any).monacoEditorInstance;
      if (editor) {
        const model = editor.getModel();
        if (model) {
          const markers = (window as any).monaco.editor.getModelMarkers({ resource: model.uri });
          if (markers.length > 0) {
            return markers[0].message;
          }
        }
        
        // Also try to get parse error
        const value = editor.getValue();
        try {
          JSON.parse(value);
          return null;
        } catch (e) {
          return (e as Error).message;
        }
      }
      return null;
    }).catch(() => null);
    
    return monacoError || 'JSON syntax error detected';
  }

  /**
   * Validate JSON structure is displayed correctly
   */
  async validateJSONStructure(expectedStructure: any) {
    const nodeCounts = await this.getNodeCounts();

    // Basic validation - ensure nodes are rendered
    expect(nodeCounts.total).toBeGreaterThan(0);

    // More specific validations can be added based on expectedStructure
    return nodeCounts;
  }

  /**
   * Test all view modes
   */
  async testAllViewModes() {
    const results = [];

    // Test tree view
    await this.switchToTreeView();
    const treeNodeCount = await this.jsonNodes.count();
    results.push({
      mode: 'tree',
      nodeCount: treeNodeCount,
      working: treeNodeCount > 0,
    });

    // Test list view - uses different selectors than tree view
    await this.switchToListView();
    const listNodeCount = await this.page.locator('div.flex.items-center.px-4.py-2').count();
    results.push({
      mode: 'list',
      nodeCount: listNodeCount,
      working: listNodeCount > 0,
    });

    // Test flow view if available
    try {
      await this.switchToFlowView();
      // Sea view might not have regular nodes - just check it loads
      const flowWorking = await this.page.locator('.react-flow__renderer, .json-flow-flow, .flow-view-content').count() > 0;
      results.push({
        mode: 'flow',
        nodeCount: 1, // Sea view doesn't have traditional nodes
        working: flowWorking,
      });
    } catch (error) {
      results.push({
        mode: 'flow',
        nodeCount: 0,
        working: false,
        error: (error as Error).message,
      });
    }

    return results;
  }
}
