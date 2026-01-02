import axios from 'axios';
import { API_CONFIG } from '../config';
<<<<<<< HEAD
const AUTH_URL = API_CONFIG.auth;
=======
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
import { testDirectConnection } from './networkDebug';

export const testNetworkConnectivity = async (): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> => {
  try {
    console.log('🌐 Testing network connectivity...');
<<<<<<< HEAD
    
    const authUrl = AUTH_URL;
    
    console.log('🌐 Backend URL:', authUrl);
=======
    console.log('🌐 Backend URL:', API_CONFIG.auth);
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
    
    // First try direct connection test
    console.log('🔍 Running direct connection test...');
    const directTest = await testDirectConnection();
    
    if (directTest.success) {
      console.log('✅ Direct connection test passed');
      return {
        success: true,
        message: 'Network connectivity test successful (direct connection)',
        details: {
          directTest: directTest.results,
<<<<<<< HEAD
          backendUrl: authUrl
=======
          backendUrl: API_CONFIG.auth
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
        }
      };
    }
    
    // If direct test fails, try axios
    console.log('🔄 Direct test failed, trying axios...');
    
    // Test 1: Basic connectivity
<<<<<<< HEAD
    const healthResponse = await axios.get(`${authUrl}/health`, {
=======
    const healthResponse = await axios.get(`${API_CONFIG.auth}/health`, {
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });
    
    console.log('✅ Health check successful:', healthResponse.data);
    
    // Test 2: Test registration endpoint (without actually registering)
<<<<<<< HEAD
    const testResponse = await axios.post(`${authUrl}/register`, {
=======
    const testResponse = await axios.post(`${API_CONFIG.auth}/register`, {
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
      name: 'Network Test',
      email: 'network-test@example.com',
      password: 'test123'
    }, {
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      validateStatus: (status) => status < 500 // Accept any status less than 500
    });
    
    console.log('✅ Registration endpoint accessible:', testResponse.status);
    
    return {
      success: true,
      message: 'Network connectivity test successful (axios)',
      details: {
        healthStatus: healthResponse.data,
        registrationEndpointStatus: testResponse.status,
<<<<<<< HEAD
        backendUrl: authUrl,
=======
        backendUrl: API_CONFIG.auth,
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
        directTest: directTest.results
      }
    };
    
  } catch (error: any) {
    console.error('❌ Network connectivity test failed:', error);
    
    let errorMessage = 'Network test failed';
    let errorDetails: any = {};
    
    if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
      errorMessage = 'Network error - cannot reach backend server';
      errorDetails = {
        code: error.code,
        message: error.message,
<<<<<<< HEAD
        backendUrl: AUTH_URL
=======
        backendUrl: API_CONFIG.auth
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
      };
    } else if (error.response) {
      errorMessage = `Server responded with status ${error.response.status}`;
      errorDetails = {
        status: error.response.status,
        data: error.response.data,
<<<<<<< HEAD
        backendUrl: AUTH_URL
=======
        backendUrl: API_CONFIG.auth
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
      };
    } else if (error.request) {
      errorMessage = 'No response received from server';
      errorDetails = {
        request: error.request,
<<<<<<< HEAD
        backendUrl: AUTH_URL
=======
        backendUrl: API_CONFIG.auth
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
      };
    } else {
      errorMessage = error.message || 'Unknown network error';
      errorDetails = {
        error: error,
<<<<<<< HEAD
        backendUrl: AUTH_URL
=======
        backendUrl: API_CONFIG.auth
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
      };
    }
    
    return {
      success: false,
      message: errorMessage,
      details: errorDetails
    };
  }
};

export const testBackendEndpoints = async (): Promise<{
  success: boolean;
  message: string;
  endpoints: any;
}> => {
  const endpoints: any = {
    health: null,
    register: null,
    login: null
  };
  
  try {
<<<<<<< HEAD
    const authUrl = AUTH_URL;
    // Test health endpoint
    try {
      const healthResponse = await axios.get(`${authUrl}/health`, { timeout: 5000 });
=======
    // Test health endpoint
    try {
      const healthResponse = await axios.get(`${API_CONFIG.auth}/health`, { timeout: 5000 });
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
      endpoints.health = { success: true, status: healthResponse.status, data: healthResponse.data };
    } catch (error: any) {
      endpoints.health = { success: false, error: error.message };
    }
    
    // Test register endpoint
    try {
<<<<<<< HEAD
      const registerResponse = await axios.post(`${authUrl}/register`, {
=======
      const registerResponse = await axios.post(`${API_CONFIG.auth}/register`, {
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      }, { timeout: 5000, validateStatus: (status) => status < 500 });
      endpoints.register = { success: true, status: registerResponse.status };
    } catch (error: any) {
      endpoints.register = { success: false, error: error.message };
    }
    
    // Test login endpoint
    try {
<<<<<<< HEAD
      const loginResponse = await axios.post(`${authUrl}/login`, {
=======
      const loginResponse = await axios.post(`${API_CONFIG.auth}/login`, {
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
        email: 'test@example.com',
        password: 'password123'
      }, { timeout: 5000, validateStatus: (status) => status < 500 });
      endpoints.login = { success: true, status: loginResponse.status };
    } catch (error: any) {
      endpoints.login = { success: false, error: error.message };
    }
    
    return {
      success: true,
      message: 'Backend endpoints test completed',
      endpoints
    };
    
  } catch (error: any) {
    return {
      success: false,
      message: 'Backend endpoints test failed',
      endpoints
    };
  }
};
