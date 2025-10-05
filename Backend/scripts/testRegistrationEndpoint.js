const axios = require('axios');

const testRegistrationEndpoint = async () => {
  try {
    console.log('🚀 Testing registration endpoint...');
    
    const testData = {
      name: 'Test User',
      email: `testuser_${Date.now()}@example.com`,
      password: 'password123'
    };
    
    console.log('📝 Test data:', { ...testData, password: '***' });
    
    const response = await axios.post('https://mathematico-backend-new.vercel.app/api/v1/auth/register', testData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    console.log('✅ Registration successful:');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    // Test login with the registered user
    console.log('\n🔐 Testing login with registered user...');
    
    const loginResponse = await axios.post('https://mathematico-backend-new.vercel.app/api/v1/auth/login', {
      email: testData.email,
      password: testData.password
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    console.log('✅ Login successful:');
    console.log('Status:', loginResponse.status);
    console.log('Response:', JSON.stringify(loginResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Registration test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
};

testRegistrationEndpoint();
