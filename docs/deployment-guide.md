# Clean Docker Deployment Guide

## Overview

This guide implements **Option A: Docker Registry Approach** - the cleanest and most production-ready deployment method.

## Architecture

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   GitHub    │─────▶│  GitHub CI  │─────▶│  GHCR       │─────▶│   Server    │
│   (Push)    │      │  (Build)    │      │  (Registry) │      │  (Deploy)   │
└─────────────┘      └─────────────┘      └─────────────┘      └─────────────┘
```

## Prerequisites

1. GitHub repository with Actions enabled
2. Server with Docker and Docker Compose installed
3. SSH access to server
4. GitHub Personal Access Token (PAT) with `write:packages` permission (for GHCR)

## Setup Steps

### 1. Configure GitHub Container Registry

#### 1.1 Create GitHub Secrets

Go to: `Settings → Secrets and variables → Actions`

Add these secrets:
- `SSH_PRIVATE_KEY`: SSH private key for server access
- `SERVER_HOST`: Your server hostname/IP
- `SERVER_USER`: SSH username (usually `root` or your user)
- `DEPLOY_PATH`: Deployment directory (e.g., `~/production/json-viewer-io`)
- `APP_URL`: Your application URL (e.g., `https://json-viewer.io`)

**Note:** GHCR authentication uses `GITHUB_TOKEN` automatically in GitHub Actions.

#### 1.2 Enable GitHub Packages

1. Go to repository Settings
2. Navigate to Actions → General
3. Ensure "Workflow permissions" allows "Read and write permissions"
4. This enables automatic GHCR authentication

### 2. Update Docker Configuration

#### 2.1 Fix Dockerfile (Root)

Ensure your `/Dockerfile` includes `curl` for health checks:

```dockerfile
# Add curl for health checks (in runner stage)
FROM base AS runner
WORKDIR /app

# ... existing code ...

# Install curl for health checks
RUN apk add --no-cache curl

# ... rest of Dockerfile ...
```

#### 2.2 Delete Duplicate Dockerfile

```bash
rm config/Dockerfile  # Keep only root Dockerfile
```

#### 2.3 Update docker-entrypoint.sh

Add environment variable validation:

```bash
#!/bin/sh
set -e

echo "🚀 Starting JSON Viewer application..."

# Validate required environment variables
validate_env() {
  echo "🔍 Validating environment variables..."
  
  required_vars=("DATABASE_URL" "REDIS_URL" "NEXTAUTH_SECRET" "NEXTAUTH_URL")
  missing_vars=()
  
  for var in "${required_vars[@]}"; do
    if [ -z "$(eval echo \$$var)" ]; then
      missing_vars+=("$var")
    fi
  done
  
  if [ ${#missing_vars[@]} -gt 0 ]; then
    echo "❌ ERROR: Missing required environment variables:"
    printf '  - %s\n' "${missing_vars[@]}"
    exit 1
  fi
  
  echo "✅ Environment variables validated"
}

validate_env

# ... rest of existing script ...
```

### 3. Update Docker Compose for Registry

#### 3.1 Update `config/docker-compose.server.yml`

```yaml
services:
  # PostgreSQL Database (unchanged)
  postgres:
    image: postgres:16-alpine
    # ... existing config ...

  # Redis (unchanged)
  redis:
    image: redis:7-alpine
    # ... existing config ...

  # Next.js Application
  app:
    # Use registry image instead of building
    image: ghcr.io/${GITHUB_REPOSITORY_OWNER}/json-viewer-io:latest
    pull_policy: always  # Always pull latest on deploy
    
    restart: unless-stopped
    env_file: ../.env
    environment:
      - NODE_ENV=production
    
    ports:
      - "3456:3456"
    
    networks:
      - json-viewer-network
    
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3456/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

# ... rest unchanged ...
```

**Note:** Replace `${GITHUB_REPOSITORY_OWNER}` with your GitHub username or organization.

### 4. Update GitHub Actions Workflow

#### 4.1 Replace `.github/workflows/deploy.yml`

