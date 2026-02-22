#!/usr/bin/env node

/**
 * MongoDB Connection Diagnostic Script
 * This script will help diagnose the exact MongoDB connection failure
 * Run this in production to capture the real error
 */

const mongoose = require('mongoose');

console.log('=== MongoDB Connection Diagnostic ===');
console.log('Node.js version:', process.version);
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Timestamp:', new Date().toISOString());

// Check environment variables
console.log('\n=== Environment Variables ===');
console.log('MONGO_URI defined:', !!process.env.MONGO_URI);
console.log('MONGODB_URI defined:', !!process.env.MONGODB_URI);
console.log('VERCEL:', process.env.VERCEL);
console.log('NODE_ENV:', process.env.NODE_ENV);

// Validate URI format
const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI || '';

if (!mongoURI) {
  console.error('\n❌ CRITICAL: MONGO_URI is not defined');
  console.error('Please set MONGO_URI environment variable in Vercel dashboard');
  process.exit(1);
}

console.log('\n=== URI Analysis ===');
console.log('URI starts with mongodb://:', mongoURI.startsWith('mongodb://'));
console.log('URI starts with mongodb+srv://:', mongoURI.startsWith('mongodb+srv://'));
console.log('URI length:', mongoURI.length);

// Parse URI safely (without exposing credentials)
try {
  const url = new URL(mongoURI);
  console.log('Protocol:', url.protocol);
  console.log('Hostname:', url.hostname);
  console.log('Port:', url.port || 'default');
  console.log('Database:', url.pathname.slice(1) || 'default');
  console.log('Has username:', !!url.username);
  console.log('Has password:', !!url.password);
  
  // Check for Atlas-specific patterns
  if (url.hostname.includes('mongodb.net')) {
    console.log('✅ Appears to be MongoDB Atlas');
  } else {
    console.log('⚠️  Hostname does not appear to be MongoDB Atlas');
  }
  
  // Check query parameters
  const searchParams = new URLSearchParams(url.search);
  console.log('Query parameters:');
  for (const [key, value] of searchParams) {
    console.log(`  ${key}: ${value}`);
  }
  
} catch (error) {
  console.error('❌ Failed to parse URI:', error.message);
  process.exit(1);
}

// Test connection with detailed error logging
async function testConnection() {
  console.log('\n=== Connection Test ===');
  
  try {
    console.log('Attempting connection with options:');
    console.log('  serverSelectionTimeoutMS: 10000');
    console.log('  socketTimeoutMS: 45000');
    
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000
    });
    
    console.log('✅ Connection successful!');
    console.log('ReadyState:', mongoose.connection.readyState);
    console.log('Host:', mongoose.connection.host);
    console.log('Database:', mongoose.connection.name);
    
    // Test a simple operation
    try {
      await mongoose.connection.db.admin().ping();
      console.log('✅ Database ping successful');
    } catch (pingError) {
      console.error('❌ Database ping failed:', pingError.message);
    }
    
    await mongoose.connection.close();
    console.log('✅ Connection closed successfully');
    
  } catch (error) {
    console.error('\n❌ CONNECTION FAILED');
    console.error('=== DETAILED ERROR ANALYSIS ===');
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    console.error('Error Code:', error.code);
    console.error('Error Type:', typeof error);
    
    // Common MongoDB error patterns
    if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.error('\n🔍 LIKELY CAUSE: DNS resolution failed');
      console.error('   - Check hostname in URI');
      console.error('   - Verify cluster name is correct');
    }
    
    if (error.message.includes('ECONNREFUSED')) {
      console.error('\n🔍 LIKELY CAUSE: Connection refused');
      console.error('   - Check if cluster is running');
      console.error('   - Verify port and firewall settings');
    }
    
    if (error.message.includes('authentication') || error.message.includes('auth')) {
      console.error('\n🔍 LIKELY CAUSE: Authentication failed');
      console.error('   - Check username and password');
      console.error('   - Verify user permissions in Atlas');
    }
    
    if (error.message.includes('timeout')) {
      console.error('\n🔍 LIKELY CAUSE: Connection timeout');
      console.error('   - Network connectivity issues');
      console.error('   - Cluster may be overloaded');
    }
    
    console.error('\n=== FULL ERROR OBJECT ===');
    console.error(JSON.stringify(error, null, 2));
    
    process.exit(1);
  }
}

// Run the test
testConnection();
