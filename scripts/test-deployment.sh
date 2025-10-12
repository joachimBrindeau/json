#!/bin/bash

# Test script to verify deployment verification works
# This script tests the verification functions without actually deploying

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Test verification functions
verify_specific_changes() {
    log_info "Testing specific changes verification..."
    
    # Check that "Share a JSON" button is removed from library page
    if curl -s "https://json-viewer.io/library" | grep -qi "share a json"; then
        log_error "VERIFICATION FAILED: 'Share a JSON' button still present on library page"
        return 1
    fi
    log_success "✓ 'Share a JSON' button removed from library page"
    
    # Check that "Create New JSON" button is removed from private page
    if curl -s "https://json-viewer.io/private" | grep -qi "create new json"; then
        log_error "VERIFICATION FAILED: 'Create New JSON' button still present on private page"
        return 1
    fi
    log_success "✓ 'Create New JSON' button removed from private page"
    
    return 0
}

verify_critical_functionality() {
    log_info "Testing critical functionality verification..."
    
    # Test health endpoint
    local health_response=$(curl -s https://json-viewer.io/api/health)
    if ! echo "$health_response" | grep -q '"status":"ok"'; then
        log_error "VERIFICATION FAILED: Health endpoint not responding correctly"
        echo "Health response: $health_response"
        return 1
    fi
    log_success "✓ Health endpoint working"
    
    # Test main pages load
    local pages=("/" "/library" "/private" "/edit" "/format" "/compare")
    for page in "${pages[@]}"; do
        if ! curl -f -s "https://json-viewer.io$page" >/dev/null 2>&1; then
            log_error "VERIFICATION FAILED: Page $page not loading"
            return 1
        fi
    done
    log_success "✓ All critical pages loading"
    
    return 0
}

echo "🧪 Testing Deployment Verification Functions"
echo "============================================="

# Run tests
if verify_specific_changes && verify_critical_functionality; then
    echo ""
    log_success "🎉 ALL VERIFICATION TESTS PASSED!"
    log_success "The deployment verification functions are working correctly."
    echo ""
else
    echo ""
    log_error "🚨 VERIFICATION TESTS FAILED!"
    log_error "The deployment verification detected issues."
    echo ""
    exit 1
fi
