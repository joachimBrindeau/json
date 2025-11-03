import { test, expect } from '@playwright/test';

const complexTestJson = {
  user: {
    id: 123,
    name: 'John Doe',
    profile: {
      age: 30,
      location: {
        country: 'USA',
        state: 'NY',
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
          sms: true,
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
      content: 'Lorem ipsum dolor sit amet',
      tags: ['tech', 'programming'],
      metadata: {
        created: '2025-01-01',
        views: 100,
        comments: [
          {
            id: 101,
            author: 'Alice',
            text: 'Great post!',
            replies: [
              {
                id: 201,
                author: 'Bob',
                text: 'I agree!',
              },
            ],
          },
        ],
      },
    },
    {
      id: 2,
      title: 'Second Post',
      content: 'Another post content',
      tags: ['lifestyle', 'travel'],
      metadata: {
        created: '2025-01-02',
        views: 200,
        comments: [],
      },
    },
  ],
  config: {
    api: {
      endpoints: {
        auth: '/api/auth',
        users: '/api/users',
        posts: '/api/posts',
      },
      timeout: 5000,
    },
    features: {
      darkMode: true,
      notifications: false,
      analytics: {
        enabled: true,
        providers: ['google', 'mixpanel'],
      },
    },
  },
};

test.describe('JSON Viewer Expand/Collapse Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3456');

    // Wait for the page to load
    await expect(page.locator('h1')).toBeVisible();

    // Paste the complex JSON into the editor
    await page.locator('[data-testid="json-editor"]').click();
    await page
      .locator('[data-testid="json-editor"]')
      .fill(JSON.stringify(complexTestJson, null, 2));

    // Switch to tree view to test expand/collapse
    await page.locator('[data-testid="tree-view"]').click();

    // Wait for the tree view to render
    await expect(page.locator('[data-testid="tree-view-content"]')).toBeVisible();
  });

  test('should show expand buttons only for complex fields (objects and arrays)', async ({
    page,
  }) => {
    // Wait for JSON nodes to be rendered
    await expect(page.locator('[data-testid="json-node"]').first()).toBeVisible();

    // Count all expand/collapse buttons
    const expandButtons = page.locator('[data-testid="json-node"] button').filter({
      has: page.locator('svg'), // ChevronRight or ChevronDown icons
    });

    const expandButtonCount = await expandButtons.count();
    console.log(`Found ${expandButtonCount} expand buttons`);

    // We should have expand buttons for:
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
    // 12. tags array (in posts[0])
    // 13. metadata object (in posts[0])
    // 14. comments array (in posts[0].metadata)
    // 15. comments[0] object
    // 16. replies array (in comments[0])
    // 17. replies[0] object
    // 18. posts[1] object
    // 19. tags array (in posts[1])
    // 20. metadata object (in posts[1])
    // 21. comments array (in posts[1].metadata) - empty but still expandable
    // 22. config object
    // 23. api object
    // 24. endpoints object
    // 25. features object
    // 26. analytics object
    // 27. providers array

    // Should be at least 20+ expand buttons for all the complex structures
    expect(expandButtonCount).toBeGreaterThan(15);

    // Verify no expand buttons on primitive values
    const primitiveNodes = page.locator('[data-testid="json-node"]').filter({
      has: page.locator('[data-type="string"], [data-type="number"], [data-type="boolean"]'),
    });

    const primitiveCount = await primitiveNodes.count();
    console.log(`Found ${primitiveCount} primitive nodes`);

    // Check that primitive nodes don't have expand buttons
    for (let i = 0; i < Math.min(5, primitiveCount); i++) {
      const primitiveNode = primitiveNodes.nth(i);
      const hasExpandButton = (await primitiveNode.locator('button').count()) > 0;
      expect(hasExpandButton).toBeFalsy();
    }
  });

  test('should expand and collapse individual complex fields correctly', async ({ page }) => {
    // Wait for the tree to render
    await expect(page.locator('[data-testid="json-node"]').first()).toBeVisible();

    // Find the user object expand button
    const userNode = page
      .locator('[data-testid="json-node"]')
      .filter({
        hasText: 'user:',
      })
      .first();

    await expect(userNode).toBeVisible();

    // Should have a chevron right initially (collapsed)
    const userExpandButton = userNode.locator('button').first();
    await expect(
      userExpandButton.locator('[data-testid="chevron-right"], .lucide-chevron-right')
    ).toBeVisible();

    // Click to expand user object
    await userExpandButton.click();

    // Should now show chevron down (expanded)
    await expect(
      userExpandButton.locator('[data-testid="chevron-down"], .lucide-chevron-down')
    ).toBeVisible();

    // Should now see user properties
    await expect(
      page.locator('[data-testid="json-node"]').filter({ hasText: 'id:' })
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="json-node"]').filter({ hasText: 'name:' })
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="json-node"]').filter({ hasText: 'profile:' })
    ).toBeVisible();

    // Find and expand the profile object
    const profileNode = page
      .locator('[data-testid="json-node"]')
      .filter({
        hasText: 'profile:',
      })
      .first();

    const profileExpandButton = profileNode.locator('button').first();
    await profileExpandButton.click();

    // Should see profile properties
    await expect(
      page.locator('[data-testid="json-node"]').filter({ hasText: 'age:' })
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="json-node"]').filter({ hasText: 'location:' })
    ).toBeVisible();

    // Test array expansion - find hobbies array
    const hobbiesNode = page
      .locator('[data-testid="json-node"]')
      .filter({
        hasText: 'hobbies:',
      })
      .first();

    const hobbiesExpandButton = hobbiesNode.locator('button').first();
    await hobbiesExpandButton.click();

    // Should see array items
    await expect(
      page.locator('[data-testid="json-node"]').filter({ hasText: '[0]:' })
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="json-node"]').filter({ hasText: 'reading' })
    ).toBeVisible();
  });

  test('should show correct expand indicators and tooltips', async ({ page }) => {
    await expect(page.locator('[data-testid="json-node"]').first()).toBeVisible();

    // Find a complex field that should have expand indicators
    const userNode = page
      .locator('[data-testid="json-node"]')
      .filter({
        hasText: 'user:',
      })
      .first();

    // Should show the object summary when collapsed
    await expect(userNode.locator('text=/\\{\\d+ keys\\}/')).toBeVisible();

    // Check for expand hint text
    await expect(userNode.locator('text=Click to expand')).toBeVisible();

    // Check tooltip on expand button
    const expandButton = userNode.locator('button').first();
    const title = await expandButton.getAttribute('title');
    expect(title).toContain('Expand');
    expect(title).toContain('object');
  });

  test('should handle deeply nested structures correctly', async ({ page }) => {
    await expect(page.locator('[data-testid="json-node"]').first()).toBeVisible();

    // Navigate to a deeply nested structure: user.profile.location.coordinates
    // Expand user
    await page
      .locator('[data-testid="json-node"]')
      .filter({ hasText: 'user:' })
      .first()
      .locator('button')
      .click();

    // Expand profile
    await page
      .locator('[data-testid="json-node"]')
      .filter({ hasText: 'profile:' })
      .first()
      .locator('button')
      .click();

    // Expand location
    await page
      .locator('[data-testid="json-node"]')
      .filter({ hasText: 'location:' })
      .first()
      .locator('button')
      .click();

    // Expand coordinates
    const coordinatesNode = page
      .locator('[data-testid="json-node"]')
      .filter({ hasText: 'coordinates:' })
      .first();
    await coordinatesNode.locator('button').click();

    // Should now see the lat and lng properties
    await expect(
      page.locator('[data-testid="json-node"]').filter({ hasText: 'lat:' })
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="json-node"]').filter({ hasText: 'lng:' })
    ).toBeVisible();

    // Verify the values are visible
    await expect(
      page.locator('[data-testid="json-node"]').filter({ hasText: '40.7128' })
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="json-node"]').filter({ hasText: '-74.006' })
    ).toBeVisible();
  });

  test('should handle arrays with complex objects correctly', async ({ page }) => {
    await expect(page.locator('[data-testid="json-node"]').first()).toBeVisible();

    // Find and expand the posts array
    const postsNode = page
      .locator('[data-testid="json-node"]')
      .filter({ hasText: 'posts:' })
      .first();
    await postsNode.locator('button').click();

    // Should see array indices
    await expect(
      page.locator('[data-testid="json-node"]').filter({ hasText: '[0]:' })
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="json-node"]').filter({ hasText: '[1]:' })
    ).toBeVisible();

    // Expand the first post object
    const firstPostNode = page
      .locator('[data-testid="json-node"]')
      .filter({ hasText: '[0]:' })
      .first();
    await firstPostNode.locator('button').click();

    // Should see post properties
    await expect(
      page.locator('[data-testid="json-node"]').filter({ hasText: 'title:' })
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="json-node"]').filter({ hasText: 'tags:' })
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="json-node"]').filter({ hasText: 'metadata:' })
    ).toBeVisible();

    // Expand tags array within the post
    const tagsNode = page.locator('[data-testid="json-node"]').filter({ hasText: 'tags:' }).first();
    await tagsNode.locator('button').click();

    // Should see tag values
    await expect(
      page.locator('[data-testid="json-node"]').filter({ hasText: 'tech' })
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="json-node"]').filter({ hasText: 'programming' })
    ).toBeVisible();
  });
});
