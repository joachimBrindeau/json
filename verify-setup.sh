#!/bin/bash

echo "========================================="
echo "  JSON Viewer Setup Verification"
echo "========================================="
echo ""

# Check Docker containers
echo "1. Docker Containers Status:"
docker ps --filter "name=json-viewer" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "   ❌ Docker not running or containers not found"
echo ""

# Check PostgreSQL connection
echo "2. PostgreSQL Connection:"
docker exec json-viewer-io-postgres-1 pg_isready -U json_viewer_user -d json_viewer 2>/dev/null && echo "   ✅ PostgreSQL is ready" || echo "   ❌ PostgreSQL not accessible"
echo ""

# Check Redis connection
echo "3. Redis Connection:"
docker exec json-viewer-io-redis-1 redis-cli ping 2>/dev/null | grep -q PONG && echo "   ✅ Redis is ready" || echo "   ❌ Redis not accessible"
echo ""

# Check dev server
echo "4. Development Server:"
curl -s -o /dev/null -w "   Status: %{http_code}\n" http://localhost:3456 2>/dev/null || echo "   ❌ Server not responding"
echo ""

# Check database tables
echo "5. Database Tables:"
docker exec json-viewer-io-postgres-1 psql -U json_viewer_user -d json_viewer -c "\dt" 2>/dev/null | grep -q "jsonDocument" && echo "   ✅ Database schema initialized" || echo "   ⚠️  Database schema may not be initialized"
echo ""

echo "========================================="
echo "  Setup Complete!"
echo "========================================="
echo ""
echo "Access your application at:"
echo "  🌐 http://localhost:3456"
echo ""
echo "Database connections:"
echo "  🐘 PostgreSQL: localhost:5433"
echo "  🔴 Redis: localhost:6379"
echo ""

