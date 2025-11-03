#!/bin/sh
set -e

echo "🚀 Starting JSON Viewer application..."

# Run database migrations (best-effort, do not block app start)
echo "🔄 Running database migrations (best-effort)..."

# Helper to check DB readiness
check_db() {
  printf "SELECT 1" | npx prisma db execute --stdin --url "$DATABASE_URL" > /dev/null 2>&1
}

# Try to wait for database, but give up after a while and continue
echo "⏳ Waiting for database connection (non-blocking after timeout)..."
max_attempts=20
attempt=0

if check_db; then
  echo "✅ Database connection established"
  echo "📦 Applying Prisma migrations..."
  if [ -f prisma/schema.prisma ]; then
    if npx prisma migrate deploy --schema prisma/schema.prisma; then
      echo "✅ Database migrations completed successfully"
    else
      echo "⚠️ Prisma migrations failed; continuing without blocking startup"
    fi
  else
    echo "ℹ️ Prisma schema not found; skipping migrations"
  fi
else
  until check_db; do
    attempt=$((attempt + 1))
    if [ $attempt -ge $max_attempts ]; then
      echo "⚠️ Database not reachable after ${max_attempts} attempts; starting app without DB"
      break
    fi
    echo "⏳ Waiting for database... (attempt $attempt/$max_attempts)"
    sleep 2
  done
  if [ $attempt -lt $max_attempts ]; then
    echo "✅ Database connection established"
    echo "📦 Applying Prisma migrations..."
    if [ -f prisma/schema.prisma ]; then
      if npx prisma migrate deploy --schema prisma/schema.prisma; then
        echo "✅ Database migrations completed successfully"
      else
        echo "⚠️ Prisma migrations failed; continuing without blocking startup"
      fi
    else
      echo "ℹ️ Prisma schema not found; skipping migrations"
    fi
  fi
fi

# Start the application
echo "🎯 Starting Next.js application..."
exec node server.js