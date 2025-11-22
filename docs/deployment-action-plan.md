# Deployment Workflow - Prioritized Action Plan

**Date:** 2025-01-23  
**Based on:** Deployment Workflow Audit 2025  
**Status:** Ready for Implementation

---

## Overview

This document provides a prioritized, step-by-step action plan to fix critical issues identified in the deployment workflow audit. Each item includes specific code changes, testing steps, and rollback procedures.

---

## Priority 1: Critical Security & Reliability Fixes 🔴

### Action 1.1: Fix Hardcoded Credentials in Dockerfile

**Priority:** 🔴 Critical  
**Risk:** High - Security vulnerability  
**Effort:** Low (15 minutes)  
**Impact:** Prevents credential leakage in image layers

#### Current Issue
```dockerfile
# Dockerfile:38-50 - BAD
ENV DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy
ENV REDIS_URL=redis://localhost:6379
ENV NEXTAUTH_SECRET=dummy-secret-for-build-only-min-32-chars
```

#### Fix
Replace `ENV` with `ARG` for build-time only values with proper placeholders:

```dockerfile
# Dockerfile - GOOD
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Use ARG for build-time only values (not persisted in final image)
# These placeholders are clearly marked as build-time only
ARG DATABASE_URL=postgresql://build_user:build_password@localhost:5432/build_database
ARG REDIS_URL=redis://localhost:6379
ARG NEXTAUTH_SECRET=build-time-secret-placeholder-min-32-chars-required-for-validation
ARG NEXTAUTH_URL=https://json-viewer.io
ARG NEXT_PUBLIC_APP_URL=https://json-viewer.io
ARG GITHUB_CLIENT_ID=build-time-github-client-id-placeholder
ARG GITHUB_CLIENT_SECRET=build-time-github-client-secret-placeholder
ARG GOOGLE_CLIENT_ID=build-time-google-client-id-placeholder.apps.googleusercontent.com
ARG GOOGLE_CLIENT_SECRET=build-time-google-client-secret-placeholder
ARG SMTP_HOST=smtp.build-time-placeholder.com
ARG SMTP_PORT=587
ARG SMTP_USERNAME=build-time-smtp-username
ARG SMTP_PASSWORD=build-time-smtp-password-placeholder

# Set as ENV for build process
ENV DATABASE_URL=${DATABASE_URL}
ENV REDIS_URL=${REDIS_URL}
ENV NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
ENV NEXTAUTH_URL=${NEXTAUTH_URL}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV GITHUB_CLIENT_ID=${GITHUB_CLIENT_ID}
ENV GITHUB_CLIENT_SECRET=${GITHUB_CLIENT_SECRET}
ENV GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
ENV GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
ENV SMTP_HOST=${SMTP_HOST}
ENV SMTP_PORT=${SMTP_PORT}
ENV SMTP_USERNAME=${SMTP_USERNAME}
ENV SMTP_PASSWORD=${SMTP_PASSWORD}

ENV SKIP_ENV_VALIDATION=true
ENV NODE_ENV=production

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# ARGs are not copied to next stage, only build artifacts
```

#### Implementation Steps
1. Update `Dockerfile` with ARG-based approach
2. Test build locally: `docker build -t test-image .`
3. Verify build-time placeholders not in final image: `docker run --rm test-image env | grep -i "build-time"` (should return nothing)
4. Push to CI and verify build succeeds
5. Deploy to staging and verify app works

#### Testing
```bash
# Verify build-time placeholders not in final image
docker build -t test-image .
docker run --rm test-image env | grep -i "build-time"
# Should return nothing (ARGs don't persist to final image)

# Verify build still works
docker build -t test-image .
docker run -p 3456:3456 test-image
# Should start successfully
```

#### Rollback
- Revert Dockerfile changes
- Rebuild and redeploy

---

### Action 1.2: Fix Database Migration Strategy

**Priority:** 🔴 Critical  
**Risk:** High - Data loss potential  
**Effort:** Medium (2-3 hours)  
**Impact:** Prevents accidental data loss, enables rollback

#### Current Issue
```bash
# config/docker-entrypoint.sh:52,74 - BAD
npx prisma db push --accept-data-loss --schema prisma/schema.prisma
```

#### Fix
Replace with proper migration system:

