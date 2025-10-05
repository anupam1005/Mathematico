const axios = require('axios');

const testCompleteFlow = async () => {
  try {
    console.log('🚀 Testing complete registration and login flow...');
    
    // Step 1: Register a new user
    console.log('\n📝 Step 1: Registering a new user...');
    const testData = {
      name: 'Test User',
      email: `testuser_${Date.now()}@example.com`,
      password: 'password123'
    };
    
    console.log('Registration data:', { ...testData, password: '***' });
    
    const registerResponse = await axios.post('https://mathematico-backend-new.vercel.app/api/v1/auth/register', testData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Registration successful:');
    console.log('Status:', registerResponse.status);
    console.log('User ID:', registerResponse.data.data.user._id);
    console.log('User Name:', registerResponse.data.data.user.name);
    console.log('User Email:', registerResponse.data.data.user.email);
    console.log('User Role:', registerResponse.data.data.user.role);
    console.log('Has Access Token:', !!registerResponse.data.data.tokens.accessToken);
    
    // Step 2: Login with the registered user
    console.log('\n🔐 Step 2: Logging in with the registered user...');
    
    const loginResponse = await axios.post('https://mathematico-backend-new.vercel.app/api/v1/auth/login', {
      email: testData.email,
      password: testData.password
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Login successful:');
    console.log('Status:', loginResponse.status);
    console.log('User ID:', loginResponse.data.data.user.id);
    console.log('User Name:', loginResponse.data.data.user.name);
    console.log('User Email:', loginResponse.data.data.user.email);
    console.log('User Role:', loginResponse.data.data.user.role);
    console.log('Has Access Token:', !!loginResponse.data.data.tokens.accessToken);
    
    // Step 3: Test admin login
    console.log('\n👑 Step 3: Testing admin login...');
    
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
    console.log('User ID:', adminResponse.data.data.user.id);
    console.log('User Name:', adminResponse.data.data.user.name);
    console.log('User Email:', adminResponse.data.data.user.email);
    console.log('User Role:', adminResponse.data.data.user.role);
    console.log('Is Admin:', adminResponse.data.data.user.isAdmin);
    
    console.log('\n🎉 Complete flow test successful!');
    console.log('✅ Registration works');
    console.log('✅ User login works');
    console.log('✅ Admin login works');
    
  } catch (error) {
    console.error('❌ Complete flow test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
};

testCompleteFlow();
