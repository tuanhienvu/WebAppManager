#!/usr/bin/env node
/**
 * Build script for static export
 * Automatically uses production API URL if localhost is detected
 */

const { execSync } = require('child_process');

// Get current API URL from environment
const currentApiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

// Check if it's localhost or not set, use production URL
const isLocalhost = currentApiUrl.includes('localhost') || 
                    currentApiUrl.includes('127.0.0.1') || 
                    currentApiUrl === 'http://localhost:5000';

const apiUrl = isLocalhost ? 'https://wamapi.vuleits.com' : currentApiUrl;

console.log('🔨 Building static export...');
console.log(`📡 API URL: ${apiUrl}${isLocalhost ? ' (auto-set from localhost)' : ''}`);

// Build with production API URL
const command = `cross-env STATIC_EXPORT=true NEXT_PUBLIC_API_BASE_URL=${apiUrl} next build`;

try {
  execSync(command, { 
    stdio: 'inherit',
    env: { ...process.env, NEXT_PUBLIC_API_BASE_URL: apiUrl }
  });
  console.log('✅ Static export build complete!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

