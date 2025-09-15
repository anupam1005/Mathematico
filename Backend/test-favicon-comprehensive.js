// Comprehensive favicon test
console.log('🧪 Testing comprehensive favicon handling...');

// Load the serverless function
let handler;
try {
  handler = require('./api/index.js');
  console.log('✅ Serverless function loaded successfully');
} catch (error) {
  console.error('❌ Failed to load serverless function:', error.message);
  process.exit(1);
}

// Test all favicon variations
const faviconTests = [
  '/favicon.ico',
  '/favicon.png',
  '/favicon',
  '/favicon.gif',
  '/favicon.jpg',
  '/favicon.jpeg',
  '/favicon.svg',
  '/favicon.webp',
  '/favicon.whatever'
];

let passedTests = 0;
let totalTests = faviconTests.length;

faviconTests.forEach((path, index) => {
  const mockReq = {
    method: 'GET',
    url: path,
    headers: {},
    originalUrl: path
  };
  
  let statusCode = null;
  const mockRes = {
    status: (code) => {
      statusCode = code;
      if (code === 204) {
        console.log(`✅ ${path} - Status: ${code} (PASS)`);
        passedTests++;
      } else {
        console.log(`❌ ${path} - Status: ${code} (FAIL - expected 204)`);
      }
      return mockRes;
    },
    end: () => {
      if (statusCode === 204) {
        console.log(`✅ ${path} - Response ended with 204 (PASS)`);
      }
      return mockRes;
    },
    json: (data) => {
      console.log(`❌ ${path} - Got JSON response (FAIL - expected 204)`);
      return mockRes;
    },
    setHeader: () => { return mockRes; },
    getHeader: () => { return undefined; },
    removeHeader: () => { return mockRes; }
  };

  // Test the handler
  handler(mockReq, mockRes);
});

// Summary
console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`);
if (passedTests === totalTests) {
  console.log('🎉 All favicon tests passed!');
} else {
  console.log('❌ Some favicon tests failed!');
  process.exit(1);
}
