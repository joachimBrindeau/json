#!/bin/bash
# Test Anti-Pattern Prevention Hook
# Prevents test.skip(), .or() selectors, waitForTimeout, and test.only() from being committed

set -e

echo "🔍 Checking for test anti-patterns..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

# Get staged files (only .ts files in tests directory)
STAGED_TEST_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '(tests/.*\.ts$|tests/.*\.spec\.ts$)' || true)

if [ -z "$STAGED_TEST_FILES" ]; then
  echo "✅ No test files staged for commit"
  exit 0
fi

echo "📝 Checking files:"
echo "$STAGED_TEST_FILES" | sed 's/^/  - /'
echo ""

# Check for test.skip()
echo "Checking for test.skip()..."
if echo "$STAGED_TEST_FILES" | xargs git diff --cached | grep -E 'test\.skip\(' > /dev/null 2>&1; then
  echo -e "${RED}❌ ERROR: test.skip() found in staged files${NC}"
  echo -e "${YELLOW}   Use proper expect() assertions instead of conditional skips${NC}"
  echo -e "${YELLOW}   Files with test.skip():${NC}"
  echo "$STAGED_TEST_FILES" | xargs git diff --cached | grep -n 'test\.skip(' | sed 's/^/     /'
  ERRORS=$((ERRORS + 1))
fi

# Check for .or() selector fallbacks
echo "Checking for .or() fallback selectors..."
if echo "$STAGED_TEST_FILES" | xargs git diff --cached | grep -E '\.or\(' > /dev/null 2>&1; then
  echo -e "${RED}❌ ERROR: .or() fallback selectors found in staged files${NC}"
  echo -e "${YELLOW}   Use single, correct selectors with strict expect() assertions${NC}"
  echo -e "${YELLOW}   Files with .or():${NC}"
  echo "$STAGED_TEST_FILES" | xargs git diff --cached | grep -n '\.or(' | sed 's/^/     /'
  ERRORS=$((ERRORS + 1))
fi

# Check for waitForTimeout
echo "Checking for waitForTimeout..."
if echo "$STAGED_TEST_FILES" | xargs git diff --cached | grep -E 'waitForTimeout' > /dev/null 2>&1; then
  echo -e "${RED}❌ ERROR: waitForTimeout found in staged files${NC}"
  echo -e "${YELLOW}   Use state-based waits instead:${NC}"
  echo -e "${YELLOW}   - waitForLoadState('networkidle')${NC}"
  echo -e "${YELLOW}   - expect(element).toBeVisible()${NC}"
  echo -e "${YELLOW}   - element.waitFor({ state: 'visible' })${NC}"
  echo -e "${YELLOW}   Files with waitForTimeout:${NC}"
  echo "$STAGED_TEST_FILES" | xargs git diff --cached | grep -n 'waitForTimeout' | sed 's/^/     /'
  ERRORS=$((ERRORS + 1))
fi

# Check for test.only()
echo "Checking for test.only()..."
if echo "$STAGED_TEST_FILES" | xargs git diff --cached | grep -E 'test\.only\(' > /dev/null 2>&1; then
  echo -e "${RED}❌ ERROR: test.only() found in staged files${NC}"
  echo -e "${YELLOW}   Remove .only() before committing (already enforced by forbidOnly in config)${NC}"
  echo -e "${YELLOW}   Files with test.only():${NC}"
  echo "$STAGED_TEST_FILES" | xargs git diff --cached | grep -n 'test\.only(' | sed 's/^/     /'
  ERRORS=$((ERRORS + 1))
fi

# Summary
echo ""
if [ $ERRORS -gt 0 ]; then
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${RED}❌ Quality check FAILED with $ERRORS error(s)${NC}"
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo -e "${YELLOW}To bypass this check in emergency situations:${NC}"
  echo -e "${YELLOW}  git commit --no-verify${NC}"
  echo ""
  exit 1
else
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}✅ All test quality checks passed!${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  exit 0
fi