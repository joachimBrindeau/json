#!/bin/bash

# Verification script for features folder cleanup
# Tests that all critical components are still accessible

echo "=== FEATURES FOLDER CLEANUP VERIFICATION ==="
echo ""
echo "Testing server at http://localhost:3456"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to test endpoint
test_endpoint() {
  local name=$1
  local url=$2
  local expected=$3
  
  echo -n "Testing $name... "
  
  response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
  
  if [ "$response" = "$expected" ]; then
    echo -e "${GREEN}✓ PASS${NC} (HTTP $response)"
    ((PASSED++))
  else
    echo -e "${RED}✗ FAIL${NC} (Expected $expected, got $response)"
    ((FAILED++))
  fi
}

# Function to test component in HTML
test_component() {
  local name=$1
  local url=$2
  local search=$3
  
  echo -n "Testing $name... "
  
  response=$(curl -s "$url" 2>/dev/null | grep -c "$search")
  
  if [ "$response" -gt 0 ]; then
    echo -e "${GREEN}✓ PASS${NC} (Found in HTML)"
    ((PASSED++))
  else
    echo -e "${RED}✗ FAIL${NC} (Not found in HTML)"
    ((FAILED++))
  fi
}

echo "## 1. Testing Core Routes"
echo ""

test_endpoint "Homepage" "http://localhost:3456/" "200"
test_endpoint "Editor" "http://localhost:3456/edit" "200"
test_endpoint "Compare" "http://localhost:3456/compare" "200"
test_endpoint "Format" "http://localhost:3456/format" "200"
test_endpoint "Library" "http://localhost:3456/library" "200"

echo ""
echo "## 2. Testing Component Presence"
echo ""

test_component "UltraJsonViewer on homepage" "http://localhost:3456/" "JSON Viewer"
test_component "Navigation menu" "http://localhost:3456/" "nav-viewer"
test_component "Editor page" "http://localhost:3456/edit" "Editor"
test_component "Compare page" "http://localhost:3456/compare" "Compare"

echo ""
echo "## 3. Testing Static Assets"
echo ""

test_endpoint "Favicon" "http://localhost:3456/favicon.ico" "200"
test_endpoint "Manifest" "http://localhost:3456/manifest.json" "200"
test_endpoint "Monaco preload" "http://localhost:3456/monaco-preload.js" "200"

echo ""
echo "## 4. Testing API Health"
echo ""

test_endpoint "Health check" "http://localhost:3456/api/health" "200"

echo ""
echo "=== SUMMARY ==="
echo ""
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ All tests passed! Cleanup is safe.${NC}"
  exit 0
else
  echo -e "${RED}✗ Some tests failed. Review the output above.${NC}"
  exit 1
fi

