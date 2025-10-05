const axios = require('axios');

const testRefreshToken = async () => {
  try {
    console.log('🚀 Testing refresh token endpoint...');
    
    // First, register a user to get tokens
    console.log('📝 Step 1: Registering a user to get tokens...');
    const testData = {
      name: 'Test User',
      email: `testuser_${Date.now()}@example.com`,
      password: 'password123'
    };
    
    const registerResponse = await axios.post('https://mathematico-backend-new.vercel.app/api/v1/auth/register', testData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    if (registerResponse.data.success && registerResponse.data.data.tokens.refreshToken) {
      console.log('✅ Registration successful, got refresh token');
      
      // Now test refresh token
      console.log('\n🔄 Step 2: Testing refresh token...');
      const refreshResponse = await axios.post('https://mathematico-backend-new.vercel.app/api/v1/auth/refresh-token', {
        refreshToken: registerResponse.data.data.tokens.refreshToken
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      console.log('✅ Refresh token successful:');
      console.log('Status:', refreshResponse.status);
      console.log('Response:', JSON.stringify(refreshResponse.data, null, 2));
      
    } else {
      console.error('❌ Registration failed or no refresh token received');
    }
    
  } catch (error) {
    console.error('❌ Refresh token test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
};

testRefreshToken();
