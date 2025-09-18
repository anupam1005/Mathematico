#!/usr/bin/env node

/**
 * Mathematico Backend API Connection Test
 * Tests all major API endpoints to ensure connectivity
 */

const https = require('https');

const BASE_URL = 'https://mathematico-backend-new.vercel.app/api/v1';

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Test functions
async function testHealth() {
  console.log('🔍 Testing Health Endpoint...');
  try {
    const response = await makeRequest(`${BASE_URL}/health`);
    if (response.status === 200) {
      console.log('✅ Health check passed:', response.data.status);
      return true;
    } else {
      console.log('❌ Health check failed:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Health check error:', error.message);
    return false;
  }
}

async function testAPIInfo() {
  console.log('🔍 Testing API Info Endpoint...');
  try {
    const response = await makeRequest(`${BASE_URL}`);
    if (response.status === 200) {
      console.log('✅ API info retrieved:', response.data.message);
      return true;
    } else {
      console.log('❌ API info failed:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ API info error:', error.message);
    return false;
  }
}

async function testCourses() {
  console.log('🔍 Testing Courses Endpoint...');
  try {
    const response = await makeRequest(`${BASE_URL}/courses`);
    if (response.status === 200 && response.data.success) {
      console.log('✅ Courses retrieved:', response.data.data.length, 'courses found');
      return true;
    } else {
      console.log('❌ Courses failed:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Courses error:', error.message);
    return false;
  }
}

async function testBooks() {
  console.log('🔍 Testing Books Endpoint...');
  try {
    const response = await makeRequest(`${BASE_URL}/books`);
    if (response.status === 200 && response.data.success) {
      console.log('✅ Books retrieved:', response.data.data.length, 'books found');
      return true;
    } else {
      console.log('❌ Books failed:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Books error:', error.message);
    return false;
  }
}

async function testLiveClasses() {
  console.log('🔍 Testing Live Classes Endpoint...');
  try {
    const response = await makeRequest(`${BASE_URL}/live-classes`);
    if (response.status === 200 && response.data.success) {
      console.log('✅ Live classes retrieved:', response.data.data.length, 'classes found');
      return true;
    } else {
      console.log('❌ Live classes failed:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Live classes error:', error.message);
    return false;
  }
}

async function testAuth() {
  console.log('🔍 Testing Authentication...');
  try {
    const loginData = JSON.stringify({
      email: 'dc2006089@gmail.com',
      password: 'Myname*321'
    });
    
    const response = await makeRequest(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      },
      body: loginData
    });
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ Authentication successful:', response.data.data.user.name);
      return true;
    } else {
      console.log('❌ Authentication failed:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Authentication error:', error.message);
    return false;
  }
}

async function testAdmin() {
  console.log('🔍 Testing Admin Endpoint...');
  try {
    const response = await makeRequest(`${BASE_URL}/admin/dashboard`);
    if (response.status === 200 && response.data.success) {
      console.log('✅ Admin dashboard accessible');
      return true;
    } else {
      console.log('❌ Admin dashboard failed:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Admin dashboard error:', error.message);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Mathematico Backend API Connection Tests');
  console.log('=' .repeat(60));
  console.log(`🌐 Testing: ${BASE_URL}`);
  console.log('=' .repeat(60));
  
  const tests = [
    testHealth,
    testAPIInfo,
    testCourses,
    testBooks,
    testLiveClasses,
    testAuth,
    testAdmin
  ];
  
  let passed = 0;
  let total = tests.length;
  
  for (const test of tests) {
    const result = await test();
    if (result) passed++;
    console.log(''); // Add spacing between tests
  }
  
  console.log('=' .repeat(60));
  console.log(`📊 Test Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! Backend API is fully functional.');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Check the output above for details.');
    process.exit(1);
  }
}

// Run the tests
runTests().catch(console.error);
