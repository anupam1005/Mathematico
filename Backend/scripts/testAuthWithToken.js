const axios = require('axios');

const testAuthWithToken = async () => {
  try {
    console.log('🚀 Testing authentication with token...');
    
    // Step 1: Register a user to get a token
    console.log('\n📝 Step 1: Registering a user...');
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
    
    if (!registerResponse.data.success) {
      console.error('❌ Registration failed:', registerResponse.data);
      return;
    }
    
    const accessToken = registerResponse.data.data.tokens.accessToken;
    console.log('✅ Registration successful, got access token');
    
    // Step 2: Test accessing a protected endpoint with the token
    console.log('\n🔐 Step 2: Testing protected endpoint access...');
    
    try {
      const profileResponse = await axios.get('https://mathematico-backend-new.vercel.app/api/v1/auth/profile', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      console.log('✅ Profile access successful:');
      console.log('Status:', profileResponse.status);
      console.log('User ID:', profileResponse.data.data.user.id);
      console.log('User Name:', profileResponse.data.data.user.name);
      console.log('User Email:', profileResponse.data.data.user.email);
      console.log('User Role:', profileResponse.data.data.user.role);
      
    } catch (profileError) {
      console.error('❌ Profile access failed:');
      console.error('Status:', profileError.response?.status);
      console.error('Response:', JSON.stringify(profileError.response?.data, null, 2));
    }
    
    // Step 3: Test accessing mobile endpoints
    console.log('\n📱 Step 3: Testing mobile endpoints...');
    
    try {
      const booksResponse = await axios.get('https://mathematico-backend-new.vercel.app/api/v1/mobile/books', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      console.log('✅ Books access successful:');
      console.log('Status:', booksResponse.status);
      console.log('Books count:', booksResponse.data.data?.books?.length || 0);
      
    } catch (booksError) {
      console.error('❌ Books access failed:');
      console.error('Status:', booksError.response?.status);
      console.error('Response:', JSON.stringify(booksError.response?.data, null, 2));
    }
    
    try {
      const coursesResponse = await axios.get('https://mathematico-backend-new.vercel.app/api/v1/mobile/courses', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      console.log('✅ Courses access successful:');
      console.log('Status:', coursesResponse.status);
      console.log('Courses count:', coursesResponse.data.data?.courses?.length || 0);
      
    } catch (coursesError) {
      console.error('❌ Courses access failed:');
      console.error('Status:', coursesError.response?.status);
      console.error('Response:', JSON.stringify(coursesError.response?.data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
};

testAuthWithToken();