**Step 1: Update docker-entrypoint.sh**
```bash
# config/docker-entrypoint.sh - GOOD
#!/bin/sh
set -e

echo "🚀 Starting JSON Viewer application..."

# Validate required environment variables
validate_env() {
  echo "🔍 Validating environment variables..."
  
  required_vars="DATABASE_URL REDIS_URL NEXTAUTH_SECRET NEXTAUTH_URL"
  missing_vars=""
  
  for var in $required_vars; do
    eval value=\$$var
    if [ -z "$value" ]; then
      if [ -n "$missing_vars" ]; then
        missing_vars="$missing_vars, $var"
      else
        missing_vars="$var"
      fi
    fi
  done
  
  if [ -n "$missing_vars" ]; then
    echo "❌ ERROR: Missing required environment variables: $missing_vars"
    echo "Please ensure all required environment variables are set in your .env file"
    exit 1
  fi
  
  echo "✅ Environment variables validated"
}

validate_env

# Run database migrations (using migrate deploy, not db push)
echo "🔄 Running database migrations..."

# Helper to check DB readiness
check_db() {
  printf "SELECT 1" | npx prisma db execute --stdin --url "$DATABASE_URL" > /dev/null 2>&1
}

# Wait for database with timeout
echo "⏳ Waiting for database connection..."
max_attempts=20
attempt=0

while ! check_db; do
  attempt=$((attempt + 1))
  if [ $attempt -ge $max_attempts ]; then
    echo "❌ ERROR: Database not reachable after ${max_attempts} attempts"
    echo "Please check your DATABASE_URL and ensure the database is running"
    exit 1
  fi
  echo "⏳ Waiting for database... (attempt $attempt/$max_attempts)"
  sleep 2
done

echo "✅ Database connection established"

# Check migration status
echo "📦 Checking migration status..."
if npx prisma migrate status --schema prisma/schema.prisma > /dev/null 2>&1; then
  MIGRATION_STATUS=$(npx prisma migrate status --schema prisma/schema.prisma 2>&1 || true)
  
  if echo "$MIGRATION_STATUS" | grep -q "Database schema is up to date"; then
    echo "✅ Database schema is up to date"
  elif echo "$MIGRATION_STATUS" | grep -q "Following migrations have not yet been applied"; then
    echo "📦 Pending migrations detected, applying..."
    if npx prisma migrate deploy --schema prisma/schema.prisma; then
      echo "✅ Database migrations completed successfully"
    else
      echo "❌ ERROR: Database migrations failed!"
      echo "Please check the migration files and database connection"
      exit 1
    fi
  else
    echo "⚠️  Migration status check failed, attempting to apply migrations..."
    if npx prisma migrate deploy --schema prisma/schema.prisma; then
      echo "✅ Database migrations completed successfully"
    else
      echo "❌ ERROR: Database migrations failed!"
      exit 1
    fi
  fi
else
  echo "⚠️  Could not check migration status, attempting to apply migrations..."
  if npx prisma migrate deploy --schema prisma/schema.prisma; then
    echo "✅ Database migrations completed successfully"
  else
    echo "❌ ERROR: Database migrations failed!"
    exit 1
  fi
fi

# Start the application
echo "🎯 Starting Next.js application..."
exec node server.js
```

**Step 2: Create Initial Migration (if needed)**
```bash
# If you don't have migrations yet, create baseline
npx prisma migrate dev --name init --create-only
# Review the migration file
# Then apply it
npx prisma migrate deploy
```

#### Implementation Steps
1. Review current Prisma schema
2. Create baseline migration if migrations don't exist
3. Update `docker-entrypoint.sh` with new migration logic
4. Test locally with local database
5. Test in staging environment
6. Deploy to production

#### Testing
```bash
# Test migration status check
npx prisma migrate status

# Test migration deployment
npx prisma migrate deploy

# Verify no data loss
# Check that existing data is still present after migration
```

#### Rollback
- Keep backup of old entrypoint script
- Can revert to `db push` if needed (not recommended)
- Use Prisma migration rollback: `npx prisma migrate resolve --rolled-back <migration_name>`

#### Migration Best Practices
1. Always test migrations in staging first
2. Create database backup before applying migrations
3. Review migration files before deploying
4. Use `--create-only` to review migrations before applying

---

### Action 1.3: Fix Health Check Endpoint

**Priority:** 🔴 Critical  
**Risk:** Medium - Monitoring reliability  
**Effort:** Low (30 minutes)  
**Impact:** Enables proper health monitoring and auto-scaling

#### Current Issue
```typescript
// app/api/health/route.ts - BAD
// Always returns 200, even when unhealthy
return success(..., { status: 200 });
```

#### Fix
Return appropriate HTTP status codes:

