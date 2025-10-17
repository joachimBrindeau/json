# Complete Deployment Guide

**JSON Viewer - Production Deployment System**

This guide covers all deployment features including CI/CD, rollback, and monitoring.

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Manual Deployment](#manual-deployment)
3. [Automated CI/CD](#automated-cicd)
4. [Rollback](#rollback)
5. [Monitoring](#monitoring)
6. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### Prerequisites

- ✅ Node.js 18+ installed
- ✅ Docker and Docker Compose installed
- ✅ SSH access to production server
- ✅ `.env` file configured on server

### First-Time Setup

```bash
# 1. Clone repository
git clone <your-repo-url>
cd json-viewer-io

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.production.template .env
# Edit .env with your credentials

# 4. Test locally
npm run dev

# 5. Deploy to production
./scripts/deploy.sh
```

---

## 📦 Manual Deployment

### Using the Deploy Script

The simplest way to deploy:

```bash
./scripts/deploy.sh
```

**What it does:**
1. ✅ Creates backup of current deployment
2. ✅ Validates environment variables
3. ✅ Syncs code to server
4. ✅ Installs dependencies
5. ✅ Builds application
6. ✅ Runs database migrations
7. ✅ Starts Docker containers
8. ✅ Verifies deployment
9. ✅ Reports success/failure

**Expected time:** 5-8 minutes

### Manual Step-by-Step

If you need more control:

```bash
# 1. SSH into server
ssh joachim@92.154.51.116

# 2. Navigate to deployment directory
cd ~/production/json-viewer-io

# 3. Pull latest code
git pull origin main

# 4. Install dependencies
npm ci

# 5. Build application
npm run build

# 6. Deploy with Docker
DOCKER_BUILDKIT=1 docker compose -f config/docker-compose.server.yml up -d --build

# 7. Verify deployment
./scripts/verify-deployment.sh https://json-viewer.io
```

---

## 🤖 Automated CI/CD

### GitHub Actions Workflow

Every push to `main` triggers automatic deployment.

**Workflow Steps:**

1. **Test** (2-3 min)
   - TypeScript type checking
   - ESLint validation
   - Build verification

2. **Build Docker** (2-3 min)
   - Build Docker image with BuildKit
   - Cache layers for faster builds

3. **Deploy** (3-4 min)
   - Sync code to server
   - Build and deploy
   - Run migrations

4. **Verify** (1 min)
   - Health check
   - Page accessibility
   - Response time check

**Total time:** ~8-10 minutes

### Setting Up CI/CD

See [GITHUB_SECRETS_SETUP.md](./GITHUB_SECRETS_SETUP.md) for detailed instructions.

**Required secrets:**
- `SSH_PRIVATE_KEY` - SSH key for server access
- `SERVER_HOST` - Server IP (92.154.51.116)
- `SERVER_USER` - SSH username (joachim)
- `DEPLOY_PATH` - Deployment path
- `APP_URL` - Application URL

### Manual Trigger

You can manually trigger deployment:

1. Go to **Actions** tab in GitHub
2. Select **Deploy to Production**
3. Click **Run workflow**
4. Select branch and run

### Monitoring Workflow

View deployment progress:

1. Go to **Actions** tab
2. Click on running workflow
3. Watch real-time logs

---

## ⏪ Rollback

### Quick Rollback

Roll back to the previous deployment:

```bash
# On production server
cd ~/production/json-viewer-io
./scripts/rollback.sh 1
```

### Rollback to Specific Backup

```bash
# List available backups
./scripts/rollback.sh

# Output:
# [1] 2025-10-17 14:30:00 (commit: abc123)
# [2] 2025-10-17 12:15:00 (commit: def456)
# [3] 2025-10-16 18:45:00 (commit: ghi789)

# Rollback to backup #2
./scripts/rollback.sh 2
```

### What Rollback Does

1. ✅ Creates backup of current deployment
2. ✅ Stops application
3. ✅ Restores files from selected backup
4. ✅ Reinstalls dependencies
5. ✅ Rebuilds application
6. ✅ Starts application
7. ✅ Verifies health
8. ✅ Cleans up old backups (keeps last 5)

**Expected time:** 3-5 minutes

### Rollback via GitHub Actions

For automated rollback:

1. Go to **Actions** tab
2. Select **Deploy to Production**
3. Click **Run workflow**
4. This will trigger the rollback job

---

## 📊 Monitoring

### Health Check

Check if application is running:

```bash
curl https://json-viewer.io/api/health
# Expected: {"status":"ok"}
```

### Verification Script

Comprehensive verification:

```bash
./scripts/verify-deployment.sh https://json-viewer.io
```

**Checks:**
- ✅ Health endpoint
- ✅ Home page (/)
- ✅ Library page (/library)
- ✅ Editor page (/edit)
- ✅ Format page (/format)
- ✅ Compare page (/compare)
- ✅ Convert page (/convert)

### Continuous Monitoring

Run continuous monitoring with alerts:

```bash
# Basic monitoring (console only)
./scripts/monitor-deployment.sh https://json-viewer.io

# With Slack alerts
./scripts/monitor-deployment.sh https://json-viewer.io https://hooks.slack.com/your-webhook
```

**Features:**
- ✅ Health checks every 60 seconds
- ✅ Response time monitoring
- ✅ Page accessibility checks
- ✅ Docker container status
- ✅ Slack/webhook alerts
- ✅ Auto-recovery detection

### Setting Up Slack Alerts

1. Create Slack webhook:
   - Go to https://api.slack.com/apps
   - Create new app
   - Enable Incoming Webhooks
   - Copy webhook URL

2. Run monitoring with webhook:
   ```bash
   ./scripts/monitor-deployment.sh https://json-viewer.io YOUR_WEBHOOK_URL
   ```

3. Run as background service:
   ```bash
   nohup ./scripts/monitor-deployment.sh https://json-viewer.io YOUR_WEBHOOK_URL > monitor.log 2>&1 &
   ```

### Docker Container Logs

View application logs:

```bash
# All logs
docker compose -f config/docker-compose.server.yml logs

# Follow logs in real-time
docker compose -f config/docker-compose.server.yml logs -f

# Specific service
docker compose -f config/docker-compose.server.yml logs app

# Last 100 lines
docker compose -f config/docker-compose.server.yml logs --tail=100
```

### System Monitoring

Check system resources:

```bash
# Container stats
docker stats

# Disk usage
df -h

# Memory usage
free -h

# CPU usage
top
```

---

## 🔧 Troubleshooting

### Deployment Failed

**Check logs:**
```bash
# GitHub Actions logs
# Go to Actions tab → Click on failed workflow

# Server logs
ssh joachim@92.154.51.116
cd ~/production/json-viewer-io
docker compose -f config/docker-compose.server.yml logs
```

**Common issues:**
- Missing environment variables → Check `.env` file
- Port already in use → Stop existing containers
- Database connection failed → Check DATABASE_URL
- Build errors → Check TypeScript/ESLint errors

### Application Not Starting

**Check containers:**
```bash
docker compose -f config/docker-compose.server.yml ps
docker compose -f config/docker-compose.server.yml logs app
```

**Restart containers:**
```bash
docker compose -f config/docker-compose.server.yml restart
```

**Rebuild from scratch:**
```bash
docker compose -f config/docker-compose.server.yml down
docker compose -f config/docker-compose.server.yml up -d --build
```

### Database Issues

**Check database connection:**
```bash
docker compose -f config/docker-compose.server.yml exec postgres psql -U postgres -c "SELECT 1"
```

**Run migrations manually:**
```bash
npx prisma migrate deploy
```

**Reset database (⚠️ DANGER - deletes all data):**
```bash
npx prisma migrate reset --force
```

### Rollback Failed

**Manual rollback:**
```bash
# List backups
ls -la ~/production/json-viewer-io-backups/

# Manually restore
cd ~/production/json-viewer-io
rsync -a ~/production/json-viewer-io-backups/backup-YYYY-MM-DD-HH_MM_SS/ ./
npm ci
npm run build
docker compose -f config/docker-compose.server.yml up -d --build
```

### Performance Issues

**Check response times:**
```bash
curl -w "@-" -o /dev/null -s https://json-viewer.io << 'EOF'
time_namelookup:  %{time_namelookup}\n
time_connect:  %{time_connect}\n
time_starttransfer:  %{time_starttransfer}\n
time_total:  %{time_total}\n
EOF
```

**Check container resources:**
```bash
docker stats
```

**Optimize:**
- Clear old Docker images: `docker image prune -a`
- Clear build cache: `docker builder prune`
- Restart containers: `docker compose restart`

---

## 📈 Best Practices

### Before Deployment

- [ ] Test locally with `npm run dev`
- [ ] Run type check: `npx tsc --noEmit`
- [ ] Run linter: `npm run lint`
- [ ] Run tests: `npm test`
- [ ] Review changes: `git diff`
- [ ] Update version in `package.json`

### During Deployment

- [ ] Monitor GitHub Actions workflow
- [ ] Watch server logs
- [ ] Check health endpoint
- [ ] Verify critical pages
- [ ] Test key functionality

### After Deployment

- [ ] Run verification script
- [ ] Check application in browser
- [ ] Monitor for errors (first 10 minutes)
- [ ] Check response times
- [ ] Verify database migrations

### Regular Maintenance

- [ ] Review logs weekly
- [ ] Clean up old backups monthly
- [ ] Update dependencies monthly
- [ ] Review security patches
- [ ] Monitor disk space
- [ ] Rotate SSH keys quarterly

---

## 🎯 Quick Reference

### Common Commands

```bash
# Deploy
./scripts/deploy.sh

# Verify
./scripts/verify-deployment.sh https://json-viewer.io

# Rollback
./scripts/rollback.sh 1

# Monitor
./scripts/monitor-deployment.sh https://json-viewer.io

# Logs
docker compose -f config/docker-compose.server.yml logs -f

# Restart
docker compose -f config/docker-compose.server.yml restart

# Status
docker compose -f config/docker-compose.server.yml ps
```

### Important Files

- `.env` - Environment variables (server only, not in git)
- `.env.production.template` - Template for production env
- `scripts/deploy.sh` - Manual deployment script
- `scripts/rollback.sh` - Rollback script
- `scripts/verify-deployment.sh` - Verification script
- `scripts/monitor-deployment.sh` - Monitoring script
- `.github/workflows/deploy.yml` - CI/CD workflow

### Important Directories

- `~/production/json-viewer-io` - Deployment directory
- `~/production/json-viewer-io-backups` - Backup directory
- `.next` - Next.js build output
- `node_modules` - Dependencies

---

**Need help?** Check the logs, review this guide, or contact the team.

