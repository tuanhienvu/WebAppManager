#!/bin/bash
# Backend Deployment Script for MatBao
# Usage: ./deploy-backend.sh

set -e

echo "🚀 Starting Backend Deployment..."

cd backend

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Build
echo "🔨 Building backend..."
npm run build

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate

echo "✅ Backend build complete!"
echo ""
echo "📋 Files to upload to MatBao (wamapi.vuleits.com):"
echo "   - dist/"
echo "   - prisma/"
echo "   - uploads/ (create if doesn't exist)"
echo "   - package.json"
echo "   - package-lock.json"
echo "   - .env (create with production values)"
echo ""
echo "📝 After uploading, run on server:"
echo "   npm install --production"
echo "   npx prisma migrate deploy"
echo "   node dist/server.js"

