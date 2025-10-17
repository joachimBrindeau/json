#!/bin/bash

# Deployment Verification Script
# Checks health endpoint and critical pages after deployment
# Usage: ./scripts/verify-deployment.sh [URL]
# Example: ./scripts/verify-deployment.sh https://json-viewer.io

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default to localhost if no URL provided
URL="${1:-http://localhost:3456}"

echo -e "${BLUE}🔍 Verifying deployment at ${URL}...${NC}\n"

# Function to check a URL
check_url() {
  local path=$1
  local description=$2
  local full_url="${URL}${path}"
  
  echo -e "${YELLOW}Checking ${description}...${NC}"
  
  # Try up to 3 times with cache-busting
  for attempt in {1..3}; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
      -H "Cache-Control: no-cache" \
      -H "Pragma: no-cache" \
      "${full_url}?t=$(date +%s)&attempt=${attempt}" 2>/dev/null || echo "000")
    
    if [ "$STATUS" = "200" ]; then
      echo -e "${GREEN}✅ ${description} returned 200${NC}"
      return 0
    fi
    
    if [ $attempt -lt 3 ]; then
      echo -e "${YELLOW}⏳ Attempt $attempt failed (status: $STATUS), retrying...${NC}"
      sleep 2
    fi
  done
  
  echo -e "${RED}❌ ${description} failed after 3 attempts (status: $STATUS)${NC}"
  return 1
}

# 1. Check health endpoint
echo -e "${BLUE}1️⃣ Checking health endpoint...${NC}"
HEALTH_RESPONSE=$(curl -s "${URL}/api/health" 2>/dev/null || echo '{"status":"error"}')

if echo "$HEALTH_RESPONSE" | grep -q '"status":"ok"'; then
  echo -e "${GREEN}✅ Health check passed${NC}\n"
else
  echo -e "${RED}❌ Health check failed: $HEALTH_RESPONSE${NC}"
  exit 1
fi

# 2. Check critical pages
echo -e "${BLUE}2️⃣ Checking critical pages...${NC}"

PAGES=(
  "/:Home page"
  "/library:Library page"
  "/edit:Editor page"
  "/format:Format page"
  "/compare:Compare page"
  "/convert:Convert page"
)

FAILED_PAGES=()

for page_info in "${PAGES[@]}"; do
  IFS=':' read -r path description <<< "$page_info"
  if ! check_url "$path" "$description"; then
    FAILED_PAGES+=("$description")
  fi
done

echo ""

# 3. Summary
if [ ${#FAILED_PAGES[@]} -eq 0 ]; then
  echo -e "${GREEN}🎉 All deployment verifications passed!${NC}"
  echo -e "${BLUE}Application is healthy and all pages are accessible${NC}"
  exit 0
else
  echo -e "${RED}❌ Deployment verification failed${NC}"
  echo -e "${RED}Failed pages:${NC}"
  printf "${RED}  - %s${NC}\n" "${FAILED_PAGES[@]}"
  exit 1
fi

