#!/usr/bin/env node

/**
 * Precompile Main Pages Script
 *
 * This script triggers compilation of main pages in dev mode by making HTTP requests.
 * It waits for the dev server to be ready, then visits each main page to trigger compilation.
 */

const http = require('http');

// Increase max listeners to avoid warnings when making multiple HTTP requests
process.setMaxListeners(20);

const PORT = 3456;
const HOST = 'localhost';
const MAX_RETRIES = 30; // 30 seconds max wait
const RETRY_DELAY = 1000; // 1 second between retries

// Main pages to precompile
const MAIN_PAGES = [
  '/',
  '/edit',
  '/view',
  '/library',
  '/private',
  '/save',
  '/format',
  '/compare',
  '/convert',
  '/profile',
  '/developers',
];

/**
 * Check if server is ready
 */
function checkServer() {
  return new Promise((resolve) => {
    const req = http.get(`http://${HOST}:${PORT}/api/health`, (res) => {
      resolve(res.statusCode === 200);
    });

    req.on('error', () => {
      resolve(false);
    });

    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

/**
 * Wait for server to be ready
 */
async function waitForServer() {
  console.log('⏳ Waiting for dev server to be ready...');

  for (let i = 0; i < MAX_RETRIES; i++) {
    const isReady = await checkServer();
    if (isReady) {
      console.log('✓ Dev server is ready\n');
      return true;
    }

    process.stdout.write('.');
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
  }

  console.log('\n❌ Dev server did not become ready in time');
  return false;
}

/**
 * Precompile a single page
 */
function precompilePage(path) {
  return new Promise((resolve) => {
    const startTime = Date.now();

    const req = http.get(`http://${HOST}:${PORT}${path}`, (res) => {
      const duration = Date.now() - startTime;

      if (res.statusCode === 200 || res.statusCode === 304) {
        console.log(`  ✓ ${path.padEnd(20)} (${duration}ms)`);
        resolve(true);
      } else {
        console.log(`  ⚠ ${path.padEnd(20)} (${res.statusCode})`);
        resolve(false);
      }

      // Drain response to free up connection
      res.resume();
    });

    req.on('error', (err) => {
      console.log(`  ✗ ${path.padEnd(20)} (${err.message})`);
      resolve(false);
    });

    req.setTimeout(30000, () => {
      req.destroy();
      console.log(`  ✗ ${path.padEnd(20)} (timeout)`);
      resolve(false);
    });
  });
}

/**
 * Precompile all main pages
 */
async function precompilePages() {
  console.log('⚡ Precompiling main pages...\n');

  const results = [];

  for (const page of MAIN_PAGES) {
    const success = await precompilePage(page);
    results.push({ page, success });
  }

  const successCount = results.filter((r) => r.success).length;
  const totalCount = results.length;

  console.log(`\n✓ Precompiled ${successCount}/${totalCount} pages`);

  if (successCount < totalCount) {
    console.log('⚠ Some pages failed to compile - check the output above');
  }
}

/**
 * Main function
 */
async function main() {
  const isReady = await waitForServer();

  if (!isReady) {
    process.exit(1);
  }

  await precompilePages();

  console.log('\n🎉 Dev server is ready at http://localhost:3456\n');
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
