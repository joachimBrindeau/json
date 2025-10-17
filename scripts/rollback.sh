#!/bin/bash

# Rollback Script
# Rolls back to a previous deployment by restoring from backup
# Usage: ./scripts/rollback.sh [backup-number]
# Example: ./scripts/rollback.sh 1  (rollback to previous deployment)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="${HOME}/production/json-viewer-io-backups"
DEPLOY_DIR="${HOME}/production/json-viewer-io"
MAX_BACKUPS=5

# Function to log messages
log() {
  echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
  echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

success() {
  echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] SUCCESS:${NC} $1"
}

warning() {
  echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

# Check if backup directory exists
if [ ! -d "$BACKUP_DIR" ]; then
  error "Backup directory not found: $BACKUP_DIR"
  error "No backups available for rollback"
  exit 1
fi

# List available backups
log "Available backups:"
echo ""

BACKUPS=($(ls -1dt ${BACKUP_DIR}/backup-* 2>/dev/null || true))

if [ ${#BACKUPS[@]} -eq 0 ]; then
  error "No backups found in $BACKUP_DIR"
  exit 1
fi

# Display backups with numbers
for i in "${!BACKUPS[@]}"; do
  backup_path="${BACKUPS[$i]}"
  backup_name=$(basename "$backup_path")
  backup_date=$(echo "$backup_name" | sed 's/backup-//' | sed 's/-/ /g' | sed 's/_/:/g')
  
  # Get commit hash if available
  commit_file="${backup_path}/.commit"
  if [ -f "$commit_file" ]; then
    commit_hash=$(cat "$commit_file")
    echo -e "${YELLOW}[$((i+1))]${NC} $backup_date ${BLUE}(commit: $commit_hash)${NC}"
  else
    echo -e "${YELLOW}[$((i+1))]${NC} $backup_date"
  fi
done

echo ""

# Get backup number from argument or prompt
if [ -n "$1" ]; then
  BACKUP_NUM=$1
else
  read -p "Enter backup number to restore (1-${#BACKUPS[@]}): " BACKUP_NUM
fi

# Validate backup number
if ! [[ "$BACKUP_NUM" =~ ^[0-9]+$ ]] || [ "$BACKUP_NUM" -lt 1 ] || [ "$BACKUP_NUM" -gt ${#BACKUPS[@]} ]; then
  error "Invalid backup number: $BACKUP_NUM"
  exit 1
fi

# Get selected backup path
SELECTED_BACKUP="${BACKUPS[$((BACKUP_NUM-1))]}"
BACKUP_NAME=$(basename "$SELECTED_BACKUP")

log "Selected backup: $BACKUP_NAME"

# Confirm rollback
echo ""
warning "⚠️  This will rollback the application to the selected backup"
warning "⚠️  Current deployment will be backed up before rollback"
echo ""
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  log "Rollback cancelled"
  exit 0
fi

echo ""
log "Starting rollback process..."

# Step 1: Create backup of current deployment
log "Creating backup of current deployment..."
CURRENT_BACKUP_NAME="backup-$(date +'%Y-%m-%d-%H_%M_%S')-pre-rollback"
CURRENT_BACKUP_PATH="${BACKUP_DIR}/${CURRENT_BACKUP_NAME}"

mkdir -p "$CURRENT_BACKUP_PATH"

# Copy current deployment
rsync -a --exclude 'node_modules' --exclude '.next' "$DEPLOY_DIR/" "$CURRENT_BACKUP_PATH/"

# Save current commit hash
cd "$DEPLOY_DIR"
if [ -d .git ]; then
  git rev-parse HEAD > "$CURRENT_BACKUP_PATH/.commit" 2>/dev/null || true
fi

success "Current deployment backed up to: $CURRENT_BACKUP_NAME"

# Step 2: Stop current application
log "Stopping current application..."
cd "$DEPLOY_DIR"
docker compose -f config/docker-compose.server.yml down --remove-orphans || true
success "Application stopped"

# Step 3: Restore from backup
log "Restoring from backup: $BACKUP_NAME..."

# Remove current deployment files (except .env and backups)
find "$DEPLOY_DIR" -mindepth 1 -maxdepth 1 \
  ! -name '.env*' \
  ! -name 'json-viewer-io-backups' \
  -exec rm -rf {} + 2>/dev/null || true

# Copy backup files
rsync -a "$SELECTED_BACKUP/" "$DEPLOY_DIR/"

success "Files restored from backup"

# Step 4: Reinstall dependencies
log "Installing dependencies..."
cd "$DEPLOY_DIR"
npm ci --production=false

# Step 5: Rebuild application
log "Building application..."
npm run build

# Step 6: Start application
log "Starting application..."
DOCKER_BUILDKIT=1 docker compose -f config/docker-compose.server.yml up -d --build

# Step 7: Wait for application to start
log "Waiting for application to start..."
sleep 10

# Step 8: Verify application
log "Verifying application..."

# Check health endpoint
for i in {1..30}; do
  if curl -f -s http://localhost:3456/api/health >/dev/null 2>&1; then
    success "Health check passed"
    break
  fi
  if [ $i -eq 30 ]; then
    error "Health check failed after 30 attempts"
    error "Application may not have started correctly"
    exit 1
  fi
  sleep 2
done

# Run full verification if script exists
if [ -f "$DEPLOY_DIR/scripts/verify-deployment.sh" ]; then
  log "Running full verification..."
  if "$DEPLOY_DIR/scripts/verify-deployment.sh" "http://localhost:3456"; then
    success "Verification passed"
  else
    warning "Verification failed - check application manually"
  fi
fi

# Step 9: Cleanup old backups (keep only MAX_BACKUPS)
log "Cleaning up old backups..."
BACKUP_COUNT=$(ls -1dt ${BACKUP_DIR}/backup-* 2>/dev/null | wc -l)

if [ "$BACKUP_COUNT" -gt "$MAX_BACKUPS" ]; then
  BACKUPS_TO_DELETE=$((BACKUP_COUNT - MAX_BACKUPS))
  log "Removing $BACKUPS_TO_DELETE old backup(s)..."
  
  ls -1dt ${BACKUP_DIR}/backup-* | tail -n "$BACKUPS_TO_DELETE" | while read backup; do
    log "Removing: $(basename "$backup")"
    rm -rf "$backup"
  done
  
  success "Old backups cleaned up"
fi

# Final summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
success "🎉 Rollback completed successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
log "Restored from: $BACKUP_NAME"
log "Current deployment backed up to: $CURRENT_BACKUP_NAME"
log "Application is running and verified"
echo ""
log "Check application at: http://localhost:3456"
echo ""

