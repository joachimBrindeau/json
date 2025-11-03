/**
 * Deep Viewer Component Analysis
 *
 * Analyzes the actual DOM to determine which viewer components are rendered
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe.serial('Viewer Deep Analysis', () => {
  const results: any = {
    timestamp: new Date().toISOString(),
    viewers: {},
    routes: {},
  };

  test('Analyze Homepage (/) viewer', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Get all class names in the page
    const allClasses = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const classes = new Set<string>();
      elements.forEach((el) => {
        el.classList.forEach((cls) => classes.add(cls));
      });
      return Array.from(classes);
    });

    // Check for viewer-related classes
    const viewerClasses = allClasses.filter(
      (cls) =>
        cls.includes('viewer') ||
        cls.includes('json') ||
        cls.includes('tree') ||
        cls.includes('ultra') ||
        cls.includes('smart') ||
        cls.includes('simple') ||
        cls.includes('virtual')
    );

    // Check for specific components
    const componentChecks = {
      UltraJsonViewer: (await page.locator('[class*="ultra"]').count()) > 0,
      SmartJsonViewer: (await page.locator('[class*="smart-json-viewer"]').count()) > 0,
      SimpleJsonViewer: (await page.locator('[class*="simple-json-viewer"]').count()) > 0,
      VirtualJsonViewer: (await page.locator('[class*="virtual-json-viewer"]').count()) > 0,
      JsonViewer:
        (await page
          .locator('[class*="json-viewer"]:not([class*="ultra"]):not([class*="smart"])')
          .count()) > 0,
      TreeView: (await page.locator('[class*="tree"]').count()) > 0,
      FlowView: (await page.locator('[class*="flow"]').count()) > 0,
    };

    results.routes['/'] = {
      viewerClasses,
      components: componentChecks,
    };

    console.log('Homepage analysis:', componentChecks);
  });

  test('Analyze Editor (/edit) viewer', async ({ page }) => {
    await page.goto('/edit');
    await page.waitForLoadState('networkidle');

    const componentChecks = {
      UltraJsonViewer: (await page.locator('[class*="ultra"]').count()) > 0,
      SmartJsonViewer: (await page.locator('[class*="smart-json-viewer"]').count()) > 0,
      SimpleJsonViewer: (await page.locator('[class*="simple-json-viewer"]').count()) > 0,
      VirtualJsonViewer: (await page.locator('[class*="virtual-json-viewer"]').count()) > 0,
      JsonViewer:
        (await page
          .locator('[class*="json-viewer"]:not([class*="ultra"]):not([class*="smart"])')
          .count()) > 0,
    };

    results.routes['/edit'] = {
      components: componentChecks,
    };

    console.log('Editor analysis:', componentChecks);
  });

  test('Analyze Compare (/compare) viewer', async ({ page }) => {
    await page.goto('/compare');
    await page.waitForLoadState('networkidle');

    const componentChecks = {
      JsonCompare: (await page.locator('[class*="compare"]').count()) > 0,
      DiffViewer: (await page.locator('[class*="diff"]').count()) > 0,
    };

    results.routes['/compare'] = {
      components: componentChecks,
    };

    console.log('Compare analysis:', componentChecks);
  });

  test('Check component files in codebase', async () => {
    const viewerFiles = [
      'components/features/viewer/ultra-optimized-viewer/UltraJsonViewer.tsx',
      'components/features/viewer/smart-json-viewer.tsx',
      'components/features/viewer/simple-json-viewer.tsx',
      'components/features/viewer/virtual-json-viewer.tsx',
      'components/features/viewer/json-viewer.tsx',
      'components/features/viewer/json-compare.tsx',
      'components/features/viewer/json-action-buttons.tsx',
    ];

    results.viewers = {
      UltraJsonViewer: {
        file: 'ultra-optimized-viewer/UltraJsonViewer.tsx',
        usedInRoutes: [],
        imports: [],
      },
      SmartJsonViewer: {
        file: 'smart-json-viewer.tsx',
        usedInRoutes: [],
        imports: [],
      },
      SimpleJsonViewer: {
        file: 'simple-json-viewer.tsx',
        usedInRoutes: [],
        imports: [],
      },
      VirtualJsonViewer: {
        file: 'virtual-json-viewer.tsx',
        usedInRoutes: [],
        imports: [],
      },
      JsonViewer: {
        file: 'json-viewer.tsx',
        usedInRoutes: [],
        imports: [],
      },
      JsonCompare: {
        file: 'json-compare.tsx',
        usedInRoutes: [],
        imports: [],
      },
      JsonActionButtons: {
        file: 'json-action-buttons.tsx',
        usedInRoutes: [],
        imports: [],
      },
    };

    // Analyze which routes use which viewers
    Object.entries(results.routes).forEach(([route, data]: [string, any]) => {
      Object.entries(data.components).forEach(([component, isUsed]) => {
        if (isUsed && results.viewers[component]) {
          results.viewers[component].usedInRoutes.push(route);
        }
      });
    });
  });

  test('Generate final report', async () => {
    // Save detailed report
    const reportPath = path.join(__dirname, '../test-results/viewer-deep-analysis.json');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));

    console.log('\n=== VIEWER DEEP ANALYSIS REPORT ===\n');

    Object.entries(results.viewers).forEach(([name, data]: [string, any]) => {
      const status = data.usedInRoutes.length > 0 ? '✅ USED' : '❌ UNUSED';
      const routes = data.usedInRoutes.length > 0 ? data.usedInRoutes.join(', ') : 'None';
      console.log(`${status} ${name}`);
      console.log(`  File: ${data.file}`);
      console.log(`  Routes: ${routes}`);
      console.log('');
    });

    console.log(`Report saved to: ${reportPath}`);
  });
});
