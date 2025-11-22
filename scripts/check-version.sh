#!/bin/bash
# Quick script to check if klarc is running the latest version

SERVER="${SERVER:-klarc}"
REMOTE_DIR="~/production/json-viewer-io"
GITHUB_REPOSITORY_OWNER="${GITHUB_REPOSITORY_OWNER:-joachimbrindeau}"
REPO_NAME="${REPO_NAME:-json}"
OWNER_LC=$(echo "${GITHUB_REPOSITORY_OWNER}" | tr '[:upper:]' '[:lower:]')
REPO_LC=$(echo "${REPO_NAME}" | tr '[:upper:]' '[:lower:]')
IMAGE_NAME="ghcr.io/${OWNER_LC}/${REPO_LC}:latest"

echo "🔍 Checking version on ${SERVER}..."
echo ""

# Get current running image
echo "📦 Current running image:"
ssh ${SERVER} "docker inspect \$(cd ${REMOTE_DIR} && docker compose -f config/docker-compose.server.yml ps -q app 2>/dev/null) 2>/dev/null | grep -oP '(?<=\"Image\": \")[^\"]+' | head -1" || echo "❌ Could not get running image"

echo ""
echo "📦 Expected image: ${IMAGE_NAME}"
echo ""

# Check if image exists locally on server
echo "🔎 Checking if latest image exists on server:"
ssh ${SERVER} "docker images ${IMAGE_NAME} --format '{{.Repository}}:{{.Tag}} {{.CreatedAt}}'" || echo "❌ Image not found locally"

echo ""
echo "💡 To deploy latest version, run: ./scripts/deploy.sh"
