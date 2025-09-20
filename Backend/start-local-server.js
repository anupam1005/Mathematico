#!/usr/bin/env node

/**
 * Local Backend Server Startup Script
 * This script helps start the local backend server for mobile app development
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting Mathematico Backend Server...\n');

// Check if we're in the Backend directory
const currentDir = process.cwd();
const serverPath = path.join(currentDir, 'server.js');

if (!fs.existsSync(serverPath)) {
  console.error('❌ Error: server.js not found in current directory');
  console.error('Please run this script from the Backend directory');
  process.exit(1);
}

// Check if node_modules exists
const nodeModulesPath = path.join(currentDir, 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('📦 Installing dependencies...');
  const install = spawn('npm', ['install'], { 
    stdio: 'inherit',
    cwd: currentDir 
  });
  
  install.on('close', (code) => {
    if (code === 0) {
      startServer();
    } else {
      console.error('❌ Failed to install dependencies');
      process.exit(1);
    }
  });
} else {
  startServer();
}

function startServer() {
  console.log('🔧 Starting server...');
  console.log('📱 Mobile app should connect to:');
  console.log('   - Android Emulator: http://10.0.2.2:5000');
  console.log('   - Physical Device: http://[YOUR_IP]:5000');
  console.log('   - iOS Simulator: http://localhost:5000');
  console.log('');
  console.log('🌐 API Endpoints:');
  console.log('   - Auth: http://localhost:5000/api/v1/auth');
  console.log('   - Admin: http://localhost:5000/api/v1/admin');
  console.log('   - Student: http://localhost:5000/api/v1');
  console.log('');
  console.log('📋 Test credentials:');
  console.log('   - Admin: dc2006089@gmail.com / Myname*321');
  console.log('   - User: any@email.com / anypassword');
  console.log('');
  console.log('Press Ctrl+C to stop the server\n');

  const server = spawn('node', ['server.js'], { 
    stdio: 'inherit',
    cwd: currentDir 
  });

  server.on('close', (code) => {
    console.log(`\n🛑 Server stopped with code ${code}`);
  });

  server.on('error', (err) => {
    console.error('❌ Failed to start server:', err);
  });
}
