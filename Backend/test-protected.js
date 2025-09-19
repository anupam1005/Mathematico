const http = require('http');

// Test protected endpoints
async function testProtected() {
  console.log('🔒 Testing Protected endpoints...\n');
  
  // First, get a student token
  let studentToken = null;
  try {
    const loginData = JSON.stringify({
      email: 'test@example.com',
      password: 'password123'
    });
    const response = await makeRequest('POST', '/api/auth/login', loginData);
    studentToken = response.data.token;
    console.log('✅ Student token obtained');
  } catch (error) {
    console.log('❌ Failed to get student token:', error.message);
    return;
  }
  
  // Test student dashboard
  try {
    const response = await makeRequest('GET', '/api/student/dashboard', null, studentToken);
    console.log('✅ Student Dashboard:', response.message);
    console.log('   User:', response.data.user.name);
  } catch (error) {
    console.log('❌ Student Dashboard failed:', error.message);
  }
  
  // Test student courses
  try {
    const response = await makeRequest('GET', '/api/student/courses', null, studentToken);
    console.log('✅ Student Courses:', response.message);
    console.log('   Courses count:', response.data.length);
  } catch (error) {
    console.log('❌ Student Courses failed:', error.message);
  }
  
  // Test student books
  try {
    const response = await makeRequest('GET', '/api/student/books', null, studentToken);
    console.log('✅ Student Books:', response.message);
    console.log('   Books count:', response.data.length);
  } catch (error) {
    console.log('❌ Student Books failed:', error.message);
  }
  
  // Test admin login
  let adminToken = null;
  try {
    const adminLoginData = JSON.stringify({
      email: 'dc2006089@gmail.com',
      password: 'Myname*321'
    });
    const response = await makeRequest('POST', '/api/auth/login', adminLoginData);
    adminToken = response.data.token;
    console.log('✅ Admin token obtained');
  } catch (error) {
    console.log('❌ Failed to get admin token:', error.message);
    return;
  }
  
  // Test admin dashboard
  try {
    const response = await makeRequest('GET', '/api/admin/dashboard', null, adminToken);
    console.log('✅ Admin Dashboard:', response.message);
  } catch (error) {
    console.log('❌ Admin Dashboard failed:', error.message);
  }
  
  // Test unauthorized access (student trying to access admin)
  try {
    const response = await makeRequest('GET', '/api/admin/dashboard', null, studentToken);
    console.log('❌ Security Issue: Student accessed admin dashboard');
  } catch (error) {
    console.log('✅ Security Working: Student blocked from admin dashboard');
  }
  
  console.log('\n🎉 Protected endpoints testing completed!');
}

// Helper function to make HTTP requests
function makeRequest(method, path, data = null, token = null) {
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

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

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
testProtected().catch(console.error);
