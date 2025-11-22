#!/bin/bash

# Script to delete failed GitHub Actions workflow runs
# Usage: ./scripts/cleanup-failed-workflows.sh
#
# Requires:
# - GitHub CLI (gh) installed and authenticated
# - Run: gh auth login (if not already authenticated)

set -e

echo "🧹 Cleaning up failed GitHub Actions workflow runs..."
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
  echo "❌ Error: GitHub CLI (gh) is not installed"
  echo "Install it from: https://cli.github.com/"
  exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
  echo "❌ Error: Not authenticated with GitHub CLI"
  echo "Run: gh auth login"
  exit 1
fi

# Get repository info
REPO=$(git remote get-url origin | sed -E 's/.*github.com[:/]([^/]+\/[^/]+)(\.git)?$/\1/')
echo "Repository: $REPO"
echo ""

# Get list of workflows
echo "📋 Fetching workflows..."
WORKFLOWS=$(gh api "/repos/$REPO/actions/workflows" --jq '.workflows[] | "\(.id)|\(.name)"')

if [ -z "$WORKFLOWS" ]; then
  echo "No workflows found"
  exit 0
fi

# Process each workflow
TOTAL_DELETED=0
while IFS='|' read -r workflow_id workflow_name; do
  echo ""
  echo "🔍 Processing: $workflow_name (ID: $workflow_id)"
  
  # Get failed runs for this workflow
  FAILED_RUNS=$(gh api "/repos/$REPO/actions/workflows/$workflow_id/runs?status=failure&per_page=100" --jq '.workflow_runs[] | "\(.id)|\(.created_at)|\(.conclusion)"')
  
  if [ -z "$FAILED_RUNS" ]; then
    echo "  ✅ No failed runs found"
    continue
  fi
  
  # Count failed runs
  FAILED_COUNT=$(echo "$FAILED_RUNS" | wc -l | tr -d ' ')
  echo "  Found $FAILED_COUNT failed run(s)"
  
  # Delete each failed run
  DELETED_COUNT=0
  echo "$FAILED_RUNS" | while IFS='|' read -r run_id created_at conclusion; do
    if [ -n "$run_id" ]; then
      echo "  🗑️  Deleting run $run_id (created: $created_at)"
      if gh api -X DELETE "/repos/$REPO/actions/runs/$run_id" &> /dev/null; then
        DELETED_COUNT=$((DELETED_COUNT + 1))
      else
        echo "    ⚠️  Failed to delete run $run_id"
      fi
    fi
  done
  
  TOTAL_DELETED=$((TOTAL_DELETED + FAILED_COUNT))
done <<< "$WORKFLOWS"

echo ""
echo "✅ Cleanup complete!"
echo "📊 Total failed runs processed: $TOTAL_DELETED"
echo ""
echo "ℹ️  Note: Deleted workflow runs may still appear in the UI for a short time"
echo "   but they will be permanently removed from GitHub's systems."
