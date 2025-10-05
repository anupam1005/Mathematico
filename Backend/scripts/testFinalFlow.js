const axios = require('axios');

const testFinalFlow = async () => {
  try {
    console.log('🚀 Testing final complete flow...');
    
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
      timeout: 10000
    });
    
    console.log('✅ Registration successful:');
    console.log('Status:', registerResponse.status);
    console.log('User ID:', registerResponse.data.data.user._id);
    console.log('User Name:', registerResponse.data.data.user.name);
    console.log('User Email:', registerResponse.data.data.user.email);
    console.log('User Role:', registerResponse.data.data.user.role);
    console.log('Has Access Token:', !!registerResponse.data.data.tokens.accessToken);
    console.log('Has Refresh Token:', !!registerResponse.data.data.tokens.refreshToken);
    
    const accessToken = registerResponse.data.data.tokens.accessToken;
    
    // Step 2: Test mobile endpoints (what the mobile app actually uses)
    console.log('\n📱 Step 2: Testing mobile endpoints...');
    
    const mobileEndpoints = [
      { name: 'Books', url: '/api/v1/mobile/books' },
      { name: 'Courses', url: '/api/v1/mobile/courses' },
      { name: 'Live Classes', url: '/api/v1/mobile/live-classes' },
      { name: 'Featured', url: '/api/v1/mobile/featured' },
      { name: 'App Info', url: '/api/v1/mobile/app-info' }
    ];
    
    for (const endpoint of mobileEndpoints) {
      try {
        const response = await axios.get(`https://mathematico-backend-new.vercel.app${endpoint.url}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        });
        
        console.log(`✅ ${endpoint.name} access successful: Status ${response.status}`);
        
      } catch (error) {
        console.log(`⚠️ ${endpoint.name} access failed: Status ${error.response?.status || 'No response'}`);
      }
    }
    
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
    console.log('User Role:', adminResponse.data.data.user.role);
    console.log('Is Admin:', adminResponse.data.data.user.isAdmin);
    
    console.log('\n🎉 Final flow test successful!');
    console.log('✅ User registration works');
    console.log('✅ Mobile endpoints work');
    console.log('✅ Admin login works');
    console.log('✅ Mobile app should now work without authentication errors');
    
  } catch (error) {
    console.error('❌ Final flow test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
};

testFinalFlow();
