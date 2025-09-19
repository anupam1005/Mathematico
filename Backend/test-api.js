const http = require('http');

// Test function
async function testAPI() {
  console.log('🧪 Testing API endpoints...\n');
  
  // Test 1: Basic server response
  try {
    const response1 = await makeRequest('GET', '/api/test');
    console.log('✅ Test 1 - Basic API:', response1.message);
  } catch (error) {
    console.log('❌ Test 1 - Basic API failed:', error.message);
  }
  
  // Test 2: Auth endpoint
  try {
    const response2 = await makeRequest('GET', '/api/auth');
    console.log('✅ Test 2 - Auth API:', response2.message);
  } catch (error) {
    console.log('❌ Test 2 - Auth API failed:', error.message);
  }
  
  // Test 3: Student endpoint
  try {
    const response3 = await makeRequest('GET', '/api/student');
    console.log('✅ Test 3 - Student API:', response3.message);
  } catch (error) {
    console.log('❌ Test 3 - Student API failed:', error.message);
  }
  
  // Test 4: Admin endpoint
  try {
    const response4 = await makeRequest('GET', '/api/admin');
    console.log('✅ Test 4 - Admin API:', response4.message);
  } catch (error) {
    console.log('❌ Test 4 - Admin API failed:', error.message);
  }
  
  // Test 5: Login endpoint
  try {
    const loginData = JSON.stringify({
      email: 'dc2006089@gmail.com',
      password: 'Myname*321'
    });
    const response5 = await makeRequest('POST', '/api/auth/login', loginData);
    console.log('✅ Test 5 - Admin Login:', response5.message);
    console.log('   Token received:', response5.data ? 'Yes' : 'No');
  } catch (error) {
    console.log('❌ Test 5 - Admin Login failed:', error.message);
  }
  
  console.log('\n🎉 API testing completed!');
}

// Helper function to make HTTP requests
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data ? Buffer.byteLength(data) : 0
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${parsed.message || 'Unknown error'}`));
          }
        } catch (error) {
          reject(new Error(`Invalid JSON response: ${responseData}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });

    if (data) {
      req.write(data);
    }
    
    req.end();
  });
}

// Run the test
testAPI().catch(console.error);
