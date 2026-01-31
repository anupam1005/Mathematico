import { API_BASE_URL, API_PATHS } from '../config';
import { withBasePath } from '../services/apiClient';
import { testDirectConnection } from './networkDebug';
import { safeCatch } from './safeCatch';

const authApi = withBasePath(API_PATHS.auth);
const AUTH_URL = `${API_BASE_URL}${API_PATHS.auth}`;

export const testNetworkConnectivity = async (): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> => {
  try {
    console.log('🌐 Testing network connectivity...');
    
    const authUrl = AUTH_URL;
    
    console.log('🌐 Backend URL:', authUrl);
    
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
          backendUrl: authUrl
        }
      };
    }
    
    // If direct test fails, try axios
    console.log('🔄 Direct test failed, trying axios...');
    
    // Test 1: Basic connectivity
    const healthResponse = await authApi.get('/health', {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });
    
    console.log('✅ Health check successful:', healthResponse.data);
    
    // Test 2: Test registration endpoint (without actually registering)
    const testResponse = await authApi.post('/register', {
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
        backendUrl: authUrl,
        directTest: directTest.results
      }
    };
    
  } catch (error: any) {
    const safeError = safeCatch('NetworkTest.testNetworkConnectivity')(error);
    
    let errorMessage = 'Network test failed';
    let errorDetails: any = {};
    const errorMsg = safeError.message || 'Unknown network error';
    const normalizedMessage = errorMsg.toLowerCase();
    
    // Check if it's a network error based on message
    if (normalizedMessage.includes('network')) {
      errorMessage = 'Network error - cannot reach backend server';
      errorDetails = {
        message: errorMsg,
        backendUrl: AUTH_URL
      };
    } else if (safeError.response?.status) {
      errorMessage = `Server responded with status ${safeError.response.status}`;
      errorDetails = {
        status: safeError.response.status,
        data: safeError.response.data,
        backendUrl: AUTH_URL
      };
    } else if (safeError.response) {
      errorMessage = 'Server response error';
      errorDetails = { backendUrl: AUTH_URL };
    } else {
      errorMessage = errorMsg || 'No response received from server';
      errorDetails = {
        backendUrl: AUTH_URL
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
    const authUrl = AUTH_URL;
    // Test health endpoint
    try {
      const healthResponse = await authApi.get('/health', { timeout: 5000 });
      endpoints.health = { success: true, status: healthResponse.status, data: healthResponse.data };
    } catch (error: any) {
      safeCatch('NetworkTest.testBackendEndpoints.health')(error);
      endpoints.health = { success: false, error: 'Request failed' };
    }
    
    // Test register endpoint
    try {
      const registerResponse = await authApi.post('/register', {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      }, { timeout: 5000, validateStatus: (status) => status < 500 });
      endpoints.register = { success: true, status: registerResponse.status };
    } catch (error: any) {
      safeCatch('NetworkTest.testBackendEndpoints.register')(error);
      endpoints.register = { success: false, error: 'Request failed' };
    }
    
    // Test login endpoint
    try {
      const loginResponse = await authApi.post('/login', {
        email: 'test@example.com',
        password: 'password123'
      }, { timeout: 5000, validateStatus: (status) => status < 500 });
      endpoints.login = { success: true, status: loginResponse.status };
    } catch (error: any) {
      safeCatch('NetworkTest.testBackendEndpoints.login')(error);
      endpoints.login = { success: false, error: 'Request failed' };
    }
    
    return {
      success: true,
      message: 'Backend endpoints test completed',
      endpoints
    };
    
  } catch (error: any) {
    safeCatch('NetworkTest.testBackendEndpoints')(error);
    return {
      success: false,
      message: 'Backend endpoints test failed',
      endpoints
    };
  }
};
