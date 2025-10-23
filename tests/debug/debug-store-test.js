const puppeteer = require('puppeteer');

const complexTestJson = {
  user: {
    id: 123,
    name: 'John Doe',
    profile: {
      age: 30,
      hobbies: ['reading', 'gaming'],
    },
  },
};

async function debugStoreState() {
  console.log('🔍 Debug: Store State and JSON Content');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1200, height: 800 },
  });

  try {
    const page = await browser.newPage();

    console.log('📱 Navigating to localhost:3456...');
    await page.goto('http://localhost:3456', {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });

    // Enter JSON in the textarea
    console.log('📝 Entering JSON...');
    const jsonInput = await page.$('textarea');
    if (jsonInput) {
      await jsonInput.click();
      await page.keyboard.down('Meta');
      await page.keyboard.press('a');
      await page.keyboard.up('Meta');
      await page.type('textarea', JSON.stringify(complexTestJson, null, 2));
      console.log('✅ JSON entered in textarea');

      // Wait a bit for the store to update
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } else {
      console.log('❌ No textarea found');
      return;
    }

    // Check store state before switching tabs
    const storeStateBeforeSwitch = await page.evaluate(() => {
      // Try to access the store state (this might not work directly)
      const textareaValue = document.querySelector('textarea')?.value || '';
      return {
        textareaContent: textareaValue.substring(0, 200) + '...',
        textareaLength: textareaValue.length,
        hasJsonContent: textareaValue.trim().length > 0,
      };
    });

    console.log('Store state before tab switch:', storeStateBeforeSwitch);

    // Switch to tree view
    console.log('🌳 Switching to tree view...');
    await page.click('[data-testid="tree-view"]');
    console.log('✅ Clicked tree view tab');

    // Wait for components to render
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Check what got rendered
    const postSwitchState = await page.evaluate(() => {
      // Check for various components
      const ultraJsonViewer = document.querySelector('[data-testid="ultra-json-viewer"]');
      const jsonNodes = document.querySelectorAll('[data-testid="json-node"]');
      const anyTreeContent =
        document.querySelector('[data-tree]') || document.querySelector('[role="tree"]');
      const errorMessages = document.querySelectorAll(
        '[data-testid*="error"], .error, [role="alert"]'
      );

      // Check if tree view is actually active
      const treeTabButton = document.querySelector('[data-testid="tree-view"]');
      const isTreeTabActive =
        treeTabButton?.getAttribute('aria-selected') === 'true' ||
        treeTabButton?.getAttribute('data-state') === 'active';

      return {
        ultraJsonViewerFound: !!ultraJsonViewer,
        jsonNodesCount: jsonNodes.length,
        hasTreeContent: !!anyTreeContent,
        errorCount: errorMessages.length,
        isTreeTabActive,
        treeTabState: treeTabButton?.getAttribute('data-state'),
        treeTabSelected: treeTabButton?.getAttribute('aria-selected'),
      };
    });

    console.log('Post-switch state:', postSwitchState);

    // Take screenshot for analysis
    await page.screenshot({ path: 'test-results/debug-store-state.png', fullPage: true });
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    await page.screenshot({ path: 'test-results/debug-store-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

debugStoreState().catch(console.error);
