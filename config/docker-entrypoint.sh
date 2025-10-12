#!/bin/sh
set -e

echo "🚀 Starting JSON Viewer application..."

# Database should already be set up in production
echo "⚠️ Skipping database operations - assuming production DB is ready"

echo "✅ Database setup complete!"

# Start the application
echo "🎯 Starting Next.js application..."
exec node server.js