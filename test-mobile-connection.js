// Simple test to check if backend is accessible from mobile IP
const http = require('http');

const MOBILE_BACKEND = 'http://10.152.98.132:5002';

function testConnection(url, label) {
  return new Promise((resolve) => {
    console.log(`\n🧪 Testing ${label}: ${url}`);
    
    const request = http.get(url + '/health', (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log(`✅ ${label} is accessible!`);
          console.log(`Status: ${response.status}`);
          resolve(true);
        } catch (error) {
          console.log(`❌ ${label} returned invalid JSON:`, data);
          resolve(false);
        }
      });
    });
    
    request.on('error', (error) => {
      console.log(`❌ ${label} connection failed:`, error.message);
      resolve(false);
    });
    
    request.setTimeout(5000, () => {
      console.log(`❌ ${label} connection timeout`);
      request.destroy();
      resolve(false);
    });
  });
}

async function runTest() {
  console.log('🚀 Testing Mobile Backend Connection...');
  
  const mobileWorking = await testConnection(MOBILE_BACKEND, 'Mobile Backend');
  
  console.log('\n📊 Test Results:');
  console.log('=' .repeat(30));
  console.log(`Mobile Backend (${MOBILE_BACKEND}): ${mobileWorking ? '✅ Working' : '❌ Failed'}`);
  
  if (mobileWorking) {
    console.log('\n✅ Your mobile app should be able to connect!');
    console.log('Frontend should use:', MOBILE_BACKEND);
  } else {
    console.log('\n❌ Mobile app cannot connect to backend.');
    console.log('Make sure:');
    console.log('1. Backend server is running');
    console.log('2. Server is listening on 0.0.0.0 (all interfaces)');
    console.log('3. Firewall allows connections on port 5002');
    console.log('4. IP address 10.152.98.132 is correct');
  }
}

runTest().catch(console.error);