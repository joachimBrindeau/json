#!/bin/bash
# Automatically set GitHub Actions secrets using GitHub CLI

set -e

echo "🔐 Setting up GitHub Actions Secrets"
echo "===================================="
echo ""

REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
echo "Repository: $REPO"
echo ""

# Check if SSH key exists
SSH_KEY_PATH="$HOME/.ssh/id_ed25519"
if [ ! -f "$SSH_KEY_PATH" ]; then
    echo "❌ SSH key not found at $SSH_KEY_PATH"
    exit 1
fi

echo "📝 Setting secrets..."
echo ""

# 1. SSH_PRIVATE_KEY
echo "1. Setting SSH_PRIVATE_KEY..."
gh secret set SSH_PRIVATE_KEY < "$SSH_KEY_PATH"
echo "   ✅ SSH_PRIVATE_KEY set"

# 2. SERVER_HOST
echo "2. Setting SERVER_HOST..."
echo "92.154.51.116" | gh secret set SERVER_HOST
echo "   ✅ SERVER_HOST set (92.154.51.116)"

# 3. SERVER_USER
echo "3. Setting SERVER_USER..."
echo "joachim" | gh secret set SERVER_USER
echo "   ✅ SERVER_USER set (joachim)"

# 4. DEPLOY_PATH
echo "4. Setting DEPLOY_PATH..."
echo "~/production/json-viewer-io" | gh secret set DEPLOY_PATH
echo "   ✅ DEPLOY_PATH set (~/production/json-viewer-io)"

# 5. APP_URL (optional)
echo "5. Setting APP_URL..."
echo "https://json-viewer.io" | gh secret set APP_URL
echo "   ✅ APP_URL set (https://json-viewer.io)"

echo ""
echo "✅ All secrets have been set successfully!"
echo ""
echo "🔍 Verify secrets:"
echo "   gh secret list"
echo ""
echo "🚀 Next step: Push to main branch to trigger deployment"
