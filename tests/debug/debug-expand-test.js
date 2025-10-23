const puppeteer = require('puppeteer');

const complexTestJson = {
  user: {
    id: 123,
    name: 'John Doe',
    profile: {
      age: 30,
      location: {
        country: 'USA',
        coordinates: {
          lat: 40.7128,
          lng: -74.006,
        },
      },
      preferences: {
        theme: 'dark',
        notifications: {
          email: true,
          push: false,
        },
      },
    },
    hobbies: ['reading', 'gaming', 'cooking'],
    skills: ['JavaScript', 'Python', 'React'],
  },
  posts: [
    {
      id: 1,
      title: 'First Post',
      tags: ['tech', 'programming'],
      metadata: {
        created: '2025-01-01',
        comments: [
          {
            id: 101,
            author: 'Alice',
            text: 'Great post!',
          },
        ],
      },
    },
    {
      id: 2,
      title: 'Second Post',
      tags: ['lifestyle'],
      metadata: {
        created: '2025-01-02',
        comments: [],
      },
    },
  ],
  config: {
    api: {
      endpoints: {
        auth: '/api/auth',
        users: '/api/users',
      },
    },
    features: {
      darkMode: true,
      analytics: {
        enabled: true,
        providers: ['google', 'mixpanel'],
      },
    },
  },
};

async function debugExpandCollapse() {
  console.log('🔍 Debug: JSON Expand/Collapse Functionality');

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

    await page.screenshot({ path: 'test-results/debug-01-initial-load.png', fullPage: true });

    // Enter JSON in the textarea (Monaco editor)
    console.log('📝 Entering JSON...');
    const jsonInput = await page.$('textarea');
    if (jsonInput) {
      await jsonInput.click();
      await page.keyboard.down('Meta');
      await page.keyboard.press('a');
      await page.keyboard.up('Meta');
      await page.type('textarea', JSON.stringify(complexTestJson, null, 2));
      console.log('✅ JSON entered in textarea');
    } else {
      console.log('❌ No textarea found');
      return;
    }

    await page.screenshot({ path: 'test-results/debug-02-json-entered.png', fullPage: true });

    // Switch to tree view using the correct selector
    console.log('🌳 Switching to tree view...');
    try {
      await page.waitForSelector('[data-testid="tree-view"]', { timeout: 5000 });
      await page.click('[data-testid="tree-view"]');
      console.log('✅ Clicked tree view tab');
    } catch (e) {
      console.log('❌ Tree view tab not found:', e.message);
      return;
    }

    // Wait for tree to render
    console.log('⏳ Waiting for tree view to render...');
    await new Promise((resolve) => setTimeout(resolve, 3000));

    await page.screenshot({ path: 'test-results/debug-03-tree-view-clicked.png', fullPage: true });

    // Debug: Check what elements are actually on the page
    console.log('🔍 Debugging DOM elements...');

    // Check for UltraJsonViewer
    const ultraViewer = await page.$('[data-testid="ultra-json-viewer"]');
    console.log('UltraJsonViewer found:', !!ultraViewer);

    // Check for json nodes
    const jsonNodes = await page.$$('[data-testid="json-node"]');
    console.log(`JSON nodes found: ${jsonNodes.length}`);

    // Check for various chevron selectors
    const chevronSelectors = [
      'svg.lucide-chevron-right',
      'svg.lucide-chevron-down',
      '[class*="chevron"]',
      'button:has([class*="chevron"])',
      'button > svg',
      '.lucide-chevron-right',
      '.lucide-chevron-down',
    ];

    for (const selector of chevronSelectors) {
      const elements = await page.$$(selector);
      console.log(`${selector}: ${elements.length} elements found`);
    }

    // Check for any buttons
    const allButtons = await page.$$('button');
    console.log(`Total buttons found: ${allButtons.length}`);

    // Get all button text content for debugging
    const buttonTexts = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons
        .map((btn) => ({
          text: btn.textContent?.trim() || '',
          classes: btn.className,
          testId: btn.getAttribute('data-testid'),
        }))
        .filter((b) => b.text || b.testId);
    });

    console.log('Button details:', JSON.stringify(buttonTexts, null, 2));

    // Check page HTML content in tree view area
    const treeContent = await page.evaluate(() => {
      const treeView = document.querySelector('[data-testid="tree-view"]');
      if (treeView?.parentElement?.parentElement) {
        return treeView.parentElement.parentElement.innerHTML.substring(0, 1000);
      }
      return 'Tree view content area not found';
    });

    console.log('Tree view content preview:', treeContent);

    await page.screenshot({ path: 'test-results/debug-04-final-state.png', fullPage: true });
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    await page.screenshot({ path: 'test-results/debug-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

debugExpandCollapse().catch(console.error);
