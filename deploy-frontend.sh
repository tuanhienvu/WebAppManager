#!/bin/bash
# Frontend Deployment Script for MatBao
# Usage: ./deploy-frontend.sh

set -e

echo "🚀 Starting Frontend Deployment..."
echo ""
echo "Choose deployment method:"
echo "[1] Static Export (Recommended - No Node.js required)"
echo "[2] Standalone Server (Node.js required)"
echo ""
read -p "Enter choice (1 or 2): " choice

cd frontend

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Set production API URL
export NEXT_PUBLIC_API_BASE_URL=https://wamapi.vuleits.com

if [ "$choice" = "1" ]; then
  echo ""
  echo "🔨 Building static export..."
  npm run build:export
  
  echo "✅ Static export build complete!"
  echo ""
  echo "📋 Files to upload to MatBao (wam.vuleits.com):"
  echo "   - Upload ALL contents of frontend/out/ folder to web root"
  echo "   - Configure .htaccess or Nginx for SPA routing"
  echo "   - No Node.js server needed!"
elif [ "$choice" = "2" ]; then
  echo ""
  echo "🔨 Building standalone server..."
  npm run build
  
  echo "📦 Preparing standalone build..."
  rm -rf standalone-build
  mkdir -p standalone-build
  cp -r .next/standalone/* standalone-build/
  cp -r .next/static standalone-build/.next/static
  cp -r public standalone-build/public
  cp package.json standalone-build/
  
  echo "✅ Standalone build complete!"
  echo ""
  echo "📋 Files to upload to MatBao (wam.vuleits.com):"
  echo "   - standalone-build/ (entire folder)"
  echo ""
  echo "📝 After uploading, run on server:"
  echo "   cd standalone-build"
  echo "   npm install --production"
  echo "   node server.js"
else
  echo "Invalid choice. Exiting."
  exit 1
fi

