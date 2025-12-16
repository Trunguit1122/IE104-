#!/bin/bash

# ========================================
# LingoLab Backend - Quick Start Script
# ========================================
# This script sets up everything for new developers

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo "========================================"
echo "  LingoLab Backend - Quick Start"
echo "========================================"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "📋 Creating .env file from .env.example..."
    cp .env.example .env
    echo "✅ .env file created"
else
    echo "✅ .env file already exists"
fi

# Stop any existing containers
echo ""
echo "🧹 Cleaning up existing containers..."
docker-compose -f docker-compose.dev.yml down -v 2>/dev/null || true

# Start PostgreSQL in Docker
echo ""
echo "🐳 Starting PostgreSQL database in Docker..."
docker-compose -f docker-compose.dev.yml up -d

# Wait for database to be ready
echo ""
echo "⏳ Waiting for database to be ready..."
RETRIES=30
until docker-compose -f docker-compose.dev.yml exec -T postgres pg_isready -U postgres -d lingolab_db > /dev/null 2>&1 || [ $RETRIES -eq 0 ]; do
    echo "   Waiting... ($RETRIES attempts remaining)"
    RETRIES=$((RETRIES-1))
    sleep 2
done

if [ $RETRIES -eq 0 ]; then
    echo "❌ Database failed to start. Check Docker logs:"
    echo "   docker-compose -f docker-compose.dev.yml logs postgres"
    exit 1
fi

echo "✅ Database is ready!"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo ""
    echo "📦 Installing npm dependencies..."
    npm install
else
    echo ""
    echo "✅ npm dependencies already installed"
fi

# Run migrations
echo ""
echo "🔄 Running database migrations..."
npm run migration:run

# Seed database
echo ""
echo "🌱 Seeding database with demo data..."
npm run seed

echo ""
echo "========================================"
echo "  ✅ Setup Complete!"
echo "========================================"
echo ""
echo "Database is running on: localhost:54321"
echo ""
echo "To start the backend server:"
echo "  npm run dev"
echo ""
echo "Demo accounts (password: Password123!):"
echo "  Admin:   admin@lingolab.com"
echo "  Teacher: teacher.john@lingolab.com"
echo "  Learner: learner.alice@example.com"
echo ""
echo "API Documentation: http://localhost:3000/docs"
echo ""
echo "To stop the database:"
echo "  docker-compose -f docker-compose.dev.yml down"
echo ""
