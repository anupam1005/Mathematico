const axios = require('axios');

const testRegistration = async () => {
  try {
    console.log('🚀 Testing registration with database...');
    
    const testData = {
      name: 'Test User',
      email: `testuser_${Date.now()}@example.com`,
      password: 'password123'
    };
    
    console.log('📝 Registering user:', testData.email);
    
    const response = await axios.post('https://mathematico-backend-new.vercel.app/api/v1/auth/register', testData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    console.log('✅ Registration response:');
    console.log('Status:', response.status);
    console.log('Success:', response.data.success);
    console.log('Message:', response.data.message);
    console.log('Fallback Mode:', response.data.fallback || false);
    
    if (response.data.success) {
      console.log('✅ User registered successfully');
      console.log('User ID:', response.data.data.user._id);
      console.log('User Name:', response.data.data.user.name);
      console.log('User Email:', response.data.data.user.email);
      
      // Test login with the same credentials
      console.log('\n🔐 Testing login...');
      const loginResponse = await axios.post('https://mathematico-backend-new.vercel.app/api/v1/auth/login', {
        email: testData.email,
        password: testData.password
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });
      
      console.log('✅ Login response:');
      console.log('Status:', loginResponse.status);
      console.log('Success:', loginResponse.data.success);
      console.log('Message:', loginResponse.data.message);
      console.log('Fallback Mode:', loginResponse.data.fallback || false);
      
      if (loginResponse.data.success) {
        console.log('✅ Login successful');
        console.log('User ID:', loginResponse.data.data.user.id);
        console.log('User Name:', loginResponse.data.data.user.name);
        console.log('User Email:', loginResponse.data.data.user.email);
        
        console.log('\n🎉 Database test successful!');
        console.log('✅ User registration works with database');
        console.log('✅ User login works with database');
        console.log('✅ Data is persisted in database');
      } else {
        console.log('❌ Login failed');
      }
    } else {
      console.log('❌ Registration failed');
    }
    
  } catch (error) {
    console.error('❌ Database test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
};

testRegistration();
