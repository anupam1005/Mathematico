const axios = require('axios');

const testLogin = async () => {
  try {
    console.log('🚀 Testing login...');
    
    // Test admin login
    console.log('🔐 Testing admin login...');
    const adminResponse = await axios.post('https://mathematico-backend-new.vercel.app/api/v1/auth/login', {
      email: 'dc2006089@gmail.com',
      password: 'Myname*321'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Admin login successful:');
    console.log('Status:', adminResponse.status);
    console.log('Response:', JSON.stringify(adminResponse.data, null, 2));
    
    // Test user login with a registered user
    console.log('\n🔐 Testing user login...');
    const userResponse = await axios.post('https://mathematico-backend-new.vercel.app/api/v1/auth/login', {
      email: 'testuser_1759648061072@example.com',
      password: 'password123'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ User login successful:');
    console.log('Status:', userResponse.status);
    console.log('Response:', JSON.stringify(userResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Login test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
};

testLogin();
