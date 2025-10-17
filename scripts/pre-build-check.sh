#!/bin/bash

# Pre-Build Validation Script
# Runs type checking, linting, and test build before deployment
# Exit on first error

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Running pre-build checks...${NC}\n"

# 1. Type checking
echo -e "${YELLOW}📝 Type checking...${NC}"
if npx tsc --noEmit; then
  echo -e "${GREEN}✅ Type check passed${NC}\n"
else
  echo -e "${RED}❌ Type check failed${NC}"
  exit 1
fi

# 2. Linting
echo -e "${YELLOW}🔎 Linting...${NC}"
if npm run lint; then
  echo -e "${GREEN}✅ Lint check passed${NC}\n"
else
  echo -e "${RED}❌ Lint check failed${NC}"
  exit 1
fi

# 3. Test build
echo -e "${YELLOW}🏗️  Test build...${NC}"
if npm run build; then
  echo -e "${GREEN}✅ Build successful${NC}\n"
else
  echo -e "${RED}❌ Build failed${NC}"
  exit 1
fi

echo -e "${GREEN}🎉 All pre-build checks passed!${NC}"
echo -e "${BLUE}Ready for deployment${NC}"

