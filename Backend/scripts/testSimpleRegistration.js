const axios = require('axios');

const testSimpleRegistration = async () => {
  try {
    console.log('🚀 Testing simple registration...');
    
    // Test with a simple timeout
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
      timeout: 10000 // Reduced timeout
    });
    
    console.log('✅ Registration successful:');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Registration test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    } else if (error.code === 'ECONNABORTED') {
      console.error('Error: Request timeout - serverless function is taking too long to respond');
    } else {
      console.error('Error:', error.message);
    }
  }
};

testSimpleRegistration();
