import { test, expect, Page, ConsoleMessage } from '@playwright/test';

// Configuration
const PAGES_TO_TEST = [
  { path: '/', name: 'Home' },
  { path: '/saved', name: 'Library' },
  { path: '/compare', name: 'Compare' },
  { path: '/developers', name: 'Developers' },
];

const VIEWPORT_SIZES = [
  { width: 375, height: 667, name: 'Mobile' },
  { width: 768, height: 1024, name: 'Tablet' },
  { width: 1920, height: 1080, name: 'Desktop' },
];

// Helper to collect all errors
interface ErrorReport {
  page: string;
  viewport: string;
  consoleErrors: Array<{
    type: string;
    text: string;
    location?: string;
  }>;
  pageErrors: Array<{
    message: string;
    stack?: string;
  }>;
  networkErrors: Array<{
    url: string;
    status?: number;
    error?: string;
  }>;
  hydrationErrors: boolean;
  accessibilityIssues: Array<{
    description: string;
    impact: string;
    html: string;
  }>;
  performanceMetrics: {
    loadTime: number;
    domContentLoaded: number;
    firstPaint?: number;
    firstContentfulPaint?: number;
    largestContentfulPaint?: number;
  };
}

test.describe('Comprehensive Application Audit', () => {
  const allErrors: ErrorReport[] = [];

  test.afterAll(async () => {
    // Generate comprehensive report
    console.log('\n=== AUDIT REPORT ===\n');
    
    const errorCount = allErrors.reduce((acc, report) => {
      return acc + 
        report.consoleErrors.length + 
        report.pageErrors.length + 
        report.networkErrors.length + 
        report.accessibilityIssues.length +
        (report.hydrationErrors ? 1 : 0);
    }, 0);
    
    console.log(`Total Errors Found: ${errorCount}`);
    
    if (errorCount > 0) {
      console.log('\nDetailed Errors by Page:\n');
      
      allErrors.forEach(report => {
        if (report.consoleErrors.length + report.pageErrors.length + report.networkErrors.length > 0) {
          console.log(`\n📄 ${report.page} (${report.viewport})`);
          
          if (report.consoleErrors.length > 0) {
            console.log('  Console Errors:');
            report.consoleErrors.forEach(err => {
              console.log(`    - [${err.type}] ${err.text}`);
              if (err.location) console.log(`      at ${err.location}`);
            });
          }
          
          if (report.pageErrors.length > 0) {
            console.log('  Page Errors:');
            report.pageErrors.forEach(err => {
              console.log(`    - ${err.message}`);
            });
          }
          
          if (report.networkErrors.length > 0) {
            console.log('  Network Errors:');
            report.networkErrors.forEach(err => {
              console.log(`    - ${err.url} (${err.status || err.error})`);
            });
          }
          
          if (report.hydrationErrors) {
            console.log('  ⚠️  Hydration Error Detected');
          }
          
          if (report.accessibilityIssues.length > 0) {
            console.log('  Accessibility Issues:');
            report.accessibilityIssues.forEach(issue => {
              console.log(`    - [${issue.impact}] ${issue.description}`);
            });
          }
        }
      });
      
      // Performance summary
      console.log('\n📊 Performance Metrics:\n');
      allErrors.forEach(report => {
        console.log(`${report.page} (${report.viewport}):`);
        console.log(`  Load Time: ${report.performanceMetrics.loadTime}ms`);
        console.log(`  DOM Content Loaded: ${report.performanceMetrics.domContentLoaded}ms`);
        if (report.performanceMetrics.largestContentfulPaint) {
          console.log(`  LCP: ${report.performanceMetrics.largestContentfulPaint}ms`);
        }
      });
    }
  });

  for (const pageConfig of PAGES_TO_TEST) {
    for (const viewport of VIEWPORT_SIZES) {
      test(`Audit ${pageConfig.name} on ${viewport.name}`, async ({ page, browser }) => {
        const report: ErrorReport = {
          page: pageConfig.name,
          viewport: viewport.name,
          consoleErrors: [],
          pageErrors: [],
          networkErrors: [],
          hydrationErrors: false,
          accessibilityIssues: [],
          performanceMetrics: {
            loadTime: 0,
            domContentLoaded: 0,
          },
        };

        // Set viewport
        await page.setViewportSize({ width: viewport.width, height: viewport.height });

        // Collect console errors
        page.on('console', (msg: ConsoleMessage) => {
          if (msg.type() === 'error') {
            const location = msg.location();
            report.consoleErrors.push({
              type: 'error',
              text: msg.text(),
              location: location ? `${location.url}:${location.lineNumber}:${location.columnNumber}` : undefined,
            });
          } else if (msg.type() === 'warning' && msg.text().includes('hydration')) {
            report.hydrationErrors = true;
          }
        });

        // Collect page errors
        page.on('pageerror', (error) => {
          report.pageErrors.push({
            message: error.message,
            stack: error.stack,
          });
        });

        // Collect network errors
        page.on('requestfailed', (request) => {
          report.networkErrors.push({
            url: request.url(),
            error: request.failure()?.errorText,
          });
        });

        page.on('response', (response) => {
          if (response.status() >= 400) {
            report.networkErrors.push({
              url: response.url(),
              status: response.status(),
            });
          }
        });

        // Start performance measurement
        const startTime = Date.now();

        // Navigate to page
        await page.goto(`http://localhost:3456${pageConfig.path}`, {
          waitUntil: 'networkidle',
        });

        // Wait for app to stabilize
        await page.waitForLoadState('networkidle'); // Wait for app initialization

        // Collect performance metrics
        const performanceMetrics = await page.evaluate(() => {
          const perf = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          const paintEntries = performance.getEntriesByType('paint');
          
          return {
            domContentLoaded: perf.domContentLoadedEventEnd - perf.fetchStart,
            loadTime: perf.loadEventEnd - perf.fetchStart,
            firstPaint: paintEntries.find(e => e.name === 'first-paint')?.startTime,
            firstContentfulPaint: paintEntries.find(e => e.name === 'first-contentful-paint')?.startTime,
          };
        });

        report.performanceMetrics = {
          ...performanceMetrics,
          loadTime: Date.now() - startTime,
        };

        // Check for React hydration errors
        const hydrationError = await page.evaluate(() => {
          const errors = Array.from(document.querySelectorAll('body')).some(el => 
            el.textContent?.includes('Hydration failed') || 
            el.textContent?.includes('did not match')
          );
          return errors;
        });
        
        if (hydrationError) {
          report.hydrationErrors = true;
        }

        // Run accessibility audit (basic)
        try {
          const accessibilitySnapshot = await page.accessibility.snapshot();
          
          // Check for missing alt text
          const images = await page.$$eval('img', imgs => 
            imgs.map(img => ({
              src: img.src,
              alt: img.alt,
              hasAlt: !!img.alt
            }))
          );
          
          images.forEach(img => {
            if (!img.hasAlt) {
              report.accessibilityIssues.push({
                description: `Missing alt text for image: ${img.src}`,
                impact: 'moderate',
                html: `<img src="${img.src}">`,
              });
            }
          });

          // Check for missing labels
          const inputs = await page.$$eval('input:not([type="hidden"]), select, textarea', elements => 
            elements.map(el => ({
              id: el.id,
              name: (el as HTMLInputElement).name,
              hasLabel: !!el.labels?.length || !!el.getAttribute('aria-label'),
              type: (el as HTMLInputElement).type,
            }))
          );
          
          inputs.forEach(input => {
            if (!input.hasLabel) {
              report.accessibilityIssues.push({
                description: `Form input missing label: ${input.type || 'input'} (${input.name || input.id})`,
                impact: 'serious',
                html: `<input type="${input.type}">`,
              });
            }
          });

          // Check color contrast (basic check)
          const hasLowContrast = await page.evaluate(() => {
            const elements = document.querySelectorAll('*');
            let lowContrastFound = false;
            
            elements.forEach(el => {
              const style = window.getComputedStyle(el);
              const color = style.color;
              const bgColor = style.backgroundColor;
              
              // Very basic check - in production, use a proper contrast calculation
              if (color === bgColor && color !== 'rgba(0, 0, 0, 0)') {
                lowContrastFound = true;
              }
            });
            
            return lowContrastFound;
          });
          
          if (hasLowContrast) {
            report.accessibilityIssues.push({
              description: 'Potential color contrast issues detected',
              impact: 'moderate',
              html: 'Various elements',
            });
          }
        } catch (error) {
          console.log('Accessibility audit failed:', error);
        }

        // Test critical user interactions
        if (pageConfig.path === '/') {
          // Test JSON editor
          const editor = await page.locator('[data-testid="json-textarea"], .monaco-editor').first();
          if (await editor.isVisible()) {
            // Try to interact with the editor
            await editor.click().catch(() => {});
            
            // Check if format button works
            const formatButton = page.locator('button:has-text("Format")').first();
            if (await formatButton.isVisible()) {
              await formatButton.click().catch(() => {});
            }
          }
          
          // Test view mode tabs
          const tabs = ['Flow', 'Tree', 'List'];
          for (const tab of tabs) {
            const tabButton = page.locator(`[data-testid="${tab.toLowerCase()}-view"], button:has-text("${tab}")`).first();
            if (await tabButton.isVisible()) {
              await tabButton.click().catch(() => {});
              await page.waitForLoadState('networkidle'); // Wait for view mode switch
            }
          }
        }

        // Check for broken links
        const links = await page.$$eval('a[href]', anchors => 
          anchors.map(a => ({
            href: a.href,
            text: a.textContent,
          }))
        );
        
        for (const link of links) {
          if (link.href.startsWith('http://localhost:3456')) {
            const response = await page.request.head(link.href).catch(() => null);
            if (!response || response.status() >= 400) {
              report.networkErrors.push({
                url: link.href,
                status: response?.status(),
                error: `Broken link: ${link.text}`,
              });
            }
          }
        }

        // Save report
        allErrors.push(report);

        // Assert no critical errors
        expect(report.pageErrors.length).toBe(0);
        expect(report.hydrationErrors).toBe(false);
        
        // Warn about console errors but don't fail
        if (report.consoleErrors.length > 0) {
          console.warn(`Console errors found on ${pageConfig.name} (${viewport.name}):`, report.consoleErrors);
        }
      });
    }
  }

  test('Check for memory leaks', async ({ page }) => {
    await page.goto('http://localhost:3456');
    
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });

    // Perform actions that might cause leaks
    for (let i = 0; i < 5; i++) {
      // Navigate between pages
      await page.goto('http://localhost:3456/saved');
      await page.goto('http://localhost:3456/compare');
      await page.goto('http://localhost:3456');
      
      // Trigger modals
      const shareButton = page.locator('button:has-text("Share")').first();
      if (await shareButton.isVisible()) {
        await shareButton.click();
        await page.keyboard.press('Escape');
      }
    }

    // Force garbage collection
    await page.evaluate(() => {
      if (global.gc) {
        global.gc();
      }
    });

    // Get final memory usage
    const finalMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });

    // Check if memory increased significantly (more than 50MB)
    const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024;
    console.log(`Memory increase: ${memoryIncrease.toFixed(2)}MB`);
    
    if (memoryIncrease > 50) {
      console.warn(`Potential memory leak detected: ${memoryIncrease.toFixed(2)}MB increase`);
    }
  });

  test('Security headers check', async ({ page }) => {
    const response = await page.goto('http://localhost:3456');
    const headers = response?.headers() || {};
    
    const securityHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'referrer-policy',
    ];
    
    const missingHeaders: string[] = [];
    
    securityHeaders.forEach(header => {
      if (!headers[header]) {
        missingHeaders.push(header);
      }
    });
    
    if (missingHeaders.length > 0) {
      console.warn('Missing security headers:', missingHeaders);
    }
    
    expect(missingHeaders.length).toBe(0);
  });
});