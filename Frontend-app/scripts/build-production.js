#!/usr/bin/env node

/**
 * Production Build Script for Mathematico Frontend
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Mathematico Frontend Production Build...\n');

// API is hardcoded in the app, but we define it here for checks
const API_BASE_URL = "https://api.mathematico.in";

// Verify API connectivity
console.log('🔍 Verifying API connectivity...');
try {
  const healthUrl = `${API_BASE_URL.replace(/\/+$/, '')}/api/v1/auth/health`;
  const response = execSync(`curl -f -s -o /dev/null -w "%{http_code}" "${healthUrl}"`, {
    timeout: 10000,
    stdio: 'pipe'
  });
  
  if (response.toString() !== '200') {
    console.warn(`⚠️ API health check returned status: ${response.toString()}`);
  } else {
    console.log('✅ API is healthy');
  }
} catch (error) {
  console.warn('⚠️ Could not verify API connectivity, continuing build...');
}

// Clean previous builds
console.log('🧹 Cleaning previous builds...');
try {
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
  }
  if (fs.existsSync('node_modules/.cache')) {
    fs.rmSync('node_modules/.cache', { recursive: true, force: true });
  }
  console.log('✅ Build cache cleared');
} catch (error) {
  console.warn('⚠️ Could not clear cache:', error.message);
}

// Install dependencies
console.log('📦 Installing dependencies...');
try {
  execSync('npm ci --production=false', { stdio: 'inherit' });
  console.log('✅ Dependencies installed');
} catch (error) {
  console.error('❌ Failed to install dependencies');
  process.exit(1);
}

// Run type checking
console.log('🔍 Running type checking...');
try {
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  console.log('✅ Type checking passed');
} catch (error) {
  console.warn('⚠️ Type checking failed, but continuing build...');
}

// Build for Android Production
console.log('🏗️ Building Android Production APK/AAB...');
try {
  // Build Android App Bundle (recommended for Play Store)
  execSync('eas build --platform android --profile production --non-interactive', { 
    stdio: 'inherit',
    timeout: 600000 // 10 minutes timeout
  });
  console.log('✅ Android build completed successfully');
} catch (error) {
  console.error('❌ Android build failed');
  console.error('   Make sure EAS is configured: eas build:configure');
  process.exit(1);
}

// Create build info file
const buildInfo = {
  timestamp: new Date().toISOString(),
  version: require('../package.json').version,
  environment: process.env.NODE_ENV || 'production',
  apiBaseUrl: API_BASE_URL,
  buildType: 'production',
  platform: 'android'
};

fs.writeFileSync(
  path.join(__dirname, '../build-info.json'),
  JSON.stringify(buildInfo, null, 2)
);

console.log('\n🎉 Mathematico Frontend Production Build Completed!');
console.log('📱 Build artifacts are available in your EAS dashboard');
console.log('📋 Build info saved to build-info.json');
console.log('\nNext steps:');
console.log('1. Download the build from EAS dashboard');
console.log('2. Test the APK/AAB thoroughly');
console.log('3. Submit to Google Play Store if ready');