```typescript
// app/api/health/route.ts - GOOD
import { checkDBHealth } from '@/lib/db';
import { logger } from '@/lib/logger';
import { success, error as errorResponse } from '@/lib/api/responses';
import { config } from '@/lib/config';
import { APP_VERSION } from '@/lib/utils/version';

export async function GET() {
  try {
    const health = await checkDBHealth();

    const isHealthy = health.postgres && health.redis;
    
    const healthData = {
      status: isHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        database: health.postgres ? 'healthy' : 'unhealthy',
        redis: health.redis ? 'healthy' : 'unhealthy',
      },
      version: APP_VERSION,
      environment: config.nodeEnv,
      healthy: isHealthy,
    };

    // Return 200 if healthy, 503 if unhealthy
    if (isHealthy) {
      return success(healthData, { status: 200 });
    } else {
      // Return 503 (Service Unavailable) when unhealthy
      // This allows reverse proxies and orchestrators to detect failures
      return success(healthData, { status: 503 });
    }
  } catch (error) {
    logger.error(
      {
        err: error,
        environment: config.nodeEnv,
      },
      'Health check failed'
    );

    return errorResponse(error instanceof Error ? error.message : 'Health check failed', {
      status: 503,
      metadata: {
        timestamp: new Date().toISOString(),
        services: {
          database: 'unhealthy',
          redis: 'unhealthy',
        },
      },
    });
  }
}
```

#### Alternative: Separate Liveness and Readiness Endpoints

For Kubernetes-style deployments, consider separate endpoints:

```typescript
// app/api/health/live/route.ts - Liveness probe
// Returns 200 if process is alive (always, unless crashing)
export async function GET() {
  return success({ status: 'alive' }, { status: 200 });
}

// app/api/health/ready/route.ts - Readiness probe
// Returns 200 if ready to serve traffic, 503 if not
export async function GET() {
  const health = await checkDBHealth();
  const isReady = health.postgres && health.redis;
  
  if (isReady) {
    return success({ status: 'ready' }, { status: 200 });
  } else {
    return success({ status: 'not ready' }, { status: 503 });
  }
}
```

#### Implementation Steps
1. Update health check endpoint to return 503 when unhealthy
2. Test locally by stopping database/redis
3. Verify reverse proxy/orchestrator detects failures
4. Update docker-compose health check if needed
5. Deploy and monitor

#### Testing
```bash
# Test healthy state
curl http://localhost:3456/api/health
# Should return 200

# Test unhealthy state (stop database)
# Stop postgres container
docker compose stop postgres
curl http://localhost:3456/api/health
# Should return 503

# Test with docker health check
docker inspect <container> | grep -A 10 Health
# Should show unhealthy status
```

#### Rollback
- Revert health check changes
- Health checks will continue to return 200 (old behavior)

---

## Priority 2: High Priority Improvements 🟡

### Action 2.1: Align Environment Variable Validation

**Priority:** 🟡 High  
**Risk:** Medium - Runtime failures  
**Effort:** Low (1 hour)  
**Impact:** Consistent validation, fewer runtime errors

#### Current Issue
- Entrypoint validates 4 variables
- Deploy script validates 9 variables
- Inconsistent validation

#### Fix
Create shared validation script:

**Step 1: Create validation script**
```bash
# scripts/validate-env.sh
#!/bin/bash
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Required environment variables
REQUIRED_VARS=(
  "DATABASE_URL"
  "REDIS_URL"
  "NEXTAUTH_SECRET"
  "NEXTAUTH_URL"
  "NEXT_PUBLIC_APP_URL"
  "SMTP_HOST"
  "SMTP_PORT"
  "SMTP_USERNAME"
  "SMTP_PASSWORD"
)

# Optional but recommended
RECOMMENDED_VARS=(
  "GITHUB_CLIENT_ID"
  "GITHUB_CLIENT_SECRET"
  "GOOGLE_CLIENT_ID"
  "GOOGLE_CLIENT_SECRET"
)

validate_env() {
  local env_file="${1:-.env}"
  local strict="${2:-true}"
  
  if [ ! -f "$env_file" ]; then
    echo -e "${RED}❌ ERROR: Environment file not found: $env_file${NC}"
    return 1
  fi
  
  local missing_vars=()
  local invalid_vars=()
  
  # Check required variables
  for var in "${REQUIRED_VARS[@]}"; do
    if ! grep -q "^${var}=" "$env_file"; then
      missing_vars+=("$var")
    elif grep -q "^${var}=.*REPLACE.*" "$env_file" || \
         grep -q "^${var}=.*your-.*" "$env_file" || \
         grep -q "^${var}=.*build-time.*" "$env_file" || \
         grep -q "^${var}=.*placeholder.*" "$env_file" || \
         grep -q "^${var}=\s*$" "$env_file"; then
      invalid_vars+=("$var")
    fi
  done
  
  # Report issues
  if [ ${#missing_vars[@]} -gt 0 ]; then
    echo -e "${RED}❌ Missing required environment variables:${NC}"
    printf "${RED}  - %s${NC}\n" "${missing_vars[@]}"
    if [ "$strict" = "true" ]; then
      return 1
    fi
  fi
  
  if [ ${#invalid_vars[@]} -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Invalid or placeholder values found:${NC}"
    printf "${YELLOW}  - %s${NC}\n" "${invalid_vars[@]}"
    if [ "$strict" = "true" ]; then
      return 1
    fi
  fi
  
  if [ ${#missing_vars[@]} -eq 0 ] && [ ${#invalid_vars[@]} -eq 0 ]; then
    echo -e "${GREEN}✅ All required environment variables are valid${NC}"
    return 0
  else
    return 1
  fi
}

# Run validation
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
  validate_env "$@"
fi
```

