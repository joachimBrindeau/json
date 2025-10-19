import { test, expect } from '@playwright/test';

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
      "tags": ["lifestyle", "travel"],
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

test.describe('JSON Expand/Collapse Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3456');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Enter the test JSON using direct evaluation (more reliable than fill)
    const jsonString = JSON.stringify(complexTestJson, null, 2);
    await page.evaluate((jsonStr) => {
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
        }
      }
    }, jsonString);
    
    // Switch to tree view using correct selector
    await page.locator('[data-testid="tree-view"]').click();
    
    // Wait for tree view to render
    await page.waitForLoadState('networkidle'); // Wait for tree expansion
  });

  test('should display multiple expand buttons for complex nested JSON', async ({ page }) => {
    console.log('Testing expand buttons for complex JSON structure');
    
    // Wait for JSON nodes to be rendered
    await page.waitForSelector('[data-testid="json-node"]');
    
    // Count expand/collapse buttons (chevron icons)
    const expandButtons = page.locator('svg.lucide-chevron-right, svg.lucide-chevron-down');
    const expandButtonCount = await expandButtons.count();
    
    console.log(`Found ${expandButtonCount} expand buttons`);
    
    // We should have multiple expand buttons for complex structures:
    // - Root object
    // - user object  
    // - profile object
    // - location object
    // - coordinates object
    // - preferences object
    // - notifications object
    // - hobbies array
    // - skills array
    // - posts array
    // - posts[0] object
    // - tags array in posts[0]
    // - metadata object in posts[0]
    // - comments array in posts[0].metadata
    // - comments[0] object
    // - posts[1] object
    // - tags array in posts[1]
    // - metadata object in posts[1]
    // - comments array in posts[1].metadata (empty but expandable)
    // - config object
    // - api object
    // - endpoints object
    // - features object
    // - analytics object
    // - providers array
    
    // Should have at least 3 expand buttons (user, posts, config at minimum)
    expect(expandButtonCount).toBeGreaterThanOrEqual(3);
    
    // Take a screenshot for verification
    await page.screenshot({ path: 'test-results/expand-buttons-overview.png' });
  });

  test('should expand and show child elements correctly', async ({ page }) => {
    console.log('Testing expand/collapse functionality');
    
    // Wait for tree view
    await page.waitForSelector('[data-testid="json-node"]');
    
    // Find the user object expand button
    const userNodeExpandBtn = page.locator('[data-testid="json-node"]:has-text("user:") button').first();
    await userNodeExpandBtn.click();
    
    // Should now see user properties
    await expect(page.locator('[data-testid="json-node"]:has-text("id:")')).toBeVisible();
    await expect(page.locator('[data-testid="json-node"]:has-text("name:")')).toBeVisible();
    await expect(page.locator('[data-testid="json-node"]:has-text("profile:")')).toBeVisible();
    
    console.log('✅ User object expanded successfully');
    
    // Expand the profile object
    const profileExpandBtn = page.locator('[data-testid="json-node"]:has-text("profile:") button').first();
    await profileExpandBtn.click();
    
    // Should see profile properties
    await expect(page.locator('[data-testid="json-node"]:has-text("age:")')).toBeVisible();
    await expect(page.locator('[data-testid="json-node"]:has-text("location:")')).toBeVisible();
    
    console.log('✅ Profile object expanded successfully');
    
    // Expand the hobbies array
    const hobbiesExpandBtn = page.locator('[data-testid="json-node"]:has-text("hobbies:") button').first();
    await hobbiesExpandBtn.click();
    
    // Should see array items
    await expect(page.locator('[data-testid="json-node"]:has-text("[0]:")')).toBeVisible();
    await expect(page.locator('[data-testid="json-node"]:has-text("reading")')).toBeVisible();
    
    console.log('✅ Hobbies array expanded successfully');
    
    // Take a screenshot showing expanded structure
    await page.screenshot({ path: 'test-results/expanded-structure.png' });
  });

  test('should handle nested arrays correctly', async ({ page }) => {
    console.log('Testing nested arrays functionality');
    
    await page.waitForSelector('[data-testid="json-node"]');
    
    // Expand posts array
    const postsExpandBtn = page.locator('[data-testid="json-node"]:has-text("posts:") button').first();
    await postsExpandBtn.click();
    
    // Should see array indices
    await expect(page.locator('[data-testid="json-node"]:has-text("[0]:")')).toBeVisible();
    await expect(page.locator('[data-testid="json-node"]:has-text("[1]:")')).toBeVisible();
    
    // Expand first post
    const firstPostExpandBtn = page.locator('[data-testid="json-node"]:has-text("[0]:") button').first();
    await firstPostExpandBtn.click();
    
    // Should see post properties
    await expect(page.locator('[data-testid="json-node"]:has-text("title:")')).toBeVisible();
    await expect(page.locator('[data-testid="json-node"]:has-text("tags:")')).toBeVisible();
    
    // Expand tags array within the post
    const tagsExpandBtn = page.locator('[data-testid="json-node"]:has-text("tags:") button').first();
    await tagsExpandBtn.click();
    
    // Should see tag values
    await expect(page.locator('[data-testid="json-node"]:has-text("tech")')).toBeVisible();
    
    console.log('✅ Nested arrays handled correctly');
    
    await page.screenshot({ path: 'test-results/nested-arrays.png' });
  });

  test('should not show expand buttons for primitive values', async ({ page }) => {
    console.log('Testing that primitive values do not have expand buttons');
    
    await page.waitForSelector('[data-testid="json-node"]');
    
    // Expand user to see primitive values
    await page.locator('[data-testid="json-node"]:has-text("user:") button').click();
    
    // Check that primitive values don't have expand buttons
    const nameNode = page.locator('[data-testid="json-node"]:has-text("name:")');
    const nameExpandBtn = nameNode.locator('button');
    expect(await nameExpandBtn.count()).toBe(0);
    
    const idNode = page.locator('[data-testid="json-node"]:has-text("id:")');  
    const idExpandBtn = idNode.locator('button');
    expect(await idExpandBtn.count()).toBe(0);
    
    console.log('✅ Primitive values correctly have no expand buttons');
  });

  test('should show visual indicators for complex fields', async ({ page }) => {
    console.log('Testing visual indicators for complex fields');
    
    await page.waitForSelector('[data-testid="json-node"]');
    
    // Check for object summary indicators
    const userNode = page.locator('[data-testid="json-node"]:has-text("user:")');
    
    // Should show object summary like "{X keys}" 
    await expect(userNode.locator('text=/\\{\\d+ \\w+\\}/')).toBeVisible();
    
    // Should show expand hint
    await expect(userNode.locator('text=/Click to expand/')).toBeVisible();
    
    console.log('✅ Visual indicators are present');
    
    await page.screenshot({ path: 'test-results/visual-indicators.png' });
  });
});