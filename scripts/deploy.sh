#!/bin/bash

# JSON Viewer - Simple Production Deployment
# KISS, DRY, YAGNI principles - does one thing well
# Usage: ./scripts/deploy.sh

set -e  # Exit on error

echo "🚀 JSON Viewer - Simple Production Deployment"
echo "=============================================="

# Configuration
SERVER="joachim@92.154.51.116"
REMOTE_DIR="~/production/json-viewer-io"

# Simple logging
log() {
    echo "$(date '+%H:%M:%S') $1"
}

# Simple deployment function
deploy() {
    log "Starting deployment..."

    # 1. Upload code
    log "Uploading code..."
    rsync -av --delete \
        --exclude node_modules \
        --exclude .next \
        --exclude .git \
        --exclude data \
        --exclude '*.log' \
        . ${SERVER}:${REMOTE_DIR}/

    # 2. Deploy on server
    log "Deploying on server..."
    ssh ${SERVER} << 'EOF'
cd ~/production/json-viewer-io

# Validate environment file exists
if [ ! -f .env ]; then
    echo "❌ ERROR: .env file not found on server!"
    echo "Please create .env from .env.production.template"
    echo "Example: cp .env.production.template .env"
    echo "Then edit .env with your production credentials"
    exit 1
fi

# Verify required environment variables
echo "🔍 Validating environment variables..."
required_vars=("DATABASE_URL" "REDIS_URL" "NEXTAUTH_SECRET" "NEXTAUTH_URL" "NEXT_PUBLIC_APP_URL")
missing_vars=()

for var in "${required_vars[@]}"; do
    if ! grep -q "^${var}=" .env; then
        missing_vars+=("$var")
    elif grep -q "^${var}=.*REPLACE.*" .env || grep -q "^${var}=.*your-.*" .env; then
        echo "⚠️  WARNING: ${var} appears to contain placeholder value"
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -gt 0 ]; then
    echo "❌ ERROR: Missing or invalid environment variables:"
    printf '  - %s\n' "${missing_vars[@]}"
    exit 1
fi

echo "✅ Environment variables validated"

# Stop, build, start (use config file directly with BuildKit)
docker compose -f config/docker-compose.server.yml down --remove-orphans
npm ci
npm run build
DOCKER_BUILDKIT=1 docker compose -f config/docker-compose.server.yml up -d --build

# Wait for health
for i in {1..30}; do
    if curl -f -s http://localhost:3456/api/health >/dev/null 2>&1; then
        echo "Application is healthy!"
        break
    fi
    sleep 2
done

# Cache busting - clear any reverse proxy caches
echo "Clearing caches..."
# Clear Caddy cache if it exists
sudo systemctl reload caddy 2>/dev/null || true
sudo systemctl restart caddy 2>/dev/null || true
# Clear any nginx cache if it exists
sudo systemctl reload nginx 2>/dev/null || true
# Force cache headers and wait
curl -H "Cache-Control: no-cache" -H "Pragma: no-cache" -s https://json-viewer.io/ >/dev/null 2>&1 || true
sleep 5
# Try to force cache invalidation with multiple requests
for i in {1..5}; do
    curl -H "Cache-Control: no-cache" -H "Pragma: no-cache" -s "https://json-viewer.io/library?bust=$i" >/dev/null 2>&1 || true
done

echo "Cache clearing completed"
exit 0
EOF

    log "Deployment completed!"
}

# Comprehensive verification using dedicated script
verify() {
    log "Verifying deployment..."

    # Wait a bit for caches to clear
    log "Waiting for caches to clear..."
    sleep 10

    # Run comprehensive verification script
    if ./scripts/verify-deployment.sh "https://json-viewer.io"; then
        log "Verification passed!"
        return 0
    else
        log "ERROR: Deployment verification failed"
        return 1
    fi
}

# Main execution
log "Checking server connectivity..."
if ! ssh -o ConnectTimeout=10 ${SERVER} 'echo "OK"' >/dev/null 2>&1; then
    echo "ERROR: Cannot reach server ${SERVER}"
    exit 1
fi

log "Testing local build..."
if ! npm run build >/dev/null 2>&1; then
    echo "ERROR: Local build failed"
    exit 1
fi

# Deploy
deploy

# Verify
if verify; then
    log "🎉 Deployment successful!"
    log "Application is live at https://json-viewer.io"
else
    log "❌ Deployment verification failed"
    exit 1
fi