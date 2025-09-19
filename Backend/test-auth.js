const http = require('http');

// Test authentication endpoints
async function testAuth() {
  console.log('🔐 Testing Authentication endpoints...\n');
  
  // Test 1: Student Registration
  try {
    const registerData = JSON.stringify({
      name: 'Test Student',
      email: 'test@example.com',
      password: 'password123'
    });
    const response1 = await makeRequest('POST', '/api/auth/register', registerData);
    console.log('✅ Student Registration:', response1.message);
    console.log('   User ID:', response1.data.user.id);
    console.log('   Role:', response1.data.user.role);
  } catch (error) {
    console.log('❌ Student Registration failed:', error.message);
  }
  
  // Test 2: Student Login
  try {
    const loginData = JSON.stringify({
      email: 'test@example.com',
      password: 'password123'
    });
    const response2 = await makeRequest('POST', '/api/auth/login', loginData);
    console.log('✅ Student Login:', response2.message);
    console.log('   Token received:', response2.data ? 'Yes' : 'No');
    console.log('   Role:', response2.data.user.role);
  } catch (error) {
    console.log('❌ Student Login failed:', error.message);
  }
  
  // Test 3: Admin Login
  try {
    const adminLoginData = JSON.stringify({
      email: 'dc2006089@gmail.com',
      password: 'Myname*321'
    });
    const response3 = await makeRequest('POST', '/api/auth/login', adminLoginData);
    console.log('✅ Admin Login:', response3.message);
    console.log('   Token received:', response3.data ? 'Yes' : 'No');
    console.log('   Role:', response3.data.user.role);
    console.log('   Is Admin:', response3.data.user.isAdmin);
  } catch (error) {
    console.log('❌ Admin Login failed:', error.message);
  }
  
  console.log('\n🎉 Authentication testing completed!');
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
testAuth().catch(console.error);
