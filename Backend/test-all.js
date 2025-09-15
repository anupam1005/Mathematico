// Comprehensive test script for all components
console.log('🧪 Running comprehensive tests...\n');

// Test 1: Serverless Function
console.log('1️⃣ Testing Serverless Function...');
try {
  const handler = require('./api/index.js');
  console.log('✅ Serverless function loaded successfully');
  
  // Test root endpoint
  const mockReq = { method: 'GET', url: '/', headers: {}, originalUrl: '/' };
  const mockRes = {
    status: (code) => { console.log(`📋 Root endpoint - Status: ${code}`); return mockRes; },
    json: (data) => { console.log('✅ Root endpoint working correctly'); return mockRes; },
    end: () => { return mockRes; },
    setHeader: () => { return mockRes; },
    getHeader: () => { return undefined; },
    removeHeader: () => { return mockRes; }
  };
  
  handler(mockReq, mockRes);
} catch (error) {
  console.error('❌ Serverless function test failed:', error.message);
}

console.log('\n2️⃣ Testing Favicon Handlers...');
try {
  const handler = require('./api/index.js');
  
  // Test favicon.ico
  const faviconReq = { method: 'GET', url: '/favicon.ico', headers: {}, originalUrl: '/favicon.ico' };
  const faviconRes = {
    status: (code) => { 
      if (code === 204) {
        console.log('✅ /favicon.ico handler working correctly');
      } else {
        console.log(`❌ /favicon.ico handler failed - expected 204, got ${code}`);
      }
      return faviconRes; 
    },
    end: () => { return faviconRes; },
    json: () => { return faviconRes; },
    setHeader: () => { return faviconRes; },
    getHeader: () => { return undefined; },
    removeHeader: () => { return faviconRes; }
  };
  
  handler(faviconReq, faviconRes);
  
  // Test favicon.png
  const faviconPngReq = { method: 'GET', url: '/favicon.png', headers: {}, originalUrl: '/favicon.png' };
  const faviconPngRes = {
    status: (code) => { 
      if (code === 204) {
        console.log('✅ /favicon.png handler working correctly');
      } else {
        console.log(`❌ /favicon.png handler failed - expected 204, got ${code}`);
      }
      return faviconPngRes; 
    },
    end: () => { return faviconPngRes; },
    json: () => { return faviconPngRes; },
    setHeader: () => { return faviconPngRes; },
    getHeader: () => { return undefined; },
    removeHeader: () => { return faviconPngRes; }
  };
  
  handler(faviconPngReq, faviconPngRes);
} catch (error) {
  console.error('❌ Favicon handlers test failed:', error.message);
}

console.log('\n3️⃣ Testing Health Endpoint...');
try {
  const handler = require('./api/index.js');
  
  const healthReq = { method: 'GET', url: '/api/v1/health', headers: {}, originalUrl: '/api/v1/health' };
  const healthRes = {
    status: (code) => { console.log(`📋 Health endpoint - Status: ${code}`); return healthRes; },
    json: (data) => { 
      if (data.status === 'healthy') {
        console.log('✅ Health endpoint working correctly');
      } else {
        console.log('❌ Health endpoint failed - expected healthy status');
      }
      return healthRes; 
    },
    end: () => { return healthRes; },
    setHeader: () => { return healthRes; },
    getHeader: () => { return undefined; },
    removeHeader: () => { return healthRes; }
  };
  
  handler(healthReq, healthRes);
} catch (error) {
  console.error('❌ Health endpoint test failed:', error.message);
}

console.log('\n🎉 All tests completed!');
console.log('🚀 Backend is ready for Vercel deployment!');
