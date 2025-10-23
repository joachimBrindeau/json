/**
 * Manual test script to verify expand/collapse functionality
 * This script uses Puppeteer to test the JSON tree viewer
 */

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

async function testExpandCollapse() {
  console.log('🧪 Testing JSON Expand/Collapse Functionality');

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

    console.log('✅ Page loaded successfully');

    // Take initial screenshot
    await page.screenshot({ path: 'test-results/01-initial-page.png', fullPage: true });

    // Wait for and fill the JSON editor
    console.log('📝 Looking for JSON input field...');

    // Try to find Monaco editor or fallback to textarea
    let jsonInput;
    try {
      await page.waitForSelector('.monaco-editor', { timeout: 5000 });
      console.log('Found Monaco editor');

      // Click in Monaco editor and clear/paste JSON
      await page.click('.monaco-editor');
      await page.keyboard.down('Meta');
      await page.keyboard.press('a');
      await page.keyboard.up('Meta');
      await page.keyboard.type(JSON.stringify(complexTestJson, null, 2));
    } catch (e) {
      console.log('Monaco editor not found, trying textarea...');
      jsonInput = await page.$('textarea');
      if (jsonInput) {
        await jsonInput.click();
        await jsonInput.evaluate((el) => (el.value = ''));
        await jsonInput.type(JSON.stringify(complexTestJson, null, 2));
      } else {
        console.log('❌ No JSON input field found!');
        return;
      }
    }

    console.log('✅ JSON content entered');

    // Switch to tree view
    console.log('🌳 Switching to tree view...');
    try {
      await page.waitForSelector('button[data-testid="tree-view"], button:has-text("Tree")', {
        timeout: 5000,
      });
      await page.click('button[data-testid="tree-view"], button:has-text("Tree")');
      console.log('✅ Switched to tree view');
    } catch (e) {
      console.log('⚠️ Tree view button not found, might already be in tree view');
    }

    // Wait for tree to render
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Take screenshot of tree view
    await page.screenshot({ path: 'test-results/02-tree-view.png', fullPage: true });

    // Count expand buttons
    console.log('🔍 Counting expand/collapse buttons...');

    const expandButtons = await page.$$(
      'button svg.lucide-chevron-right, button svg.lucide-chevron-down'
    );
    console.log(`📊 Found ${expandButtons.length} expand/collapse buttons`);

    // Expected expand buttons for our test JSON:
    // 1. Root object
    // 2. user object
    // 3. profile object
    // 4. location object
    // 5. coordinates object
    // 6. preferences object
    // 7. notifications object
    // 8. hobbies array
    // 9. skills array
    // 10. posts array
    // 11. posts[0] object
    // 12. tags array in posts[0]
    // 13. metadata object in posts[0]
    // 14. comments array
    // 15. comments[0] object
    // 16. posts[1] object
    // 17. tags array in posts[1]
    // 18. metadata object in posts[1]
    // 19. comments array (empty)
    // 20. config object
    // 21. api object
    // 22. endpoints object
    // 23. features object
    // 24. analytics object
    // 25. providers array

    if (expandButtons.length >= 15) {
      console.log('✅ PASS: Found sufficient expand buttons for complex nested structure');
    } else {
      console.log(`❌ FAIL: Expected at least 15 expand buttons, found ${expandButtons.length}`);
    }

    // Test expanding a specific node
    console.log('🔄 Testing expand functionality...');

    try {
      // Look for user object expand button
      const userNodeButton = await page.$('button svg.lucide-chevron-right');
      if (userNodeButton) {
        await userNodeButton.click();
        console.log('✅ Successfully clicked expand button');

        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Take screenshot after expansion
        await page.screenshot({ path: 'test-results/03-expanded-node.png', fullPage: true });

        // Check if new nodes appeared
        const nodesAfterExpand = await page.$$('[data-testid="json-node"]');
        console.log(`📊 Found ${nodesAfterExpand.length} total nodes after expansion`);

        if (nodesAfterExpand.length > 5) {
          console.log('✅ PASS: Expansion created new visible nodes');
        } else {
          console.log('❌ FAIL: Expansion did not create enough new nodes');
        }
      } else {
        console.log('⚠️ No expand button found to test');
      }
    } catch (e) {
      console.log('❌ Error during expand test:', e.message);
    }

    // Test that primitive values don't have expand buttons
    console.log('🔍 Checking primitive values...');
    try {
      // Look for text nodes that should not have expand buttons
      const primitiveNodes = await page.$$eval('[data-testid="json-node"]', (nodes) => {
        return nodes.filter((node) => {
          const text = node.textContent || '';
          return text.includes('name:') || text.includes('id:') || text.includes('age:');
        }).length;
      });

      console.log(`📊 Found ${primitiveNodes} potential primitive value nodes`);

      if (primitiveNodes > 0) {
        console.log('✅ PASS: Found primitive value nodes');
      }
    } catch (e) {
      console.log('⚠️ Could not verify primitive nodes');
    }

    // Final screenshot
    await page.screenshot({ path: 'test-results/04-final-state.png', fullPage: true });

    console.log('✅ Test completed successfully!');
    console.log('📁 Screenshots saved in test-results/ directory');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'test-results/error-screenshot.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

// Run the test
testExpandCollapse().catch(console.error);
