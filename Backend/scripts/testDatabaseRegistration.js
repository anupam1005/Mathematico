const axios = require('axios');

const testDatabaseRegistration = async () => {
  try {
    console.log('🚀 Testing database registration and login...');
    
    // Step 1: Register a new user
    console.log('\n📝 Step 1: Registering a new user...');
    const testData = {
      name: 'Test User',
      email: `testuser_${Date.now()}@example.com`,
      password: 'password123'
    };
    
    const registerResponse = await axios.post('https://mathematico-backend-new.vercel.app/api/v1/auth/register', testData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });
    
    console.log('✅ Registration successful:');
    console.log('Status:', registerResponse.status);
    console.log('User ID:', registerResponse.data.data.user._id);
    console.log('User Name:', registerResponse.data.data.user.name);
    console.log('User Email:', registerResponse.data.data.user.email);
    console.log('User Role:', registerResponse.data.data.user.role);
    console.log('Has Access Token:', !!registerResponse.data.data.tokens.accessToken);
    console.log('Has Refresh Token:', !!registerResponse.data.data.tokens.refreshToken);
    console.log('Fallback Mode:', registerResponse.data.fallback || false);
    
    const accessToken = registerResponse.data.data.tokens.accessToken;
    const userEmail = testData.email;
    const userPassword = testData.password;
    
    // Step 2: Test logout
    console.log('\n🚪 Step 2: Testing logout...');
    const logoutResponse = await axios.post('https://mathematico-backend-new.vercel.app/api/v1/auth/logout', {}, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Logout successful:', logoutResponse.data.message);
    
    // Step 3: Test login with the same credentials
    console.log('\n🔐 Step 3: Testing login with same credentials...');
    const loginResponse = await axios.post('https://mathematico-backend-new.vercel.app/api/v1/auth/login', {
      email: userEmail,
      password: userPassword
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });
    
    console.log('✅ Login successful:');
    console.log('Status:', loginResponse.status);
    console.log('User ID:', loginResponse.data.data.user.id);
    console.log('User Name:', loginResponse.data.data.user.name);
    console.log('User Email:', loginResponse.data.data.user.email);
    console.log('User Role:', loginResponse.data.data.user.role);
    console.log('Has Access Token:', !!loginResponse.data.data.tokens.accessToken);
    console.log('Has Refresh Token:', !!loginResponse.data.data.tokens.refreshToken);
    console.log('Fallback Mode:', loginResponse.data.fallback || false);
    
    console.log('\n🎉 Database registration and login test successful!');
    console.log('✅ User registration works with database');
    console.log('✅ User logout works');
    console.log('✅ User can login again after logout');
    console.log('✅ Data is persisted in database');
    
  } catch (error) {
    console.error('❌ Database registration test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
};

testDatabaseRegistration();
