// Test script for Vercel deployment
const https = require('https');

const testUrl = 'https://mathematico-backend-new.vercel.app';

const tests = [
  { path: '/', description: 'Root endpoint' },
  { path: '/health', description: 'Health check' },
  { path: '/api/v1/health', description: 'API health check' },
  { path: '/favicon.ico', description: 'Favicon' },
  { path: '/robots.txt', description: 'Robots.txt' }
];

function testEndpoint(path, description) {
  return new Promise((resolve) => {
    const req = https.get(`${testUrl}${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`✅ ${description} (${path}): ${res.statusCode}`);
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            console.log(`   Response: ${JSON.stringify(json).substring(0, 100)}...`);
          } catch (e) {
            console.log(`   Response: ${data.substring(0, 100)}...`);
          }
        }
        resolve({ success: true, status: res.statusCode, data });
      });
    });
    
    req.on('error', (err) => {
      console.log(`❌ ${description} (${path}): ${err.message}`);
      resolve({ success: false, error: err.message });
    });
    
    req.setTimeout(10000, () => {
      console.log(`⏰ ${description} (${path}): Timeout`);
      req.destroy();
      resolve({ success: false, error: 'Timeout' });
    });
  });
}

async function runTests() {
  console.log('🧪 Testing Vercel deployment...\n');
  console.log(`Testing URL: ${testUrl}\n`);
  
  for (const test of tests) {
    await testEndpoint(test.path, test.description);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between tests
  }
  
  console.log('\n✨ Vercel deployment test completed!');
}

runTests().catch(console.error);