```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main
  workflow_dispatch:

env:
  NODE_VERSION: '20'  # Match Dockerfile
  DOCKER_BUILDKIT: 1
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    name: Run Tests
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run TypeScript check
        run: npx tsc --noEmit
      
      - name: Run ESLint
        run: npm run lint
      
      - name: Build application (test)
        run: npm run build
        env:
          DATABASE_URL: postgresql://build_user:build_password@localhost:5432/build_database
          REDIS_URL: redis://localhost:6379
          NEXTAUTH_SECRET: build-time-secret-placeholder-min-32-chars-required
          NEXTAUTH_URL: http://localhost:3000
          NEXT_PUBLIC_APP_URL: http://localhost:3000
          SKIP_ENV_VALIDATION: "true"

  build-and-push:
    name: Build and Push Docker Image
    runs-on: ubuntu-latest
    needs: test
    permissions:
      contents: read
      packages: write
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=sha,prefix={{branch}}-
            type=raw,value=latest,enable={{is_default_branch}}
      
      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./Dockerfile
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          build-args: |
            BUILDKIT_INLINE_CACHE=1

  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: [test, build-and-push]
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup SSH
        uses: webfactory/ssh-agent@v0.9.0
        with:
          ssh-private-key: ${{ secrets.SSH_PRIVATE_KEY }}
      
      - name: Add server to known hosts
        run: |
          mkdir -p ~/.ssh
          ssh-keyscan -H ${{ secrets.SERVER_HOST }} >> ~/.ssh/known_hosts
      
      - name: Deploy to server
        env:
          SERVER_HOST: ${{ secrets.SERVER_HOST }}
          SERVER_USER: ${{ secrets.SERVER_USER }}
          DEPLOY_PATH: ${{ secrets.DEPLOY_PATH }}
          IMAGE_NAME: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          IMAGE_TAG: latest
        run: |
          echo "🚀 Starting deployment to production..."
          
          # Sync only necessary files (no source code needed for build)
          rsync -avz --delete \
            --exclude 'node_modules' \
            --exclude '.next' \
            --exclude '.git' \
            --exclude '.env*' \
            --exclude '*.log' \
            --exclude 'coverage' \
            --exclude '.DS_Store' \
            --include 'config/docker-compose.server.yml' \
            --include 'scripts/' \
            --include 'scripts/*' \
            ./ ${SERVER_USER}@${SERVER_HOST}:${DEPLOY_PATH}/
          
          # Execute deployment on server
          ssh ${SERVER_USER}@${SERVER_HOST} << 'ENDSSH'
            set -e
            cd ${DEPLOY_PATH}
            
            echo "📦 Pulling latest Docker image..."
            docker compose -f config/docker-compose.server.yml pull
            
            echo "🔄 Updating services..."
            docker compose -f config/docker-compose.server.yml up -d --remove-orphans
            
            echo "⏳ Waiting for application to start..."
            sleep 10
            
            # Wait for health check
            for i in {1..30}; do
              if curl -f -s http://localhost:3456/api/health >/dev/null 2>&1; then
                echo "✅ Application is healthy!"
                break
              fi
              if [ $i -eq 30 ]; then
                echo "❌ Health check failed after 30 attempts"
                exit 1
              fi
              sleep 2
            done
            
            echo "✅ Deployment complete!"
          ENDSSH
      
      - name: Verify deployment
        env:
          SERVER_HOST: ${{ secrets.SERVER_HOST }}
          SERVER_USER: ${{ secrets.SERVER_USER }}
          DEPLOY_PATH: ${{ secrets.DEPLOY_PATH }}
          APP_URL: ${{ secrets.APP_URL }}
        run: |
          echo "🔍 Verifying deployment..."
          
          ssh ${SERVER_USER}@${SERVER_HOST} << ENDSSH
            cd ${DEPLOY_PATH}
            if [ -f scripts/verify-deployment.sh ]; then
              ./scripts/verify-deployment.sh ${APP_URL}
            else
              echo "⚠️ Verification script not found, skipping..."
            fi
          ENDSSH
      
      - name: Notify on success
        if: success()
        run: |
          echo "✅ Deployment successful!"
          echo "Deployed commit: ${{ github.sha }}"
          echo "Deployed by: ${{ github.actor }}"
          echo "Image: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}"
      
      - name: Notify on failure
        if: failure()
        run: |
          echo "❌ Deployment failed!"
          echo "Failed commit: ${{ github.sha }}"
          echo "Check logs for details"

  rollback:
    name: Rollback (Manual)
    runs-on: ubuntu-latest
    if: github.event_name == 'workflow_dispatch'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup SSH
        uses: webfactory/ssh-agent@v0.9.0
        with:
          ssh-private-key: ${{ secrets.SSH_PRIVATE_KEY }}
      
      - name: Add server to known hosts
        run: |
          mkdir -p ~/.ssh
          ssh-keyscan -H ${{ secrets.SERVER_HOST }} >> ~/.ssh/known_hosts
      
      - name: Rollback deployment
        env:
          SERVER_HOST: ${{ secrets.SERVER_HOST }}
          SERVER_USER: ${{ secrets.SERVER_USER }}
          DEPLOY_PATH: ${{ secrets.DEPLOY_PATH }}
          IMAGE_NAME: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
        run: |
          echo "⏪ Rolling back deployment..."
          
          ssh ${SERVER_USER}@${SERVER_HOST} << 'ENDSSH'
            cd ${DEPLOY_PATH}
            
            # Get previous image tag (you can specify this as input)
            PREVIOUS_TAG=${INPUT_PREVIOUS_TAG:-"previous"}
            
            echo "Rolling back to: ${IMAGE_NAME}:${PREVIOUS_TAG}"
            
            # Update docker-compose to use previous image
            sed -i "s|image:.*|image: ${IMAGE_NAME}:${PREVIOUS_TAG}|" config/docker-compose.server.yml
            
            docker compose -f config/docker-compose.server.yml pull
            docker compose -f config/docker-compose.server.yml up -d
            
            echo "✅ Rollback complete!"
          ENDSSH
```

