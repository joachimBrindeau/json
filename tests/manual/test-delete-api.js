#!/usr/bin/env node

/**
 * Test script for DELETE API endpoint
 * Tests the /api/json/[id] DELETE functionality locally
 */

// Use built-in fetch (Node 18+) or import
const fetch = globalThis.fetch || require('node-fetch');

const BASE_URL = 'http://localhost:3456';

async function testDeleteAPI() {
  console.log('🧪 Testing DELETE API functionality...\n');

  try {
    // Step 1: Create a test document first
    console.log('📝 Step 1: Creating test document...');
    
    const testData = {
      title: 'Test Document for DELETE',
      content: JSON.stringify({
        test: true,
        message: 'This is a test document for DELETE functionality',
        timestamp: new Date().toISOString(),
        data: [1, 2, 3, 4, 5]
      }, null, 2)
    };

    const createResponse = await fetch(`${BASE_URL}/api/json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    if (!createResponse.ok) {
      console.error('❌ Failed to create test document:', createResponse.status, createResponse.statusText);
      const errorText = await createResponse.text();
      console.error('Error details:', errorText);
      return;
    }

    const createResult = await createResponse.json();
    console.log('✅ Test document created:', createResult.shareId);
    
    const documentId = createResult.shareId;

    // Step 2: Verify document exists
    console.log('\n🔍 Step 2: Verifying document exists...');
    
    const getResponse = await fetch(`${BASE_URL}/api/json/${documentId}`);
    
    if (getResponse.ok) {
      console.log('✅ Document exists and is accessible');
    } else {
      console.log('⚠️  Document not accessible (might be private)');
    }

    // Step 3: Test DELETE without authentication (should fail)
    console.log('\n🚫 Step 3: Testing DELETE without authentication...');
    
    const deleteResponse1 = await fetch(`${BASE_URL}/api/json/${documentId}`, {
      method: 'DELETE'
    });

    console.log('DELETE response status:', deleteResponse1.status);
    console.log('DELETE response headers:', Object.fromEntries(deleteResponse1.headers.entries()));
    
    if (deleteResponse1.status === 401) {
      console.log('✅ Correctly rejected - authentication required');
    } else if (deleteResponse1.status === 502) {
      console.log('❌ 502 Bad Gateway - server error detected!');
      const errorText = await deleteResponse1.text();
      console.log('Error response:', errorText);
    } else {
      console.log('⚠️  Unexpected response:', deleteResponse1.status);
      const responseText = await deleteResponse1.text();
      console.log('Response:', responseText);
    }

    // Step 4: Test with mock authentication headers
    console.log('\n🔐 Step 4: Testing DELETE with mock auth headers...');
    
    const deleteResponse2 = await fetch(`${BASE_URL}/api/json/${documentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer mock-token',
        'Cookie': 'next-auth.session-token=mock-session'
      }
    });

    console.log('DELETE with auth response status:', deleteResponse2.status);
    
    if (deleteResponse2.status === 502) {
      console.log('❌ 502 Bad Gateway - server error still present!');
      const errorText = await deleteResponse2.text();
      console.log('Error response:', errorText);
    } else {
      console.log('✅ No 502 error - server responding properly');
      const responseText = await deleteResponse2.text();
      console.log('Response:', responseText);
    }

    // Step 5: Test health endpoint
    console.log('\n❤️  Step 5: Testing health endpoint...');
    
    const healthResponse = await fetch(`${BASE_URL}/api/health`);
    console.log('Health status:', healthResponse.status);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('Health data:', healthData);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testDeleteAPI().then(() => {
  console.log('\n🏁 DELETE API test completed');
}).catch(error => {
  console.error('💥 Test script failed:', error);
  process.exit(1);
});
