// Simple test script to verify the deployment
const http = require('http');

const testUrl = 'http://localhost:5000';

const tests = [
  { path: '/', description: 'Root endpoint' },
  { path: '/health', description: 'Health check' },
  { path: '/api/v1/health', description: 'API health check' },
  { path: '/favicon.ico', description: 'Favicon' },
  { path: '/robots.txt', description: 'Robots.txt' }
];

function testEndpoint(path, description) {
  return new Promise((resolve) => {
    const req = http.get(`${testUrl}${path}`, (res) => {
      console.log(`✅ ${description} (${path}): ${res.statusCode}`);
      resolve({ success: true, status: res.statusCode });
    });
    
    req.on('error', (err) => {
      console.log(`❌ ${description} (${path}): ${err.message}`);
      resolve({ success: false, error: err.message });
    });
    
    req.setTimeout(5000, () => {
      console.log(`⏰ ${description} (${path}): Timeout`);
      req.destroy();
      resolve({ success: false, error: 'Timeout' });
    });
  });
}

async function runTests() {
  console.log('🧪 Testing deployment endpoints...\n');
  
  for (const test of tests) {
    await testEndpoint(test.path, test.description);
  }
  
  console.log('\n✨ Test completed!');
}

runTests().catch(console.error);
