// Test dedicated favicon handler
console.log('🧪 Testing dedicated favicon handler...');

// Load the dedicated favicon handler
let handler;
try {
  handler = require('./api/favicon.js');
  console.log('✅ Dedicated favicon handler loaded successfully');
} catch (error) {
  console.error('❌ Failed to load dedicated favicon handler:', error.message);
  process.exit(1);
}

// Test favicon requests
const faviconTests = ['/favicon.ico', '/favicon.png', '/favicon'];

faviconTests.forEach((path) => {
  const mockReq = {
    method: 'GET',
    url: path,
    headers: {},
    originalUrl: path
  };
  
  const mockRes = {
    status: (code) => {
      console.log(`📋 ${path} - Status: ${code}`);
      if (code === 204) {
        console.log(`✅ ${path} handler working correctly`);
      } else {
        console.log(`❌ ${path} handler failed - expected 204, got ${code}`);
      }
      return mockRes;
    },
    end: () => {
      return mockRes;
    },
    json: (data) => {
      console.log(`❌ ${path} handler failed - got JSON response instead of 204`);
      return mockRes;
    }
  };

  // Test the handler
  handler(mockReq, mockRes);
});

console.log('🎉 Dedicated favicon handler tests completed!');
