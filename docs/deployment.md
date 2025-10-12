# 🚀 JSON Viewer Deployment Guide

Complete guide for deploying and managing the JSON Viewer application in production.

## Table of Contents
- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Initial Deployment](#initial-deployment)
- [Updating Deployments](#updating-deployments)
- [Application Stack](#application-stack)
- [Configuration](#configuration)
- [Database Management](#database-management)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

### One-Command Deployment

Deploy everything with a single command:

```bash
./scripts/deploy-automated.sh
```

This automated script will:
- ✅ Test your local build
- ✅ Upload code to your server
- ✅ Generate secure passwords automatically
- ✅ Deploy with Docker Compose
- ✅ Run database migrations
- ✅ Seed SEO data
- ✅ Run health checks
- ✅ Show you the final status

---

## Prerequisites

### Server Requirements
- Ubuntu 24.04.3 LTS (or similar)
- Docker & Docker Compose installed
- SSH key authentication configured
- Rsync installed (usually pre-installed)

### Current Production Setup
- **Domain**: json-viewer.io → Port 3456
- **Reverse Proxy**: Caddy (handles SSL automatically)
- **Server**: 92.154.51.116
- **User**: joachim

---

## Initial Deployment

### Step 1: Prepare Server Directories

```bash
# SSH into your server
ssh joachim@92.154.51.116

# Create directory structure
mkdir -p ~/production/json-viewer-io/{config,data/postgres,data/redis}
chmod 700 ~/production/json-viewer-io/data/{postgres,redis}
```

### Step 2: Upload Application Code

```bash
# From your local machine
rsync -av --exclude node_modules --exclude .next --exclude .git \
  ./json-viewer-io/ joachim@92.154.51.116:~/production/json-viewer-io/
```

### Step 3: Configure Environment

```bash
# On server
cd ~/production/json-viewer-io
cp config/.env.server.caddy .env

# Generate secure secrets
export POSTGRES_PASSWORD=$(openssl rand -base64 32)
export NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Edit .env with your values
nano .env
```

### Step 4: Deploy with Docker Compose

```bash
# Build and start containers
docker-compose -f config/docker-compose.server.yml up -d --build

# Wait for containers to start (30 seconds)
sleep 30

# Run database migrations
docker exec -it json-viewer-app npx prisma migrate deploy

# Seed SEO data
docker exec -it json-viewer-app npx tsx scripts/seed-seo.ts
```

### Step 5: Verify Deployment

```bash
# Check health endpoint
curl https://json-viewer.io/api/health

# View application logs
docker logs json-viewer-app --tail 50
```

---

## Updating Deployments

### Quick Update (Recommended)

```bash
# One command to update everything
./scripts/deploy-automated.sh
```

The automated update process:
1. Tests local build first
2. Uploads only changed files (fast rsync)
3. Preserves existing environment/secrets
4. Rebuilds containers with new code
5. Runs any new database migrations
6. Preserves all your data
7. Performs zero-downtime rolling update

### Manual Update Process

If you need more control:

```bash
# 1. Make your changes locally
nano components/some-component.tsx

# 2. Test locally
npm run build
npm run dev

# 3. Upload changes
rsync -av --exclude node_modules --exclude .next --exclude .git \
  ./ joachim@92.154.51.116:~/production/json-viewer-io/

# 4. Rebuild and restart on server
ssh joachim@92.154.51.116 << 'EOF'
cd ~/production/json-viewer-io
docker-compose -f config/docker-compose.server.yml up -d --build
EOF

# 5. Verify update
curl https://json-viewer.io/api/health
```

### Database Migrations

When you have schema changes:

```bash
# 1. Create migration locally
npx prisma migrate dev --name your_change_description

# 2. Deploy (migrations run automatically)
./scripts/deploy-automated.sh

# Or manually run migrations on server
ssh joachim@92.154.51.116 \
  'docker exec -it json-viewer-app npx prisma migrate deploy'
```

---

## Application Stack

### 🏗️ Components

- **Next.js 15.5.2** - Application framework
- **PostgreSQL 16** - Primary database
- **Redis 7** - High-performance caching
- **Docker Compose** - Container orchestration
- **Caddy** - Reverse proxy with automatic SSL

### 🛡️ Security Features

- Auto-generated secrets for database and auth
- Superadmin system (joachim.brindeau@klarc.com only)
- Database persistence across deployments
- Secure password hashing with NextAuth

### 🎯 Key Features

- Database-driven SEO (all meta tags in database)
- Dynamic llms.txt endpoint for AI/LLM discovery
- Tag analytics with usage tracking
- Full user authentication system
- Real-time JSON processing and visualization

---

## Configuration

### Environment Variables

Key variables in `.env`:

```bash
# Database
POSTGRES_PASSWORD=your_secure_password
DATABASE_URL=postgresql://json_viewer_user:${POSTGRES_PASSWORD}@db:5432/json_viewer

# Authentication
NEXTAUTH_SECRET=your_generated_secret
NEXTAUTH_URL=https://json-viewer.io

# Application
NEXT_PUBLIC_APP_URL=https://json-viewer.io
NODE_ENV=production

# Redis
REDIS_URL=redis://redis:6379

# OAuth (optional)
GITHUB_ID=your_github_client_id
GITHUB_SECRET=your_github_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### Port Configuration

- **Application**: 3456 (internal)
- **Database**: 5432 (internal only)
- **Redis**: 6379 (internal only)
- **Public Access**: 443 (HTTPS via Caddy)

---

## Database Management

### Access Database Shell

```bash
# PostgreSQL shell
ssh joachim@92.154.51.116 \
  'docker exec -it json-viewer-db psql -U json_viewer_user -d json_viewer'
```

### Backup Database

```bash
# Create backup
ssh joachim@92.154.51.116 << 'EOF'
docker exec json-viewer-db pg_dump -U json_viewer_user json_viewer > \
  ~/backups/json-viewer-$(date +%Y%m%d-%H%M%S).sql
EOF
```

### Restore Database

```bash
# Restore from backup
ssh joachim@92.154.51.116 << 'EOF'
docker exec -i json-viewer-db psql -U json_viewer_user json_viewer < \
  ~/backups/json-viewer-20241012-120000.sql
EOF
```

### Data Persistence

Data is stored in persistent volumes:
- **PostgreSQL**: `~/production/json-viewer-io/data/postgres`
- **Redis**: `~/production/json-viewer-io/data/redis`

This ensures data survives container restarts and updates.

---

## Monitoring & Maintenance

### Health Checks

```bash
# Application health
curl https://json-viewer.io/api/health

# Continuous monitoring
watch -n 5 'curl -s https://json-viewer.io/api/health | jq'
```

### View Logs

```bash
# Application logs (last 50 lines)
ssh joachim@92.154.51.116 'docker logs json-viewer-app --tail 50'

# Follow logs in real-time
ssh joachim@92.154.51.116 'docker logs json-viewer-app -f'

# Database logs
ssh joachim@92.154.51.116 'docker logs json-viewer-db --tail 50'

# All services
ssh joachim@92.154.51.116 \
  'docker-compose -f ~/production/json-viewer-io/config/docker-compose.server.yml logs -f'
```

### Container Management

```bash
# View container status
ssh joachim@92.154.51.116 \
  'docker-compose -f ~/production/json-viewer-io/config/docker-compose.server.yml ps'

# Restart application only
ssh joachim@92.154.51.116 'docker restart json-viewer-app'

# Restart all services
ssh joachim@92.154.51.116 \
  'docker-compose -f ~/production/json-viewer-io/config/docker-compose.server.yml restart'

# Stop all services
ssh joachim@92.154.51.116 \
  'docker-compose -f ~/production/json-viewer-io/config/docker-compose.server.yml down'

# Start all services
ssh joachim@92.154.51.116 \
  'docker-compose -f ~/production/json-viewer-io/config/docker-compose.server.yml up -d'
```

---

## Troubleshooting

### Common Issues

#### Application Won't Start

```bash
# Check logs for errors
ssh joachim@92.154.51.116 'docker logs json-viewer-app'

# Verify environment variables
ssh joachim@92.154.51.116 'docker exec json-viewer-app env | grep -E "DATABASE|NEXTAUTH"'

# Rebuild containers
ssh joachim@92.154.51.116 \
  'cd ~/production/json-viewer-io && docker-compose -f config/docker-compose.server.yml up -d --build --force-recreate'
```

#### Database Connection Issues

```bash
# Check database is running
ssh joachim@92.154.51.116 'docker ps | grep json-viewer-db'

# Test database connection
ssh joachim@92.154.51.116 \
  'docker exec json-viewer-db pg_isready -U json_viewer_user'

# Check database logs
ssh joachim@92.154.51.116 'docker logs json-viewer-db --tail 100'
```

#### Performance Issues

```bash
# Check resource usage
ssh joachim@92.154.51.116 'docker stats --no-stream'

# Clear Redis cache
ssh joachim@92.154.51.116 'docker exec json-viewer-redis redis-cli FLUSHALL'

# Restart services
ssh joachim@92.154.51.116 'docker restart json-viewer-app json-viewer-redis'
```

### Rollback to Previous Version

```bash
# Quick rollback
ssh joachim@92.154.51.116 << 'EOF'
cd ~/production/json-viewer-io
docker-compose -f config/docker-compose.server.yml down
git checkout HEAD~1  # Go back one commit
docker-compose -f config/docker-compose.server.yml up -d --build
EOF
```

---

## Production URLs

After deployment, access your application at:

- **🌐 Main App**: https://json-viewer.io
- **🔍 Health Check**: https://json-viewer.io/api/health
- **📄 LLM Discovery**: https://json-viewer.io/llms.txt
- **⚙️ SEO Admin**: https://json-viewer.io/admin/seo
- **🛡️ Superadmin**: https://json-viewer.io/superadmin

---

## Best Practices

### Before Deploying
- ✅ Test locally with `npm run build`
- ✅ Run tests if available
- ✅ Commit changes to git
- ✅ Consider impact on users
- ✅ Review database migrations

### After Deploying
- ✅ Check health endpoint
- ✅ Test main functionality
- ✅ Monitor logs for errors
- ✅ Verify database migrations ran
- ✅ Test critical user flows

### Version Management

```bash
# Tag versions
git tag -a v1.1.0 -m "Added new feature"
git push origin v1.1.0

# Deploy specific version
git checkout v1.1.0
./scripts/deploy-automated.sh
```

---

**Ready to deploy? Run `./scripts/deploy-automated.sh` and watch the magic happen!** ✨

