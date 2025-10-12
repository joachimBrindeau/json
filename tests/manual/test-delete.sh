#!/bin/bash

# Test DELETE API functionality
echo "🧪 Testing DELETE API functionality..."
echo "======================================"

BASE_URL="http://localhost:3456"

# Step 1: Create a test document
echo ""
echo "📝 Step 1: Creating test document..."

CREATE_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Document for DELETE",
    "content": "{\"test\": true, \"message\": \"DELETE test\", \"timestamp\": \"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'\"}"
  }' \
  "$BASE_URL/api/json")

HTTP_STATUS=$(echo "$CREATE_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
RESPONSE_BODY=$(echo "$CREATE_RESPONSE" | sed '/HTTP_STATUS:/d')

echo "Create response status: $HTTP_STATUS"

if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "201" ]; then
    echo "✅ Document created successfully"
    DOCUMENT_ID=$(echo "$RESPONSE_BODY" | grep -o '"shareId":"[^"]*"' | cut -d'"' -f4)
    echo "Document ID: $DOCUMENT_ID"
else
    echo "❌ Failed to create document"
    echo "Response: $RESPONSE_BODY"
    exit 1
fi

# Step 2: Test DELETE without authentication
echo ""
echo "🚫 Step 2: Testing DELETE without authentication..."

DELETE_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X DELETE \
  "$BASE_URL/api/json/$DOCUMENT_ID")

DELETE_STATUS=$(echo "$DELETE_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
DELETE_BODY=$(echo "$DELETE_RESPONSE" | sed '/HTTP_STATUS:/d')

echo "DELETE response status: $DELETE_STATUS"
echo "DELETE response body: $DELETE_BODY"

if [ "$DELETE_STATUS" = "502" ]; then
    echo "❌ 502 Bad Gateway detected - server error!"
    echo "This confirms the DELETE endpoint has issues"
elif [ "$DELETE_STATUS" = "401" ]; then
    echo "✅ 401 Unauthorized - correct behavior (auth required)"
elif [ "$DELETE_STATUS" = "404" ]; then
    echo "⚠️  404 Not Found - document might not exist"
else
    echo "⚠️  Unexpected status: $DELETE_STATUS"
fi

# Step 3: Test health endpoint
echo ""
echo "❤️  Step 3: Testing health endpoint..."

HEALTH_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  "$BASE_URL/api/health")

HEALTH_STATUS=$(echo "$HEALTH_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
HEALTH_BODY=$(echo "$HEALTH_RESPONSE" | sed '/HTTP_STATUS:/d')

echo "Health status: $HEALTH_STATUS"
echo "Health response: $HEALTH_BODY"

# Step 4: Test with different document ID formats
echo ""
echo "🔍 Step 4: Testing DELETE with different ID formats..."

# Test with a fake UUID
FAKE_UUID="12345678-1234-1234-1234-123456789012"
echo "Testing with fake UUID: $FAKE_UUID"

FAKE_DELETE_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X DELETE \
  "$BASE_URL/api/json/$FAKE_UUID")

FAKE_DELETE_STATUS=$(echo "$FAKE_DELETE_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
echo "Fake UUID DELETE status: $FAKE_DELETE_STATUS"

if [ "$FAKE_DELETE_STATUS" = "502" ]; then
    echo "❌ 502 error even with fake UUID - confirms server issue"
else
    echo "✅ No 502 with fake UUID - issue might be ID-specific"
fi

echo ""
echo "🏁 DELETE API test completed"
echo "Summary:"
echo "- Document creation: $HTTP_STATUS"
echo "- DELETE request: $DELETE_STATUS"
echo "- Health check: $HEALTH_STATUS"
echo "- Fake UUID DELETE: $FAKE_DELETE_STATUS"