### 5. Update Manual Deploy Script (Optional)

If you still want a manual deploy script, update `scripts/deploy.sh`:

```bash
#!/bin/bash

# Manual deployment script - pulls from registry
set -e

SERVER="${SERVER:-klarc}"
REMOTE_DIR="~/production/json-viewer-io"
IMAGE_NAME="ghcr.io/your-username/json-viewer-io:latest"

log() {
    echo "$(date '+%H:%M:%S') $1"
}

log "Starting deployment..."

# Sync docker-compose and scripts only
rsync -av --delete \
    --include 'config/docker-compose.server.yml' \
    --include 'scripts/' \
    --include 'scripts/*' \
    --exclude '*' \
    . ${SERVER}:${REMOTE_DIR}/

# Deploy on server
ssh ${SERVER} << EOF
cd ${REMOTE_DIR}

log "Pulling latest image..."
docker compose -f config/docker-compose.server.yml pull

log "Updating services..."
docker compose -f config/docker-compose.server.yml up -d --remove-orphans

log "Waiting for health check..."
for i in {1..30}; do
    if curl -f -s http://localhost:3456/api/health >/dev/null 2>&1; then
        echo "✅ Application is healthy!"
        break
    fi
    sleep 2
done

log "Deployment complete!"
EOF
```

### 6. Server Setup

#### 6.1 Install Docker on Server

```bash
# On Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 6.2 Authenticate with GHCR (if private)

```bash
# Login to GHCR
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
```

**Note:** For public repositories, no authentication needed.

#### 6.3 Create Deployment Directory

```bash
mkdir -p ~/production/json-viewer-io
cd ~/production/json-viewer-io

# Create .env file (DO NOT commit this)
touch .env
# Add your environment variables
```

### 7. First Deployment

1. **Push to main branch** - This triggers the workflow
2. **Monitor GitHub Actions** - Watch the deployment progress
3. **Verify deployment** - Check `https://json-viewer.io/api/health`

## Deployment Flow

### Automatic (Recommended)

1. Developer pushes to `main` branch
2. GitHub Actions runs tests
3. GitHub Actions builds Docker image
4. Image is pushed to GHCR with tags:
   - `latest` (always latest main branch)
   - `main-{SHA}` (specific commit)
5. Server pulls latest image
6. Docker Compose updates services
7. Health check verifies deployment

### Manual Rollback

1. Go to GitHub Actions
2. Select "Rollback" workflow
3. Run workflow manually
4. Specify previous image tag (e.g., `main-abc1234`)

## Benefits

✅ **Fast**: Deployments take ~30 seconds (vs 5-10 minutes)  
✅ **Reliable**: Image built once, tested before deployment  
✅ **Versioned**: Every deployment has a unique image tag  
✅ **Rollback**: Easy rollback to any previous image  
✅ **Clean**: No Node.js or build tools needed on server  
✅ **Scalable**: Same image can run on multiple servers  

## Troubleshooting

### Image Not Found

```bash
# Check if image exists in registry
docker pull ghcr.io/username/json-viewer-io:latest

# If private, ensure you're authenticated
docker login ghcr.io
```

### Health Check Fails

```bash
# Check container logs
docker compose -f config/docker-compose.server.yml logs app

# Check health endpoint manually
curl http://localhost:3456/api/health
```

### Environment Variables Missing

```bash
# Verify .env file exists and has required vars
cd ~/production/json-viewer-io
cat .env | grep -E "DATABASE_URL|REDIS_URL|NEXTAUTH_SECRET"
```

## Next Steps

1. ✅ Test in staging environment first
2. ✅ Monitor first few deployments closely
3. ✅ Set up alerts for deployment failures
4. ✅ Document any custom configurations
5. ✅ Train team on new deployment process

