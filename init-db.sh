#!/bin/bash

echo "Initializing database schema..."

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
  if docker exec json-viewer-io-postgres-1 pg_isready -U json_viewer_user -d json_viewer > /dev/null 2>&1; then
    echo "PostgreSQL is ready!"
    break
  fi
  echo "Waiting... ($i/30)"
  sleep 1
done

# Push the schema
echo "Pushing Prisma schema to database..."
npx prisma db push --accept-data-loss

echo ""
echo "Database initialization complete!"
echo "You can now access:"
echo "  - PostgreSQL: localhost:5433"
echo "  - Redis: localhost:6379"

