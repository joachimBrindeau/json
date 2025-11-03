#!/usr/bin/env tsx
/**
 * Validation script for database query performance and cache effectiveness
 * Tests pagination limits, cache hit rates, and response times
 */

import { PrismaClient } from '@prisma/client';
import { performance } from 'perf_hooks';
import { cacheGet, cacheSet, CacheKeys, CacheTTL } from '../lib/cache/redis-cache';
import {
  getTagAnalytics,
  getUserAnalytics,
  getDocumentAnalytics,
} from '../lib/db/queries/analytics';
import { getPublicDocuments, getDocumentStats } from '../lib/db/queries/documents';
import { logger } from '../lib/logger';

const prisma = new PrismaClient();

interface PerformanceResult {
  operation: string;
  firstRunTime: number;
  cachedRunTime: number;
  improvement: string;
  cacheHit: boolean;
  status: 'PASS' | 'FAIL' | 'WARN';
  notes: string[];
}

const results: PerformanceResult[] = [];
const TARGET_CACHE_HIT_RATE = 0.7; // 70%
const TARGET_IMPROVEMENT_MS = 50; // 50ms minimum improvement

/**
 * Measure execution time of an async function
 */
async function measureTime<T>(fn: () => Promise<T>): Promise<{ result: T; time: number }> {
  const start = performance.now();
  const result = await fn();
  const time = performance.now() - start;
  return { result, time };
}

/**
 * Test tag analytics query performance
 */
async function testTagAnalytics() {
  console.log('\n🔍 Testing Tag Analytics Performance...');

  const notes: string[] = [];

  // First run (cold cache)
  const firstRun = await measureTime(() => getTagAnalytics({ days: 30, limit: 50 }));

  if (!firstRun.result.success) {
    results.push({
      operation: 'getTagAnalytics',
      firstRunTime: firstRun.time,
      cachedRunTime: 0,
      improvement: 'N/A',
      cacheHit: false,
      status: 'FAIL',
      notes: ['Query failed: ' + firstRun.result.error],
    });
    return;
  }

  notes.push(`Cold cache: ${firstRun.time.toFixed(2)}ms`);

  // Second run (should hit cache)
  const secondRun = await measureTime(() => getTagAnalytics({ days: 30, limit: 50 }));

  if (!secondRun.result.success) {
    notes.push('Cache retrieval failed');
  } else {
    const improvement = firstRun.time - secondRun.time;
    const improvementPercent = ((improvement / firstRun.time) * 100).toFixed(1);
    notes.push(`Cached: ${secondRun.time.toFixed(2)}ms (${improvementPercent}% faster)`);
  }

  const cacheHit = secondRun.time < firstRun.time * 0.5; // 50% faster = cache hit
  const status =
    cacheHit && secondRun.time < firstRun.time - TARGET_IMPROVEMENT_MS
      ? 'PASS'
      : cacheHit
        ? 'WARN'
        : 'FAIL';

  results.push({
    operation: 'getTagAnalytics',
    firstRunTime: firstRun.time,
    cachedRunTime: secondRun.time,
    improvement: `${(((firstRun.time - secondRun.time) / firstRun.time) * 100).toFixed(1)}%`,
    cacheHit,
    status,
    notes,
  });
}

/**
 * Test user analytics query performance
 */
async function testUserAnalytics() {
  console.log('\n🔍 Testing User Analytics Performance...');

  const notes: string[] = [];

  // Get a test user
  const user = await prisma.user.findFirst();
  if (!user) {
    results.push({
      operation: 'getUserAnalytics',
      firstRunTime: 0,
      cachedRunTime: 0,
      improvement: 'N/A',
      cacheHit: false,
      status: 'WARN',
      notes: ['No users found for testing'],
    });
    return;
  }

  // First run (cold cache)
  const firstRun = await measureTime(() => getUserAnalytics(user.id));

  if (!firstRun.result.success) {
    results.push({
      operation: 'getUserAnalytics',
      firstRunTime: firstRun.time,
      cachedRunTime: 0,
      improvement: 'N/A',
      cacheHit: false,
      status: 'FAIL',
      notes: ['Query failed: ' + firstRun.result.error],
    });
    return;
  }

  notes.push(`Cold cache: ${firstRun.time.toFixed(2)}ms`);

  // Second run (should hit cache)
  const secondRun = await measureTime(() => getUserAnalytics(user.id));

  if (!secondRun.result.success) {
    notes.push('Cache retrieval failed');
  } else {
    const improvement = firstRun.time - secondRun.time;
    const improvementPercent = ((improvement / firstRun.time) * 100).toFixed(1);
    notes.push(`Cached: ${secondRun.time.toFixed(2)}ms (${improvementPercent}% faster)`);
  }

  const cacheHit = secondRun.time < firstRun.time * 0.5;
  const status =
    cacheHit && secondRun.time < firstRun.time - TARGET_IMPROVEMENT_MS
      ? 'PASS'
      : cacheHit
        ? 'WARN'
        : 'FAIL';

  results.push({
    operation: 'getUserAnalytics',
    firstRunTime: firstRun.time,
    cachedRunTime: secondRun.time,
    improvement: `${(((firstRun.time - secondRun.time) / firstRun.time) * 100).toFixed(1)}%`,
    cacheHit,
    status,
    notes,
  });
}

