// Test the serverless function locally
const path = require('path');

console.log('🧪 Testing serverless function...');

// Simulate Vercel environment
process.env.NODE_ENV = 'production';
process.env.VERCEL = '1';
process.env.DB_HOST = 'test';
process.env.DB_DATABASE = 'test';

try {
  // Import the serverless function
  const handler = require('./api/index.js');
  
  console.log('✅ Serverless function loaded successfully');
  console.log('📋 Function type:', typeof handler);
  
  // Test with mock request/response
  const mockReq = {
    method: 'GET',
    url: '/',
    headers: {},
    originalUrl: '/'
  };
  
  const mockRes = {
    status: (code) => {
      console.log(`📊 Response status: ${code}`);
      return mockRes;
    },
    json: (data) => {
      console.log('✅ Response data:', JSON.stringify(data, null, 2));
      return mockRes;
    },
    end: () => {
      console.log('✅ Response ended');
      return mockRes;
    },
    header: (name, value) => {
      console.log(`📋 Header set: ${name} = ${value}`);
      return mockRes;
    },
    setHeader: (name, value) => {
      console.log(`📋 Header set: ${name} = ${value}`);
      return mockRes;
    },
    getHeader: (name) => {
      return undefined;
    },
    removeHeader: (name) => {
      console.log(`📋 Header removed: ${name}`);
      return mockRes;
    }
  };
  
  // Test the function
  console.log('🔄 Testing function execution...');
  handler(mockReq, mockRes);
  
  console.log('🎉 Serverless function test completed successfully!');
  
} catch (error) {
  console.error('❌ Serverless function test failed:', error);
  process.exit(1);
}
