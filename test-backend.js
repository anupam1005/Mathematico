const axios = require('axios');

// Test both local and production backends
const LOCAL_BACKEND = 'http://localhost:5002';
const PROD_BACKEND = 'https://mathematico-backend-new.vercel.app';

async function testBackend(baseUrl, label) {
  console.log(`\n🧪 Testing ${label} Backend: ${baseUrl}`);
  console.log('=' .repeat(50));

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${baseUrl}/health`, { timeout: 10000 });
    console.log('✅ Health check:', healthResponse.data.status);

    // Test root endpoint
    console.log('2. Testing root endpoint...');
    const rootResponse = await axios.get(`${baseUrl}/`, { timeout: 10000 });
    console.log('✅ Root endpoint:', rootResponse.data.message);

    // Test auth endpoint
    console.log('3. Testing auth endpoint...');
    const authResponse = await axios.get(`${baseUrl}/api/v1/auth`, { timeout: 10000 });
    console.log('✅ Auth endpoint:', authResponse.data.message);

    // Test auth test endpoint
    console.log('4. Testing auth test endpoint...');
    const authTestResponse = await axios.get(`${baseUrl}/api/v1/auth/test`, { timeout: 10000 });
    console.log('✅ Auth test:', authTestResponse.data.message);

    // Test registration endpoint (should fail without data, but endpoint should exist)
    console.log('5. Testing registration endpoint...');
    try {
      await axios.post(`${baseUrl}/api/v1/auth/register`, {}, { timeout: 10000 });
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Registration endpoint exists (validation error expected)');
      } else {
        throw error;
      }
    }

    // Test login endpoint (should fail without data, but endpoint should exist)
    console.log('6. Testing login endpoint...');
    try {
      await axios.post(`${baseUrl}/api/v1/auth/login`, {}, { timeout: 10000 });
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Login endpoint exists (validation error expected)');
      } else {
        throw error;
      }
    }

    console.log(`\n🎉 ${label} Backend is working correctly!`);
    return true;

  } catch (error) {
    console.error(`❌ ${label} Backend test failed:`, error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Backend Tests...');
  
  // Test production backend first
  const prodWorking = await testBackend(PROD_BACKEND, 'Production');
  
  // Test local backend if available
  const localWorking = await testBackend(LOCAL_BACKEND, 'Local');
  
  console.log('\n📊 Test Summary:');
  console.log('=' .repeat(30));
  console.log(`Production Backend: ${prodWorking ? '✅ Working' : '❌ Failed'}`);
  console.log(`Local Backend: ${localWorking ? '✅ Working' : '❌ Failed'}`);
  
  if (prodWorking) {
    console.log('\n✅ Your mobile app should be able to connect to the production backend!');
  } else {
    console.log('\n❌ There are issues with the backend connectivity.');
  }
}

runTests().catch(console.error);