**Step 2: Update docker-entrypoint.sh**
```bash
# config/docker-entrypoint.sh
# Source validation script if available, otherwise use inline validation
if [ -f /app/scripts/validate-env.sh ]; then
  source /app/scripts/validate-env.sh
  validate_env .env true
else
  # Fallback to inline validation (existing code)
  validate_env
fi
```

**Step 3: Update deploy.sh**
```bash
# scripts/deploy.sh
# Use shared validation script
if [ -f scripts/validate-env.sh ]; then
  source scripts/validate-env.sh
  if ! validate_env .env true; then
    exit 1
  fi
else
  # Fallback to existing validation
  # ... existing code ...
fi
```

#### Implementation Steps
1. Create `scripts/validate-env.sh`
2. Make it executable: `chmod +x scripts/validate-env.sh`
3. Update `docker-entrypoint.sh` to use it
4. Update `deploy.sh` to use it
5. Test validation in both contexts
6. Deploy

#### Testing
```bash
# Test with valid .env
./scripts/validate-env.sh .env
# Should pass

# Test with missing variables
./scripts/validate-env.sh .env.example
# Should fail

# Test in container
docker run --rm -v $(pwd)/.env:/app/.env test-image
# Should validate on startup
```

---

### Action 2.2: Improve Health Check in Deploy Script

**Priority:** 🟡 High  
**Risk:** Low  
**Effort:** Low (30 minutes)  
**Impact:** Better deployment reliability

#### Current Issue
```bash
# scripts/deploy.sh:152-158
# No failure handling if health check never passes
for i in {1..30}; do
    if curl -f -s http://localhost:3456/api/health >/dev/null 2>&1; then
        echo "Application is healthy!"
        break
    fi
    sleep 2
done
```

#### Fix
```bash
# scripts/deploy.sh - IMPROVED
MAX_HEALTH_CHECK_ATTEMPTS=30
HEALTH_CHECK_INTERVAL=2
HEALTH_CHECK_PASSED=false

echo "🏥 Waiting for application health check..."
for i in $(seq 1 $MAX_HEALTH_CHECK_ATTEMPTS); do
    if curl -f -s http://localhost:3456/api/health >/dev/null 2>&1; then
        HEALTH_STATUS=$(curl -s http://localhost:3456/api/health | grep -o '"status":"[^"]*"' | cut -d'"' -f4 || echo "unknown")
        HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3456/api/health)
        
        if [ "$HTTP_STATUS" = "200" ] && [ "$HEALTH_STATUS" = "ok" ]; then
            echo "✅ Application is healthy! (attempt $i/$MAX_HEALTH_CHECK_ATTEMPTS)"
            HEALTH_CHECK_PASSED=true
            break
        else
            echo "⏳ Application responding but not fully healthy (status: $HEALTH_STATUS, HTTP: $HTTP_STATUS)..."
        fi
    else
        echo "⏳ Waiting for application... (attempt $i/$MAX_HEALTH_CHECK_ATTEMPTS)"
    fi
    sleep $HEALTH_CHECK_INTERVAL
done

if [ "$HEALTH_CHECK_PASSED" != "true" ]; then
    echo "❌ ERROR: Health check failed after $MAX_HEALTH_CHECK_ATTEMPTS attempts"
    echo "Application may not have started correctly"
    echo "Checking container logs..."
    docker compose -f config/docker-compose.server.yml logs --tail=50 app || true
    exit 1
fi
```

#### Implementation Steps
1. Update deploy.sh with improved health check
2. Test with slow-starting container
3. Test with failing container
4. Deploy and verify

---

### Action 2.3: Add Pre-deployment Tests to CI

