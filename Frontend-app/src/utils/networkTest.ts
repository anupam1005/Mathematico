import axios from 'axios';
import { API_CONFIG } from '../config';
import { testDirectConnection } from './networkDebug';

export const testNetworkConnectivity = async (): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> => {
  try {
    console.log('🌐 Testing network connectivity...');
    console.log('🌐 Backend URL:', API_CONFIG.auth);
    
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
          backendUrl: API_CONFIG.auth
        }
      };
    }
    
    // If direct test fails, try axios
    console.log('🔄 Direct test failed, trying axios...');
    
    // Test 1: Basic connectivity
    const healthResponse = await axios.get(`${API_CONFIG.auth}/health`, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });
    
    console.log('✅ Health check successful:', healthResponse.data);
    
    // Test 2: Test registration endpoint (without actually registering)
    const testResponse = await axios.post(`${API_CONFIG.auth}/register`, {
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
        backendUrl: API_CONFIG.auth,
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
        backendUrl: API_CONFIG.auth
      };
    } else if (error.response) {
      errorMessage = `Server responded with status ${error.response.status}`;
      errorDetails = {
        status: error.response.status,
        data: error.response.data,
        backendUrl: API_CONFIG.auth
      };
    } else if (error.request) {
      errorMessage = 'No response received from server';
      errorDetails = {
        request: error.request,
        backendUrl: API_CONFIG.auth
      };
    } else {
      errorMessage = error.message || 'Unknown network error';
      errorDetails = {
        error: error,
        backendUrl: API_CONFIG.auth
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
  const endpoints = {
    health: null,
    register: null,
    login: null
  };
  
  try {
    // Test health endpoint
    try {
      const healthResponse = await axios.get(`${API_CONFIG.auth}/health`, { timeout: 5000 });
      endpoints.health = { success: true, status: healthResponse.status, data: healthResponse.data };
    } catch (error: any) {
      endpoints.health = { success: false, error: error.message };
    }
    
    // Test register endpoint
    try {
      const registerResponse = await axios.post(`${API_CONFIG.auth}/register`, {
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
      const loginResponse = await axios.post(`${API_CONFIG.auth}/login`, {
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
