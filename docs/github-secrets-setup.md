# GitHub Secrets Setup Guide

This guide shows you exactly what secrets need to be configured in GitHub Actions for automatic deployment.

## Required Secrets

Go to: **Settings → Secrets and variables → Actions** in your GitHub repository

### 1. SSH_PRIVATE_KEY
**Value:** Your SSH private key for server access

**How to get it:**
```bash
cat ~/.ssh/id_ed25519
```

**Important:** Copy the ENTIRE key including:
- `-----BEGIN OPENSSH PRIVATE KEY-----`
- All the key content
- `-----END OPENSSH PRIVATE KEY-----`

### 2. SERVER_HOST
**Value:** `92.154.51.116`

This is the IP address of your klarc server (from your SSH config).

### 3. SERVER_USER
**Value:** `joachim`

This is the SSH username (from your SSH config).

### 4. DEPLOY_PATH
**Value:** `~/production/json-viewer-io`

This is the deployment directory on the server.

### 5. APP_URL (Optional but recommended)
**Value:** `https://json-viewer.io`

This is used for external deployment verification. If not set, the workflow will skip external verification but still deploy successfully.

## Quick Setup Script

You can use this script to display the values you need (except the private key):

```bash
#!/bin/bash
echo "=== GitHub Secrets Values ==="
echo ""
echo "SERVER_HOST: 92.154.51.116"
echo "SERVER_USER: joachim"
echo "DEPLOY_PATH: ~/production/json-viewer-io"
echo "APP_URL: https://json-viewer.io"
echo ""
echo "SSH_PRIVATE_KEY: (run: cat ~/.ssh/id_ed25519)"
echo ""
echo "⚠️  Copy these values to GitHub: Settings → Secrets and variables → Actions"
```

## Verification

After setting up the secrets, the workflow will:
1. Build and push Docker image to GHCR
2. Automatically deploy to klarc server
3. Verify deployment health
4. Confirm success

## Troubleshooting

If deployment fails:
1. Check that `SSH_PRIVATE_KEY` includes the full key with headers
2. Verify `SERVER_HOST` is accessible: `ssh klarc 'echo OK'`
3. Ensure `DEPLOY_PATH` exists on server: `ssh klarc 'ls -la ~/production/json-viewer-io'`
4. Check GitHub Actions logs for specific error messages
