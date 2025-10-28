// Debug script to test login functionality
// Run this in your browser console or as a test script

const testLogin = async () => {
  const baseURL = 'https://mathematico-backend-new.vercel.app'; // Your serverless backend
  // const baseURL = 'http://10.148.37.132:5002'; // Local backend for testing
  
  console.log('🧪 Testing login with backend:', baseURL);
  
  // Test admin login
  try {
    console.log('🔐 Testing admin login...');
    const adminResponse = await fetch(`${baseURL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        email: 'dc2006089@gmail.com',
        password: 'Myname*321'
      })
    });
    
    const adminData = await adminResponse.json();
    console.log('Admin login response:', adminData);
    
    if (adminData.success) {
      console.log('✅ Admin login successful!');
      console.log('User:', adminData.data.user);
      console.log('Token:', adminData.data.accessToken ? 'Present' : 'Missing');
    } else {
      console.log('❌ Admin login failed:', adminData.message);
    }
  } catch (error) {
    console.error('❌ Admin login error:', error);
  }
  
  // Test health endpoint
  try {
    console.log('🏥 Testing health endpoint...');
    const healthResponse = await fetch(`${baseURL}/health`);
    const healthData = await healthResponse.json();
    console.log('Health response:', healthData);
  } catch (error) {
    console.error('❌ Health check error:', error);
  }
  
  // Test auth endpoint
  try {
    console.log('🔐 Testing auth endpoint...');
    const authResponse = await fetch(`${baseURL}/api/v1/auth`);
    const authData = await authResponse.json();
    console.log('Auth endpoint response:', authData);
  } catch (error) {
    console.error('❌ Auth endpoint error:', error);
  }
};

// Run the test
testLogin();
