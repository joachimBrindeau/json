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
};

async function debugMonacoInput() {
  console.log('🔍 Debug: Monaco Editor Input');

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

    await page.screenshot({ path: 'test-results/debug-monaco-01-initial.png', fullPage: true });

    // Wait for Monaco editor to load
    console.log('⏳ Waiting for Monaco editor...');
    try {
      await page.waitForSelector('.monaco-editor', { timeout: 10000 });
      console.log('✅ Monaco editor found');
    } catch (e) {
      console.log('❌ Monaco editor not found, looking for textarea...');
      await page.waitForSelector('textarea', { timeout: 5000 });
    }

    // Method 1: Try Monaco editor approach
    console.log('📝 Method 1: Trying Monaco editor...');
    const jsonString = JSON.stringify(complexTestJson, null, 2);

    try {
      // Click in the Monaco editor area
      await page.click('.monaco-editor .view-lines');
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Select all and replace
      await page.keyboard.down('Meta');
      await page.keyboard.press('a');
      await page.keyboard.up('Meta');
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Use clipboard to paste content (more reliable than typing)
      await page.evaluate((text) => {
        navigator.clipboard
          .writeText(text)
          .then(() => {
            document.execCommand('paste');
          })
          .catch(() => {
            // Fallback: direct Monaco manipulation
            const monaco = window.monaco;
            if (monaco) {
              const editors = monaco.editor.getEditors();
              if (editors.length > 0) {
                editors[0].setValue(text);
              }
            }
          });
      }, jsonString);

      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log('✅ Method 1 attempted');
    } catch (e) {
      console.log('⚠️ Method 1 failed:', e.message);
    }

    // Method 2: Fallback to textarea
    console.log('📝 Method 2: Trying textarea fallback...');
    try {
      const textarea = await page.$('textarea');
      if (textarea) {
        await textarea.click();
        await page.keyboard.down('Meta');
        await page.keyboard.press('a');
        await page.keyboard.up('Meta');
        await textarea.type(jsonString, { delay: 10 });
        console.log('✅ Method 2 completed');
      }
    } catch (e) {
      console.log('⚠️ Method 2 failed:', e.message);
    }

    // Method 3: Direct evaluation
    console.log('📝 Method 3: Direct evaluation...');
    try {
      await page.evaluate((jsonStr) => {
        // Try to find textarea and set value
        const textarea = document.querySelector('textarea');
        if (textarea) {
          textarea.value = jsonStr;
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
          textarea.dispatchEvent(new Event('change', { bubbles: true }));
        }

        // Also try Monaco editor if available
        if (window.monaco) {
          const editors = window.monaco.editor.getEditors();
          if (editors.length > 0) {
            editors[0].setValue(jsonStr);
            // Trigger change event
            editors[0].getModel().setValue(jsonStr);
          }
        }
      }, jsonString);
      console.log('✅ Method 3 completed');
    } catch (e) {
      console.log('⚠️ Method 3 failed:', e.message);
    }

    await page.screenshot({ path: 'test-results/debug-monaco-02-after-input.png', fullPage: true });

    // Check content after input
    const contentCheck = await page.evaluate(() => {
      const textarea = document.querySelector('textarea');
      const textareaValue = textarea ? textarea.value : '';

      return {
        textareaValue: textareaValue.substring(0, 100) + '...',
        textareaLength: textareaValue.length,
        hasValidJson: textareaValue.trim().startsWith('{') && textareaValue.trim().endsWith('}'),
      };
    });

    console.log('Content check after input:', contentCheck);

    // Now switch to tree view
    console.log('🌳 Switching to tree view...');
    await page.click('[data-testid="tree-view"]');
    await new Promise((resolve) => setTimeout(resolve, 3000));

    await page.screenshot({ path: 'test-results/debug-monaco-03-tree-view.png', fullPage: true });

    // Check final state
    const finalState = await page.evaluate(() => {
      const ultraJsonViewer = document.querySelector('[data-testid="ultra-json-viewer"]');
      const jsonNodes = document.querySelectorAll('[data-testid="json-node"]');
      const chevronButtons = document.querySelectorAll(
        'svg.lucide-chevron-right, svg.lucide-chevron-down'
      );
      const anyButtons = document.querySelectorAll('button');

      return {
        ultraJsonViewerFound: !!ultraJsonViewer,
        jsonNodesCount: jsonNodes.length,
        chevronButtonsCount: chevronButtons.length,
        totalButtonsCount: anyButtons.length,
        hasTreeContent:
          document.querySelector('[data-tree]') || document.querySelector('[role="tree"]')
            ? true
            : false,
      };
    });

    console.log('Final state:', finalState);

    if (finalState.chevronButtonsCount > 0) {
      console.log('🎉 SUCCESS: Found expand/collapse buttons!');
    } else {
      console.log('❌ FAILED: No expand/collapse buttons found');
    }
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    await page.screenshot({ path: 'test-results/debug-monaco-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

debugMonacoInput().catch(console.error);
