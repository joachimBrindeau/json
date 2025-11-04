# Quick Setup Guide for Docker Registry Deployment

## ✅ What Was Changed

1. **Deleted duplicate Dockerfile** - Removed `/config/Dockerfile`, kept root `/Dockerfile`
2. **Added curl to Dockerfile** - For health checks
3. **Enhanced entrypoint** - Added environment variable validation
4. **Updated GitHub Actions** - Now builds and pushes to GHCR
5. **Updated docker-compose** - Uses registry images instead of building
6. **Updated deploy.sh** - Pulls images instead of building
7. **Fixed Node version** - Changed from 18 to 20 (matches Dockerfile)

## 🚀 Quick Start

### 1. Configure GitHub Repository

1. Go to your repository on GitHub
2. Navigate to **Settings → Actions → General**
3. Under "Workflow permissions", select **"Read and write permissions"**
4. This enables automatic GHCR authentication

### 2. Set GitHub Secrets

Go to **Settings → Secrets and variables → Actions** and add:

- `SSH_PRIVATE_KEY`: Your SSH private key for server access
- `SERVER_HOST`: Your server hostname/IP
- `SERVER_USER`: SSH username (e.g., `root` or your user)
- `DEPLOY_PATH`: Deployment directory (e.g., `~/production/json-viewer-io`)
- `APP_URL`: Your app URL (e.g., `https://json-viewer.io`)

### 3. Update docker-compose.server.yml

Edit `config/docker-compose.server.yml` and replace `YOUR_USERNAME` with your GitHub username:

```yaml
image: ghcr.io/YOUR_USERNAME/json-viewer-io:latest
```

For example, if your GitHub username is `johndoe`:
```yaml
image: ghcr.io/johndoe/json-viewer-io:latest
```

### 4. Update deploy.sh (Optional - for manual deployments)

If you use the manual deploy script, set your GitHub username:

```bash
export GITHUB_REPOSITORY_OWNER=your-username
```

Or edit the script directly:
```bash
GITHUB_REPOSITORY_OWNER="${GITHUB_REPOSITORY_OWNER:-your-username}"
```

### 5. First Deployment

1. **Push to main branch** - This triggers the workflow automatically
2. **Monitor GitHub Actions** - Watch the deployment progress
3. **Verify deployment** - Check your app URL

## 📋 How It Works Now

### Automatic Deployment (Recommended)

1. Push code to `main` branch
2. GitHub Actions runs tests
3. GitHub Actions builds Docker image
4. Image is pushed to GHCR with tags:
   - `latest` (always latest main branch)
   - `main-{SHA}` (specific commit)
5. Server pulls latest image
6. Docker Compose updates services
7. Health check verifies deployment

### Manual Deployment

```bash
export GITHUB_REPOSITORY_OWNER=your-username
./scripts/deploy.sh
```

## 🔍 Verify Setup

1. **Check GitHub Actions** - Workflow should run on push to main
2. **Check GHCR** - Go to your repo → Packages → Should see `json-viewer-io` package
3. **Check Server** - SSH to server and run:
   ```bash
   docker images | grep json-viewer-io
   ```

## 🐛 Troubleshooting

### Image Not Found

**Error:** `Error response from daemon: pull access denied`

**Solution:** 
- For **public repos**: No action needed, should work automatically
- For **private repos**: Authenticate on server:
  ```bash
  echo $GITHUB_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin
  ```

### Image Name Wrong

**Error:** `manifest for ghcr.io/YOUR_USERNAME/json-viewer-io:latest not found`

**Solution:** 
1. Check your GitHub username is correct
2. Verify image exists: Go to repo → Packages → json-viewer-io
3. Check image tags match

### Health Check Fails

**Error:** Health check times out

**Solution:**
1. Check container logs: `docker compose -f config/docker-compose.server.yml logs app`
2. Verify environment variables in `.env` file
3. Check database/redis connections

## 📚 Additional Resources

- [Full Deployment Guide](./deployment-guide.md)
- [Deployment Audit](./deployment-audit.md)

## 🎉 Benefits

✅ **Fast deployments** - ~30 seconds (vs 5-10 minutes)  
✅ **Versioned images** - Easy rollback to any commit  
✅ **No server build** - No Node.js needed on server  
✅ **Clean architecture** - Industry-standard approach  
✅ **Free** - Stays within GitHub free tiers for most projects  

