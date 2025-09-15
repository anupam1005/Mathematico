// Test favicon handlers directly with serverless function
console.log('🧪 Testing favicon handlers...');

// Load the serverless function
let handler;
try {
  handler = require('./api/index.js');
  console.log('✅ Serverless function loaded successfully');
} catch (error) {
  console.error('❌ Failed to load serverless function:', error.message);
  process.exit(1);
}

// Test favicon handlers
const testFavicon = (path) => {
  const mockReq = {
    method: 'GET',
    url: path,
    headers: {},
    originalUrl: path
  };
  
  const mockRes = {
    status: (code) => {
      console.log(`📋 ${path} - Status: ${code}`);
      return mockRes;
    },
    end: () => {
      console.log(`✅ ${path} handler working correctly`);
      return mockRes;
    },
    json: (data) => {
      console.log(`❌ ${path} handler failed - expected 204, got JSON response`);
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

  // Test the handler
  handler(mockReq, mockRes);
};

// Test both favicon handlers
testFavicon('/favicon.ico');
testFavicon('/favicon.png');

console.log('🎉 Favicon tests completed!');
