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

# Run database migrations using Prisma Migrate (safer than db push)
echo "🔄 Running database migrations..."

# Helper to check DB readiness
check_db() {
  printf "SELECT 1" | npx prisma db execute --stdin --url "$DATABASE_URL" > /dev/null 2>&1
}

# Wait for database with timeout
echo "⏳ Waiting for database connection..."
max_attempts=20
attempt=0

while ! check_db; do
  attempt=$((attempt + 1))
  if [ $attempt -ge $max_attempts ]; then
    echo "❌ ERROR: Database not reachable after ${max_attempts} attempts"
    echo "Please check your DATABASE_URL and ensure the database is running"
    exit 1
  fi
  echo "⏳ Waiting for database... (attempt $attempt/$max_attempts)"
  sleep 2
done

echo "✅ Database connection established"

# Check migration status and apply migrations
if [ -f prisma/schema.prisma ]; then
  echo "📦 Checking migration status..."
  
  # Check if migrations directory exists
  if [ -d prisma/migrations ]; then
    # Use migrate deploy (for production) - applies pending migrations
    if npx prisma migrate deploy --schema prisma/schema.prisma; then
      echo "✅ Database migrations completed successfully"
    else
      echo "❌ ERROR: Database migrations failed!"
      echo "Please check the migration files and database connection"
      exit 1
    fi
  else
    # No migrations directory - check if we should use db push as fallback
    echo "⚠️  No migrations directory found"
    echo "ℹ️  If this is a new database, you may need to run 'prisma migrate dev' first"
    echo "ℹ️  For production, migrations should be committed to the repository"
    # Don't use db push in production - it's unsafe
    echo "⚠️  Skipping migrations - database schema may be out of date"
  fi
else
  echo "ℹ️ Prisma schema not found; skipping migrations"
fi

# Start the application
echo "🎯 Starting Next.js application..."
exec node server.js