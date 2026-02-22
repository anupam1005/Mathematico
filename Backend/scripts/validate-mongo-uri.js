const mongoose = require('mongoose');

/**
 * MongoDB URI Validation Script
 * Run this locally to diagnose connection issues before deployment
 */

function validateMongoURI() {
  const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI || '';
  
  console.log('=== MongoDB URI Validation ===');
  console.log('URI provided:', mongoURI ? 'YES' : 'NO');
  
  if (!mongoURI) {
    console.error('❌ MONGO_URI is missing');
    return false;
  }
  
  // Check URI format
  if (!mongoURI.startsWith('mongodb://') && !mongoURI.startsWith('mongodb+srv://')) {
    console.error('❌ Invalid URI format. Must start with mongodb:// or mongodb+srv://');
    return false;
  }
  
  // Parse URI components (basic check)
  try {
    const url = new URL(mongoURI);
    console.log('✅ URI format is valid');
    console.log('Protocol:', url.protocol);
    console.log('Username:', url.username ? 'PRESENT' : 'MISSING');
    console.log('Password:', url.password ? 'PRESENT' : 'MISSING');
    console.log('Hostname:', url.hostname);
    console.log('Database:', url.pathname.slice(1) || 'NOT_SPECIFIED');
    
    // Check for required query parameters
    const searchParams = new URLSearchParams(url.search);
    console.log('retryWrites:', searchParams.get('retryWrites') || 'NOT_SET');
    console.log('w parameter:', searchParams.get('w') || 'NOT_SET');
    
    // Expected format validation
    if (!url.username || !url.password) {
      console.warn('⚠️  Missing username or password in URI');
    }
    
    if (!url.hostname.includes('mongodb.net')) {
      console.warn('⚠️  Hostname does not appear to be MongoDB Atlas');
    }
    
    if (searchParams.get('retryWrites') !== 'true') {
      console.warn('⚠️  retryWrites=true is recommended');
    }
    
    if (searchParams.get('w') !== 'majority') {
      console.warn('⚠️  w=majority is recommended');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Failed to parse URI:', error.message);
    return false;
  }
}

async function testConnection() {
  console.log('\n=== Connection Test ===');
  
  if (!validateMongoURI()) {
    return;
  }
  
  try {
    console.log('Attempting to connect...');
    
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000
    });
    
    console.log('✅ Connection successful!');
    console.log('ReadyState:', mongoose.connection.readyState);
    console.log('Host:', mongoose.connection.host);
    console.log('Database:', mongoose.connection.name);
    
    await mongoose.connection.close();
    console.log('✅ Connection closed successfully');
    
  } catch (error) {
    console.error('❌ Connection failed:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
  }
}

// Run if called directly
if (require.main === module) {
  require('dotenv').config();
  testConnection();
}

module.exports = { validateMongoURI, testConnection };
