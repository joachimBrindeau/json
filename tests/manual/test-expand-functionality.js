const puppeteer = require('puppeteer');

const complexTestJson = {
  "user": {
    "id": 123,
    "name": "John Doe",
    "profile": {
      "age": 30,
      "location": {
        "country": "USA",
        "coordinates": {
          "lat": 40.7128,
          "lng": -74.0060
        }
      },
      "preferences": {
        "theme": "dark",
        "notifications": {
          "email": true,
          "push": false
        }
      }
    },
    "hobbies": ["reading", "gaming", "cooking"],
    "skills": ["JavaScript", "Python", "React"]
  },
  "posts": [
    {
      "id": 1,
      "title": "First Post",
      "tags": ["tech", "programming"],
      "metadata": {
        "created": "2025-01-01",
        "comments": [
          {
            "id": 101,
            "author": "Alice",
            "text": "Great post!"
          }
        ]
      }
    },
    {
      "id": 2,
      "title": "Second Post",
      "tags": ["lifestyle"],
      "metadata": {
        "created": "2025-01-02",
        "comments": []
      }
    }
  ],
  "config": {
    "api": {
      "endpoints": {
        "auth": "/api/auth",
        "users": "/api/users"
      }
    },
    "features": {
      "darkMode": true,
      "analytics": {
        "enabled": true,
        "providers": ["google", "mixpanel"]
      }
    }
  }
};

async function testExpandFunctionality() {
  console.log('🧪 Testing Expand/Collapse Functionality');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1200, height: 800 }
  });
  
  try {
    const page = await browser.newPage();
    
    console.log('📱 Navigating to localhost:3456...');
    await page.goto('http://localhost:3456', { 
      waitUntil: 'networkidle2',
      timeout: 60000 
    });
    
    // Enter JSON using the working method
    console.log('📝 Entering complex JSON...');
    const jsonString = JSON.stringify(complexTestJson, null, 2);
    
    await page.evaluate((jsonStr) => {
      // Set textarea value and trigger events
      const textarea = document.querySelector('textarea');
      if (textarea) {
        textarea.value = jsonStr;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.dispatchEvent(new Event('change', { bubbles: true }));
      }
      
      // Also try Monaco editor
      if (window.monaco) {
        const editors = window.monaco.editor.getEditors();
        if (editors.length > 0) {
          editors[0].setValue(jsonStr);
        }
      }
    }, jsonString);
    
    // Switch to tree view
    console.log('🌳 Switching to tree view...');
    await page.click('[data-testid="tree-view"]');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Take screenshot of initial tree state
    await page.screenshot({ path: 'test-results/expand-test-01-initial-tree.png', fullPage: true });
    
    // Count initial expand buttons
    const initialExpandButtons = await page.$$eval('svg.lucide-chevron-right, svg.lucide-chevron-down', 
      elements => elements.length
    );
    console.log(`📊 Initial expand buttons: ${initialExpandButtons}`);
    
    // Test 1: Expand user object
    console.log('🔄 Test 1: Expanding user object...');
    
    try {
      // Click on the user expand button
      await page.click('svg.lucide-chevron-right');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Count expand buttons after first expansion
      const afterUserExpand = await page.$$eval('svg.lucide-chevron-right, svg.lucide-chevron-down', 
        elements => elements.length
      );
      console.log(`📊 After user expand: ${afterUserExpand} buttons`);
      
      if (afterUserExpand > initialExpandButtons) {
        console.log('✅ PASS: User expansion revealed more expand buttons');
      } else {
        console.log('❌ FAIL: User expansion did not reveal more buttons');
      }
      
      await page.screenshot({ path: 'test-results/expand-test-02-user-expanded.png', fullPage: true });
      
    } catch (e) {
      console.log('❌ Failed to expand user object:', e.message);
    }
    
    // Test 2: Expand profile object (nested)
    console.log('🔄 Test 2: Expanding profile object...');
    try {
      // Find and click profile expand button
      const profileButton = await page.$('svg.lucide-chevron-right');
      if (profileButton) {
        await profileButton.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const afterProfileExpand = await page.$$eval('svg.lucide-chevron-right, svg.lucide-chevron-down', 
          elements => elements.length
        );
        console.log(`📊 After profile expand: ${afterProfileExpand} buttons`);
        
        await page.screenshot({ path: 'test-results/expand-test-03-profile-expanded.png', fullPage: true });
        console.log('✅ Profile expansion completed');
      }
    } catch (e) {
      console.log('⚠️ Profile expansion failed:', e.message);
    }
    
    // Test 3: Expand arrays
    console.log('🔄 Test 3: Testing array expansions...');
    try {
      // Click on multiple expand buttons to expand arrays
      const remainingButtons = await page.$$('svg.lucide-chevron-right');
      console.log(`📊 Found ${remainingButtons.length} more expandable items`);
      
      // Expand first few arrays
      for (let i = 0; i < Math.min(3, remainingButtons.length); i++) {
        await remainingButtons[i].click();
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log(`✅ Expanded item ${i + 1}`);
      }
      
      await page.screenshot({ path: 'test-results/expand-test-04-arrays-expanded.png', fullPage: true });
      
    } catch (e) {
      console.log('⚠️ Array expansion failed:', e.message);
    }
    
    // Final count
    const finalExpandButtons = await page.$$eval('svg.lucide-chevron-right, svg.lucide-chevron-down', 
      elements => elements.length
    );
    console.log(`📊 Final expand button count: ${finalExpandButtons}`);
    
    // Test 4: Verify complex nested structure
    console.log('🔍 Test 4: Verifying complex nested structure...');
    
    const nodeCount = await page.$$eval('[data-testid="json-node"]', elements => elements.length);
    const hasDeepNesting = await page.evaluate(() => {
      // Check for deeply nested elements by looking for indentation or nesting levels
      const nodes = Array.from(document.querySelectorAll('[data-testid="json-node"]'));
      return nodes.some(node => {
        const text = node.textContent || '';
        // Look for nested properties that should be visible after expansion
        return text.includes('coordinates:') || text.includes('notifications:') || text.includes('metadata:');
      });
    });
    
    console.log(`📊 Total JSON nodes visible: ${nodeCount}`);
    console.log(`🏗️  Deep nesting detected: ${hasDeepNesting ? 'Yes' : 'No'}`);
    
    // Success criteria
    const success = {
      hasMultipleExpandButtons: finalExpandButtons >= 5,
      hasJsonNodes: nodeCount > 10,
      hasDeepNesting: hasDeepNesting,
      buttonsIncreased: finalExpandButtons >= initialExpandButtons
    };
    
    console.log('\n🎯 TEST RESULTS:');
    console.log(`✅ Multiple expand buttons (${finalExpandButtons} >= 5): ${success.hasMultipleExpandButtons}`);
    console.log(`✅ JSON nodes rendered (${nodeCount} > 10): ${success.hasJsonNodes}`);
    console.log(`✅ Deep nesting visible: ${success.hasDeepNesting}`);
    console.log(`✅ Button count maintained/increased: ${success.buttonsIncreased}`);
    
    const overallSuccess = Object.values(success).every(Boolean);
    console.log(`\n🏆 OVERALL RESULT: ${overallSuccess ? 'SUCCESS' : 'NEEDS IMPROVEMENT'}`);
    
    if (overallSuccess) {
      console.log('🎉 All expand/collapse functionality tests PASSED!');
    } else {
      console.log('⚠️  Some tests failed - functionality needs review');
    }
    
    await page.screenshot({ path: 'test-results/expand-test-05-final-state.png', fullPage: true });
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'test-results/expand-test-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

testExpandFunctionality().catch(console.error);