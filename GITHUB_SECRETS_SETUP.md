# GitHub Secrets Setup Guide

This guide explains how to configure GitHub secrets for automated deployments.

---

## 📋 Required Secrets

You need to configure the following secrets in your GitHub repository:

### 1. **SSH_PRIVATE_KEY**
- **Description:** Private SSH key for accessing the production server
- **How to get it:**
  ```bash
  # On your local machine, display your private key
  cat ~/.ssh/id_rsa
  # Or if you use a different key:
  cat ~/.ssh/id_ed25519
  ```
- **Value:** Copy the entire private key including `-----BEGIN ... KEY-----` and `-----END ... KEY-----`

### 2. **SERVER_HOST**
- **Description:** Production server hostname or IP address
- **Value:** `92.154.51.116` (your production server)

### 3. **SERVER_USER**
- **Description:** SSH username for the production server
- **Value:** `joachim` (your server username)

### 4. **DEPLOY_PATH**
- **Description:** Absolute path to the deployment directory on the server
- **Value:** `/home/joachim/production/json-viewer-io` (or your actual path)

### 5. **APP_URL**
- **Description:** Public URL of your application
- **Value:** `https://json-viewer.io` (your production URL)

---

## 🔧 How to Add Secrets to GitHub

### Step 1: Go to Repository Settings
1. Navigate to your GitHub repository
2. Click on **Settings** (top menu)
3. In the left sidebar, click **Secrets and variables** → **Actions**

### Step 2: Add Each Secret
For each secret listed above:

1. Click **New repository secret**
2. Enter the **Name** (exactly as shown above, e.g., `SSH_PRIVATE_KEY`)
3. Enter the **Value** (the actual secret value)
4. Click **Add secret**

---

## 🔑 SSH Key Setup (If Needed)

If you don't have an SSH key set up for the server, follow these steps:

### On Your Local Machine:

```bash
# 1. Generate a new SSH key (if you don't have one)
ssh-keygen -t ed25519 -C "github-actions@json-viewer-io"

# 2. Display the public key
cat ~/.ssh/id_ed25519.pub
```

### On Your Production Server:

```bash
# 1. SSH into the server
ssh joachim@92.154.51.116

# 2. Add the public key to authorized_keys
echo "YOUR_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys

# 3. Set correct permissions
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

### Test the Connection:

```bash
# From your local machine
ssh joachim@92.154.51.116 "echo 'SSH connection successful!'"
```

---

## ✅ Verification Checklist

Before triggering a deployment, verify:

- [ ] All 5 secrets are added to GitHub
- [ ] SSH key is added to server's `authorized_keys`
- [ ] SSH connection works without password prompt
- [ ] Deploy path exists on server: `/home/joachim/production/json-viewer-io`
- [ ] `.env` file exists on server with production credentials
- [ ] Docker and Docker Compose are installed on server
- [ ] Server has internet access to pull Docker images

---

## 🚀 Testing the Workflow

### Option 1: Manual Trigger (Recommended for First Test)

1. Go to **Actions** tab in GitHub
2. Select **Deploy to Production** workflow
3. Click **Run workflow**
4. Select branch: `main`
5. Click **Run workflow**

### Option 2: Push to Main Branch

```bash
# Make a small change and push
git add .
git commit -m "test: trigger deployment"
git push origin main
```

---

## 🔍 Monitoring the Deployment

### View Workflow Progress:

1. Go to **Actions** tab in GitHub
2. Click on the running workflow
3. Watch the logs in real-time

### Expected Steps:

1. ✅ **Test** - TypeScript, ESLint, Build
2. ✅ **Build Docker** - Build and cache Docker image
3. ✅ **Deploy** - Sync code, build, deploy
4. ✅ **Verify** - Check health and critical pages

### If Deployment Fails:

1. Check the workflow logs for error messages
2. SSH into the server to investigate
3. Check server logs: `docker compose -f config/docker-compose.server.yml logs`
4. Verify environment variables on server

---

## 🔒 Security Best Practices

### ✅ DO:
- Use separate SSH keys for GitHub Actions (not your personal key)
- Rotate SSH keys periodically
- Use strong passwords for server access
- Keep secrets in GitHub Secrets (never in code)
- Use `.env` files on server (never commit to git)

### ❌ DON'T:
- Share SSH private keys
- Commit secrets to git
- Use the same key for multiple services
- Store secrets in workflow files
- Give GitHub Actions more permissions than needed

---

## 🆘 Troubleshooting

### Problem: "Permission denied (publickey)"

**Solution:**
```bash
# Verify SSH key is added to server
ssh joachim@92.154.51.116 "cat ~/.ssh/authorized_keys"

# Test SSH connection
ssh -v joachim@92.154.51.116
```

### Problem: "Host key verification failed"

**Solution:**
The workflow automatically adds the server to known hosts. If this fails:
```bash
# Manually add to known hosts
ssh-keyscan -H 92.154.51.116 >> ~/.ssh/known_hosts
```

### Problem: "rsync: command not found"

**Solution:**
```bash
# Install rsync on server
ssh joachim@92.154.51.116
sudo apt-get update && sudo apt-get install -y rsync
```

### Problem: "Docker command not found"

**Solution:**
```bash
# Install Docker on server
ssh joachim@92.154.51.116
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker joachim
# Log out and back in for group changes to take effect
```

---

## 📊 Expected Results

After successful setup:

- ✅ Every push to `main` triggers automatic deployment
- ✅ Tests run before deployment (TypeScript, ESLint, Build)
- ✅ Docker image is built with caching
- ✅ Code is synced to server
- ✅ Application is built and deployed
- ✅ Deployment is verified automatically
- ✅ You receive success/failure notifications

**Deployment time:** ~5-8 minutes (down from 15-20 minutes manual)

---

## 🎯 Next Steps

After setting up secrets:

1. **Test the workflow** with a manual trigger
2. **Monitor the first deployment** closely
3. **Verify the application** is working correctly
4. **Set up notifications** (Slack, email, etc.) - See Phase 3
5. **Configure rollback** mechanism - See Phase 3

---

**Need help?** Check the workflow logs in GitHub Actions or SSH into the server to investigate issues.

