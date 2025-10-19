/**
 * Test cases for JSON Path conversion utility
 * This file contains test cases to verify the convertToJsonPath function
 * handles various edge cases correctly.
 */

// Import the function from the modal component
// In a real implementation, you would extract this to a separate utility file
const convertToJsonPath = (path: string): string => {
  if (!path || path === 'root') {
    return '$';
  }

  // Remove 'root' prefix and replace with '$' (preserve the dot if present)
  let jsonPath = path.replace(/^root/, '$');

  // Handle trailing dot edge case early
  if (jsonPath === '$.') {
    return '$.';
  }

  // If the path doesn't start with '$', add it
  if (!jsonPath.startsWith('$')) {
    jsonPath = '$.' + jsonPath;
  }
  
  // Convert array indices from dot notation to bracket notation
  // e.g., $.users.0.name -> $.users[0].name
  jsonPath = jsonPath.replace(/\.(\d+)(?=\.|$)/g, '[$1]');
  
  // Handle properties that already have bracket notation
  // Ensure they're properly formatted
  jsonPath = jsonPath.replace(/\['([^']+)'\]/g, "['$1']");
  jsonPath = jsonPath.replace(/\["([^"]+)"\]/g, '["$1"]');
  
  // Handle special characters in property names
  // Properties with special characters should use bracket notation
  const parts = jsonPath.split(/(\[[^\]]+\]|\$)/);
  const processedParts = parts.map((part, index) => {
    // Skip $ and already bracketed parts
    if (part === '$' || part.startsWith('[') || part === '') {
      return part;
    }
    
    // Process dot-separated properties
    const properties = part.split('.');
    const processedProps = properties.map(prop => {
      if (prop === '') return '';
      
      // Check if property needs bracket notation
      // Properties need brackets if they contain special characters or start with a number
      const needsBrackets = /[^a-zA-Z0-9_]/.test(prop) || /^\d/.test(prop);
      
      if (needsBrackets && !prop.startsWith('[')) {
        return `['${prop}']`;
      }
      
      // For normal properties, ensure they have a dot prefix if needed
      if (index > 0 && parts[index - 1] !== '$' && !parts[index - 1].endsWith(']')) {
        return '.' + prop;
      }
      
      return prop.startsWith('.') ? prop : '.' + prop;
    });
    
    return processedProps.join('');
  });
  
  // Clean up the result
  jsonPath = processedParts.join('');
  
  // Remove any double dots
  jsonPath = jsonPath.replace(/\.{2,}/g, '.');
  
  // Ensure proper formatting
  jsonPath = jsonPath.replace(/\$\./, '$.');
  
  // Handle edge case where path starts with $. but should be $[
  jsonPath = jsonPath.replace(/\$\.\[/, '$[');
  
  return jsonPath;
};

// Test cases
const testCases = [
  // Basic cases
  { input: 'root', expected: '$', description: 'Root element' },
  { input: 'root.name', expected: '$.name', description: 'Simple property' },
  { input: 'root.user.profile', expected: '$.user.profile', description: 'Nested properties' },
  
  // Array indices
  { input: 'root.users.0', expected: '$.users[0]', description: 'Array index at end' },
  { input: 'root.users.0.name', expected: '$.users[0].name', description: 'Property after array index' },
  { input: 'root.data.0.items.1.value', expected: '$.data[0].items[1].value', description: 'Multiple array indices' },
  
  // Special characters
  { input: 'root.special-key', expected: "$['special-key']", description: 'Property with hyphen' },
  { input: 'root.special key', expected: "$['special key']", description: 'Property with space' },
  { input: 'root.special@key', expected: "$['special@key']", description: 'Property with special character' },
  { input: 'root.123key', expected: "$['123key']", description: 'Property starting with number' },
  
  // Complex nested cases
  { input: 'root.data.special-key.0.nested', expected: "$.data['special-key'][0].nested", description: 'Mixed special and array' },
  { input: "root['already-bracketed']", expected: "$['already-bracketed']", description: 'Already has brackets' },
  { input: 'root["double-quoted"]', expected: '$["double-quoted"]', description: 'Double quoted brackets' },
  
  // Edge cases
  { input: '', expected: '$', description: 'Empty string' },
  { input: 'root.', expected: '$.', description: 'Trailing dot' },
  { input: 'root.a.b.c.d.e.f.g', expected: '$.a.b.c.d.e.f.g', description: 'Deep nesting' },
  { input: 'root.array.0.1.2.3', expected: '$.array[0][1][2][3]', description: 'Multiple consecutive indices' },
  
  // Mixed cases
  { input: 'root.user-data.items.0.sub-items.1.value', expected: "$['user-data'].items[0]['sub-items'][1].value", description: 'Complex mixed path' },
  { input: 'root.data.user.profile-info.address.zip-code', expected: "$.data.user['profile-info'].address['zip-code']", description: 'Multiple special properties' },
];

// Run tests
console.log('JSON Path Conversion Test Results\n' + '='.repeat(50));

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  const result = convertToJsonPath(testCase.input);
  const isPass = result === testCase.expected;
  
  if (isPass) {
    passed++;
    console.log(`✅ Test ${index + 1}: ${testCase.description}`);
    console.log(`   Input:    "${testCase.input}"`);
    console.log(`   Expected: "${testCase.expected}"`);
    console.log(`   Result:   "${result}"\n`);
  } else {
    failed++;
    console.log(`❌ Test ${index + 1}: ${testCase.description}`);
    console.log(`   Input:    "${testCase.input}"`);
    console.log(`   Expected: "${testCase.expected}"`);
    console.log(`   Result:   "${result}"`);
    console.log(`   FAILED!\n`);
  }
});

console.log('='.repeat(50));
console.log(`Summary: ${passed} passed, ${failed} failed out of ${testCases.length} tests`);

if (failed === 0) {
  console.log('🎉 All tests passed!');
} else {
  console.log('⚠️ Some tests failed. Please review the implementation.');
}

export { convertToJsonPath };