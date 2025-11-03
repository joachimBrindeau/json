/**
 * Verification script for faker determinism
 * Run this to verify that faker generates the same data with the same seed
 */

import { faker, initializeFaker, TEST_SEED } from './faker-config.js';

console.log('🎲 Testing Faker Determinism with seed:', TEST_SEED);

// Initialize faker with test seed
initializeFaker(TEST_SEED);

// Generate test data - first run
const run1 = {
  productName: faker.commerce.productName(),
  uuid: faker.string.uuid(),
  email: faker.internet.email(),
  fullName: faker.person.fullName(),
  price: faker.commerce.price(),
  department: faker.commerce.department(),
  date: faker.date.recent().toISOString(),
  semver: faker.system.semver(),
};

console.log('\n📊 First Run:', run1);

// Re-initialize with same seed
initializeFaker(TEST_SEED);

// Generate test data - second run
const run2 = {
  productName: faker.commerce.productName(),
  uuid: faker.string.uuid(),
  email: faker.internet.email(),
  fullName: faker.person.fullName(),
  price: faker.commerce.price(),
  department: faker.commerce.department(),
  date: faker.date.recent().toISOString(),
  semver: faker.system.semver(),
};

console.log('📊 Second Run:', run2);

// Verify determinism
const isDeterministic = JSON.stringify(run1) === JSON.stringify(run2);

console.log('\n✅ Deterministic:', isDeterministic);
console.log('\nExpected values with seed 12345:');
console.log('  Product:', run1.productName);
console.log('  UUID:', run1.uuid);
console.log('  Email:', run1.email);
console.log('  Name:', run1.fullName);

if (!isDeterministic) {
  console.error('❌ FAILED: Faker is not deterministic!');
  process.exit(1);
}

console.log('\n✅ SUCCESS: Faker generates consistent data across runs');
