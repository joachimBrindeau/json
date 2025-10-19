/**
 * Viewer Component Usage Verification
 * 
 * This test suite verifies which viewer components are actually rendered
 * in the browser across all routes. This provides runtime certainty about
 * component usage, beyond static code analysis.
 */

import { test, expect } from '@playwright/test';

interface ViewerUsage {
  route: string;
  viewerType: string;
  componentName: string;
  isRendered: boolean;
  className?: string;
  dataTestId?: string;
}

const viewerUsageResults: ViewerUsage[] = [];

test.describe('Viewer Component Usage Verification', () => {
  
  test('Homepage (/) - Identify viewer components', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for UltraJsonViewer
    const ultraViewer = await page.locator('[class*="ultra"]').count();
    const treeView = await page.locator('[data-testid*="tree"], [class*="tree-view"]').count();
    const rawView = await page.locator('[data-testid*="raw"], [class*="raw-view"]').count();
    const flowView = await page.locator('[data-testid*="flow"], [class*="flow-view"]').count();
    
    viewerUsageResults.push({
      route: '/',
      viewerType: 'UltraJsonViewer',
      componentName: 'UltraJsonViewer',
      isRendered: ultraViewer > 0 || treeView > 0,
      className: 'ultra-json-viewer',
    });
    
    // Check for SmartJsonViewer
    const smartViewer = await page.locator('[class*="smart"]').count();
    viewerUsageResults.push({
      route: '/',
      viewerType: 'SmartJsonViewer',
      componentName: 'SmartJsonViewer',
      isRendered: smartViewer > 0,
    });
    
    // Check for SimpleJsonViewer
    const simpleViewer = await page.locator('[class*="simple-json-viewer"]').count();
    viewerUsageResults.push({
      route: '/',
      viewerType: 'SimpleJsonViewer',
      componentName: 'SimpleJsonViewer',
      isRendered: simpleViewer > 0,
    });
    
    // Check for VirtualJsonViewer
    const virtualViewer = await page.locator('[class*="virtual-json-viewer"]').count();
    viewerUsageResults.push({
      route: '/',
      viewerType: 'VirtualJsonViewer',
      componentName: 'VirtualJsonViewer',
      isRendered: virtualViewer > 0,
    });
    
    // Check for standard JsonViewer
    const jsonViewer = await page.locator('[class*="json-viewer"]:not([class*="ultra"]):not([class*="smart"]):not([class*="simple"]):not([class*="virtual"])').count();
    viewerUsageResults.push({
      route: '/',
      viewerType: 'JsonViewer',
      componentName: 'JsonViewer',
      isRendered: jsonViewer > 0,
    });
    
    console.log('Homepage viewers:', {
      ultra: ultraViewer > 0 || treeView > 0,
      smart: smartViewer > 0,
      simple: simpleViewer > 0,
      virtual: virtualViewer > 0,
      standard: jsonViewer > 0,
    });
  });
  
  test('Editor (/edit) - Identify viewer components', async ({ page }) => {
    await page.goto('/edit');
    await page.waitForLoadState('networkidle');
    
    const ultraViewer = await page.locator('[class*="ultra"]').count();
    const treeView = await page.locator('[data-testid*="tree"], [class*="tree-view"]').count();
    
    viewerUsageResults.push({
      route: '/edit',
      viewerType: 'UltraJsonViewer',
      componentName: 'UltraJsonViewer',
      isRendered: ultraViewer > 0 || treeView > 0,
    });
    
    console.log('Editor viewers:', {
      ultra: ultraViewer > 0 || treeView > 0,
    });
  });
  
  test('Compare (/compare) - Identify viewer components', async ({ page }) => {
    await page.goto('/compare');
    await page.waitForLoadState('networkidle');
    
    const compareComponent = await page.locator('[class*="compare"], [data-testid*="compare"]').count();
    
    viewerUsageResults.push({
      route: '/compare',
      viewerType: 'JsonCompare',
      componentName: 'JsonCompare',
      isRendered: compareComponent > 0,
    });
    
    console.log('Compare viewers:', {
      compare: compareComponent > 0,
    });
  });
  
  test('Library (/library) - Identify viewer components', async ({ page }) => {
    await page.goto('/library');
    await page.waitForLoadState('networkidle');
    
    // Library page shows list, not viewer directly
    const hasViewerLinks = await page.locator('a[href*="/library/"]').count();
    
    console.log('Library page:', {
      hasViewerLinks: hasViewerLinks > 0,
    });
  });
  
  test('Test with actual JSON data - Homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Input JSON data
    const testJson = {
      name: 'Test',
      value: 123,
      nested: {
        array: [1, 2, 3],
        object: { key: 'value' }
      }
    };
    
    // Find editor/input area
    const editor = page.locator('textarea, [class*="monaco"], [class*="editor"]').first();
    if (await editor.isVisible()) {
      await editor.click();
      await editor.fill(JSON.stringify(testJson, null, 2));
      await page.waitForLoadState('networkidle'); // Wait for viewer to update
    }
    
    // Check which viewer rendered the data
    const hasTreeNodes = await page.locator('[class*="tree-node"], [class*="json-node"]').count();
    const hasRawView = await page.locator('pre, code').count();
    
    console.log('After JSON input:', {
      treeNodes: hasTreeNodes,
      rawView: hasRawView,
    });
  });
  
  test('Test view mode switching - Homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for view mode buttons
    const treeButton = page.locator('button:has-text("Tree"), button:has-text("tree"), [data-testid*="tree"]').first();
    const rawButton = page.locator('button:has-text("Raw"), button:has-text("raw"), [data-testid*="raw"]').first();
    const flowButton = page.locator('button:has-text("Flow"), button:has-text("flow"), [data-testid*="flow"]').first();
    
    const hasTreeMode = await treeButton.isVisible().catch(() => false);
    const hasRawMode = await rawButton.isVisible().catch(() => false);
    const hasFlowMode = await flowButton.isVisible().catch(() => false);
    
    console.log('View modes available:', {
      tree: hasTreeMode,
      raw: hasRawMode,
      flow: hasFlowMode,
    });
    
    // Try switching to flow mode if available
    if (hasFlowMode) {
      await flowButton.click();
      await page.waitForLoadState('networkidle'); // Wait for flow view rendering
      
      const flowViewRendered = await page.locator('[class*="flow"], [class*="react-flow"]').count();
      console.log('Flow view rendered:', flowViewRendered > 0);
      
      viewerUsageResults.push({
        route: '/ (flow mode)',
        viewerType: 'JsonFlowView',
        componentName: 'JsonFlowView',
        isRendered: flowViewRendered > 0,
      });
    }
  });
  
  test('Generate usage report', async () => {
    console.log('\n=== VIEWER USAGE REPORT ===\n');
    
    const usageByComponent: Record<string, { routes: string[], isUsed: boolean }> = {};
    
    viewerUsageResults.forEach(result => {
      if (!usageByComponent[result.componentName]) {
        usageByComponent[result.componentName] = {
          routes: [],
          isUsed: false,
        };
      }
      
      if (result.isRendered) {
        usageByComponent[result.componentName].routes.push(result.route);
        usageByComponent[result.componentName].isUsed = true;
      }
    });
    
    console.log('Component Usage Summary:');
    Object.entries(usageByComponent).forEach(([component, usage]) => {
      const status = usage.isUsed ? '✅ USED' : '❌ UNUSED';
      const routes = usage.routes.length > 0 ? usage.routes.join(', ') : 'None';
      console.log(`  ${status} ${component}: ${routes}`);
    });
    
    console.log('\nAll viewers to check:');
    console.log('  - UltraJsonViewer');
    console.log('  - SmartJsonViewer');
    console.log('  - SimpleJsonViewer');
    console.log('  - VirtualJsonViewer');
    console.log('  - JsonViewer');
    console.log('  - JsonCompare');
    console.log('  - JsonActionButtons');
    
    // Write results to file
    const fs = require('fs');
    const path = require('path');
    const reportPath = path.join(__dirname, '../test-results/viewer-usage-report.json');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      results: viewerUsageResults,
      summary: usageByComponent,
    }, null, 2));
    
    console.log(`\nReport saved to: ${reportPath}`);
  });
});