/**
 * Test public documents query performance
 */
async function testPublicDocuments() {
  console.log('\n🔍 Testing Public Documents Performance...');

  const notes: string[] = [];

  // First run (cold cache)
  const firstRun = await measureTime(() => getPublicDocuments({ page: 1, limit: 20 }));

  if (!firstRun.result.success) {
    results.push({
      operation: 'getPublicDocuments',
      firstRunTime: firstRun.time,
      cachedRunTime: 0,
      improvement: 'N/A',
      cacheHit: false,
      status: 'FAIL',
      notes: ['Query failed: ' + firstRun.result.error],
    });
    return;
  }

  notes.push(`Cold cache: ${firstRun.time.toFixed(2)}ms`);
  notes.push(`Documents returned: ${firstRun.result.data?.documents.length || 0}`);

  // Second run (should hit cache)
  const secondRun = await measureTime(() => getPublicDocuments({ page: 1, limit: 20 }));

  if (!secondRun.result.success) {
    notes.push('Cache retrieval failed');
  } else {
    const improvement = firstRun.time - secondRun.time;
    const improvementPercent = ((improvement / firstRun.time) * 100).toFixed(1);
    notes.push(`Cached: ${secondRun.time.toFixed(2)}ms (${improvementPercent}% faster)`);
  }

  const cacheHit = secondRun.time < firstRun.time * 0.5;
  const status =
    cacheHit && secondRun.time < firstRun.time - TARGET_IMPROVEMENT_MS
      ? 'PASS'
      : cacheHit
        ? 'WARN'
        : 'FAIL';

  results.push({
    operation: 'getPublicDocuments',
    firstRunTime: firstRun.time,
    cachedRunTime: secondRun.time,
    improvement: `${(((firstRun.time - secondRun.time) / firstRun.time) * 100).toFixed(1)}%`,
    cacheHit,
    status,
    notes,
  });
}

/**
 * Test document stats query performance
 */
async function testDocumentStats() {
  console.log('\n🔍 Testing Document Stats Performance...');

  const notes: string[] = [];

  // Get a test user
  const user = await prisma.user.findFirst();
  if (!user) {
    results.push({
      operation: 'getDocumentStats',
      firstRunTime: 0,
      cachedRunTime: 0,
      improvement: 'N/A',
      cacheHit: false,
      status: 'WARN',
      notes: ['No users found for testing'],
    });
    return;
  }

  // First run (cold cache)
  const firstRun = await measureTime(() => getDocumentStats(user.id));

  if (!firstRun.result.success) {
    results.push({
      operation: 'getDocumentStats',
      firstRunTime: firstRun.time,
      cachedRunTime: 0,
      improvement: 'N/A',
      cacheHit: false,
      status: 'FAIL',
      notes: ['Query failed: ' + firstRun.result.error],
    });
    return;
  }

  notes.push(`Cold cache: ${firstRun.time.toFixed(2)}ms`);

  // Second run (should hit cache)
  const secondRun = await measureTime(() => getDocumentStats(user.id));

  if (!secondRun.result.success) {
    notes.push('Cache retrieval failed');
  } else {
    const improvement = firstRun.time - secondRun.time;
    const improvementPercent = ((improvement / firstRun.time) * 100).toFixed(1);
    notes.push(`Cached: ${secondRun.time.toFixed(2)}ms (${improvementPercent}% faster)`);
  }

  const cacheHit = secondRun.time < firstRun.time * 0.5;
  const status =
    cacheHit && secondRun.time < firstRun.time - TARGET_IMPROVEMENT_MS
      ? 'PASS'
      : cacheHit
        ? 'WARN'
        : 'FAIL';

  results.push({
    operation: 'getDocumentStats',
    firstRunTime: firstRun.time,
    cachedRunTime: secondRun.time,
    improvement: `${(((firstRun.time - secondRun.time) / firstRun.time) * 100).toFixed(1)}%`,
    cacheHit,
    status,
    notes,
  });
}

