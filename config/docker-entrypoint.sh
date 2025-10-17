#!/bin/sh
set -e

echo "🚀 Starting JSON Viewer application..."

# Run database migrations
echo "🔄 Running database migrations..."

# Wait for database to be ready
echo "⏳ Waiting for database connection..."
max_attempts=30
attempt=0

until npx prisma db execute --stdin <<< "SELECT 1" > /dev/null 2>&1; do
  attempt=$((attempt + 1))
  if [ $attempt -ge $max_attempts ]; then
    echo "❌ Database connection timeout after ${max_attempts} attempts"
    exit 1
  fi
  echo "⏳ Waiting for database... (attempt $attempt/$max_attempts)"
  sleep 2
done

echo "✅ Database connection established"

# Run Prisma migrations
echo "📦 Applying Prisma migrations..."
if npx prisma migrate deploy; then
  echo "✅ Database migrations completed successfully"
else
  echo "❌ Database migrations failed!"
  exit 1
fi

echo "✅ Database setup complete!"

# Start the application
echo "🎯 Starting Next.js application..."
exec node server.js