**Priority:** 🟡 High  
**Risk:** Low  
**Effort:** Medium (2 hours)  
**Impact:** Catches issues before deployment

#### Fix
Update GitHub Actions workflow:

```yaml
# .github/workflows/deploy.yml
name: Build and Deploy

on:
  push:
    branches:
      - main
  workflow_dispatch:

env:
  NODE_VERSION: '20'
  DOCKER_BUILDKIT: 1
  REGISTRY: ghcr.io

jobs:
  # NEW: Test job
  test:
    name: Run Tests
    runs-on: ubuntu-latest
    timeout-minutes: 15
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run type check
        run: npx tsc --noEmit
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run security audit
        run: npm audit --audit-level=moderate || true
        continue-on-error: true

  # EXISTING: Build job (now depends on test)
  build-and-push:
    name: Build and Push Docker Image
    runs-on: ubuntu-latest
    timeout-minutes: 30
    needs: test  # NEW: Wait for tests to pass
    permissions:
      contents: read
      packages: write
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      # ... rest of existing steps ...
      
      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        env:
          SKIP_ENV_VALIDATION: "true"
          NODE_ENV: "production"
        with:
          context: .
          file: ./Dockerfile
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          platforms: linux/amd64
      
      # NEW: Scan image for vulnerabilities
      - name: Scan image for vulnerabilities
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ steps.meta.outputs.tags }}
          format: 'sarif'
          output: 'trivy-results.sarif'
          severity: 'CRITICAL,HIGH'
        continue-on-error: true
      
      - name: Upload Trivy results
        uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: 'trivy-results.sarif'
        continue-on-error: true
```

#### Implementation Steps
1. Add test job to workflow
2. Add image scanning step
3. Test workflow on feature branch
4. Merge to main and verify

---

## Priority 3: Medium Priority Improvements 🟢

### Action 3.1: Improve Rollback Strategy

**Priority:** 🟢 Medium  
**Risk:** Low  
**Effort:** Medium (3-4 hours)  
**Impact:** Faster, more reliable rollbacks

#### Current Issue
- File-based rollback requires rebuild
- Doesn't use Docker image tags

#### Fix
Update rollback to use image tags:

```bash
# scripts/rollback.sh - IMPROVED
# Add image tag-based rollback option

# Function to rollback using image tag
rollback_by_image_tag() {
  local tag=$1
  
  echo "🔄 Rolling back to image tag: $tag"
  
  # Update docker-compose to use specific tag
  sed -i.bak "s|image:.*|image: ghcr.io/${OWNER_LC}/${REPO_LC}:${tag}|" config/docker-compose.server.yml
  
  # Pull and deploy
  docker compose -f config/docker-compose.server.yml pull app
  docker compose -f config/docker-compose.server.yml up -d app
  
  # Verify
  sleep 10
  if curl -f -s http://localhost:3456/api/health >/dev/null 2>&1; then
    echo "✅ Rollback successful"
    return 0
  else
    echo "❌ Rollback failed"
    return 1
  fi
}

# List available image tags
list_image_tags() {
  echo "Available image tags:"
  # Query GHCR API for tags
  # Implementation depends on GHCR API access
}
```

---

## Implementation Timeline

### Week 1: Critical Fixes
- [ ] Day 1-2: Fix Dockerfile credentials (Action 1.1)
- [ ] Day 3-4: Fix database migrations (Action 1.2)
- [ ] Day 5: Fix health check endpoint (Action 1.3)

### Week 2: High Priority
- [ ] Day 1-2: Align environment validation (Action 2.1)
- [ ] Day 3: Improve deploy script health check (Action 2.2)
- [ ] Day 4-5: Add CI tests (Action 2.3)

### Week 3: Medium Priority
- [ ] Improve rollback strategy
- [ ] Add monitoring
- [ ] Documentation updates

---

## Testing Checklist

For each action item:
- [ ] Test locally
- [ ] Test in staging environment
- [ ] Verify no regressions
- [ ] Update documentation
- [ ] Deploy to production
- [ ] Monitor for issues

---

## Rollback Procedures

Each action item includes:
1. Backup of original files
2. Git commit for easy revert
3. Step-by-step rollback instructions
4. Verification steps

---

## Success Criteria

- ✅ No hardcoded credentials in Docker images
- ✅ Safe database migrations with rollback capability
- ✅ Proper health check status codes
- ✅ Consistent environment validation
- ✅ Automated testing before deployment
- ✅ Improved deployment reliability

---

## Notes

- Test all changes in staging first
- Keep backups of all modified files
- Document any deviations from this plan
- Update this document as changes are implemented

