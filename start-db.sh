#!/bin/bash

echo "Stopping existing containers..."
docker-compose -f docker-compose.local.yml down

echo "Starting PostgreSQL and Redis..."
docker-compose -f docker-compose.local.yml up -d postgres redis

echo "Waiting for containers to be healthy..."
sleep 5

echo "Container status:"
docker-compose -f docker-compose.local.yml ps

echo ""
echo "Database is ready at localhost:5433"
echo "Redis is ready at localhost:6379"