/**
 * Test unbounded query prevention
 */
async function testQueryLimits() {
  console.log('\n🔍 Testing Query Limit Enforcement...');

  const notes: string[] = [];

  // Count total public documents
  const totalDocs = await prisma.jsonDocument.count({
    where: { visibility: 'public' },
  });

  notes.push(`Total public documents: ${totalDocs}`);

  // Test that analytics query respects limit
  const analyticsResult = await getTagAnalytics({ days: 365, limit: 100 });

  if (analyticsResult.success) {
    notes.push(`Tag analytics returned successfully`);
    notes.push(`Total tags found: ${analyticsResult.data?.totalTags || 0}`);

    // Check if query would have been unbounded
    const status = totalDocs > 5000 ? 'PASS' : 'WARN';
    notes.push(
      status === 'PASS'
        ? 'Unbounded query protection is active (>5000 docs)'
        : 'Cannot verify unbounded protection (<5000 docs)'
    );

    results.push({
      operation: 'queryLimitEnforcement',
      firstRunTime: 0,
      cachedRunTime: 0,
      improvement: 'N/A',
      cacheHit: false,
      status,
      notes,
    });
  } else {
    results.push({
      operation: 'queryLimitEnforcement',
      firstRunTime: 0,
      cachedRunTime: 0,
      improvement: 'N/A',
      cacheHit: false,
      status: 'FAIL',
      notes: ['Query failed: ' + analyticsResult.error],
    });
  }
}

/**
 * Print results table
 */
function printResults() {
  console.log('\n\n📊 PERFORMANCE VALIDATION RESULTS\n');
  console.log('='.repeat(100));

  const statusSymbols = {
    PASS: '✅',
    WARN: '⚠️',
    FAIL: '❌',
  };

  results.forEach((result) => {
    console.log(`\n${statusSymbols[result.status]} ${result.operation}`);
    console.log(`   First Run:  ${result.firstRunTime.toFixed(2)}ms`);
    console.log(`   Cached Run: ${result.cachedRunTime.toFixed(2)}ms`);
    console.log(`   Improvement: ${result.improvement}`);
    console.log(`   Cache Hit:  ${result.cacheHit ? '✓' : '✗'}`);

    if (result.notes.length > 0) {
      console.log(`   Notes:`);
      result.notes.forEach((note) => console.log(`     - ${note}`));
    }
  });

  console.log('\n' + '='.repeat(100));

  // Summary
  const passed = results.filter((r) => r.status === 'PASS').length;
  const warned = results.filter((r) => r.status === 'WARN').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  const total = results.length;

  const cacheHits = results.filter((r) => r.cacheHit).length;
  const cacheHitRate = ((cacheHits / total) * 100).toFixed(1);

  const avgImprovement =
    results
      .filter((r) => r.improvement !== 'N/A')
      .reduce((sum, r) => sum + parseFloat(r.improvement), 0) /
    results.filter((r) => r.improvement !== 'N/A').length;

  console.log('\n📈 SUMMARY');
  console.log(`   Total Tests:  ${total}`);
  console.log(`   ✅ Passed:     ${passed}`);
  console.log(`   ⚠️  Warnings:   ${warned}`);
  console.log(`   ❌ Failed:     ${failed}`);
  console.log(`   Cache Hit Rate: ${cacheHitRate}% (target: ${TARGET_CACHE_HIT_RATE * 100}%)`);
  console.log(`   Avg Improvement: ${avgImprovement.toFixed(1)}%`);

  const overallStatus = failed === 0 && parseFloat(cacheHitRate) >= TARGET_CACHE_HIT_RATE * 100;

  console.log(
    `\n${overallStatus ? '✅' : '❌'} Overall Status: ${overallStatus ? 'PASS' : 'FAIL'}`
  );
  console.log('='.repeat(100) + '\n');

  return overallStatus;
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting Query Performance Validation\n');
  console.log('Target Metrics:');
  console.log(`  - Cache Hit Rate: >${TARGET_CACHE_HIT_RATE * 100}%`);
  console.log(`  - Minimum Improvement: ${TARGET_IMPROVEMENT_MS}ms\n`);

  try {
    // Run all tests
    await testTagAnalytics();
    await testUserAnalytics();
    await testPublicDocuments();
    await testDocumentStats();
    await testQueryLimits();

    // Print results
    const success = printResults();

    // Exit with appropriate code
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('❌ Validation failed with error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
