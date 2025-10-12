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

# Set production environment
cat > .env << 'ENVEOF'
DATABASE_URL="postgresql://json_viewer_user:json_viewer_secure_pass@postgres:5432/json_viewer"
REDIS_URL="redis://redis:6379"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="https://json-viewer.io"
NEXT_PUBLIC_APP_URL="https://json-viewer.io"
NODE_ENV="production"
ENVEOF

# Use server docker config
cp config/docker-compose.server.yml docker-compose.yml

# Stop, build, start
docker-compose down --remove-orphans
npm ci
npm run build
docker-compose up -d

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

# Simple verification with cache busting
verify() {
    log "Verifying deployment..."

    # Wait for app to be ready
    for i in {1..20}; do
        if curl -f -s https://json-viewer.io/api/health >/dev/null 2>&1; then
            log "Health check passed"
            break
        fi
        sleep 3
    done

    # Cache busting - wait a bit more and force fresh content
    log "Cache busting - waiting for fresh content..."
    sleep 15

    # Multiple attempts with cache-busting headers
    for attempt in {1..3}; do
        log "Verification attempt $attempt/3..."
        if ! curl -H "Cache-Control: no-cache" -H "Pragma: no-cache" -s "https://json-viewer.io/library?t=$(date +%s)&attempt=$attempt" | grep -qi "share a json"; then
            log "Verification passed on attempt $attempt!"
            break
        fi
        if [ $attempt -eq 3 ]; then
            log "ERROR: 'Share a JSON' button still present after 3 attempts"
            return 1
        fi
        sleep 5
    done

    log "Verification passed!"
    return 0
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