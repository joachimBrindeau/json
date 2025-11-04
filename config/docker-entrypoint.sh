#!/bin/sh
set -e

echo "🚀 Starting JSON Viewer application..."

# Validate required environment variables
validate_env() {
  echo "🔍 Validating environment variables..."
  
  required_vars="DATABASE_URL REDIS_URL NEXTAUTH_SECRET NEXTAUTH_URL"
  missing_vars=""
  
  for var in $required_vars; do
    eval value=\$$var
    if [ -z "$value" ]; then
      if [ -n "$missing_vars" ]; then
        missing_vars="$missing_vars, $var"
      else
        missing_vars="$var"
      fi
    fi
  done
  
  if [ -n "$missing_vars" ]; then
    echo "❌ ERROR: Missing required environment variables: $missing_vars"
    echo "Please ensure all required environment variables are set in your .env file"
    exit 1
  fi
  
  echo "✅ Environment variables validated"
}

validate_env

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
    if npx prisma db push --accept-data-loss --schema prisma/schema.prisma; then
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
      if npx prisma db push --accept-data-loss --schema prisma/schema.prisma; then
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