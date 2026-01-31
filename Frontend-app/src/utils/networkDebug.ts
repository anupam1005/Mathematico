import { Platform } from 'react-native';
import { API_BASE_URL, API_PATHS } from '../config';
import { safeCatch } from './safeCatch';

export const debugNetworkConfiguration = async () => {
  console.log('🔍 Network Configuration Debug:');
  console.log('📱 Platform:', Platform.OS);
  
  const backendUrl = API_BASE_URL;
  const authUrl = `${backendUrl}${API_PATHS.auth}`;
  
  console.log('🌐 Auth URL:', authUrl);
  console.log('🌐 Base URL:', backendUrl);
  console.log('🌐 Backend URL:', backendUrl);
  
  // Test different URL formats
  const testUrls = [
    authUrl,
    `${authUrl}/health`,
    `${authUrl}/register`,
    backendUrl,
    backendUrl,
    `${backendUrl}${API_PATHS.auth}`,
    `${backendUrl}${API_PATHS.auth}/health`
  ];
  
  console.log('🧪 Test URLs:');
  testUrls.forEach((url, index) => {
    console.log(`  ${index + 1}. ${url}`);
  });
  
  return {
    platform: Platform.OS,
    authUrl: authUrl,
    baseUrl: backendUrl,
    testUrls
  };
};

export const testDirectConnection = async (): Promise<{
  success: boolean;
  message: string;
  results: any;
}> => {
  const results: any = {};
  
  try {
    console.log('🔍 Testing direct connection to serverless function...');
    
    // Test 1: Root endpoint
    try {
      const rootResponse = await fetch(`${API_BASE_URL}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
      
      if (rootResponse.ok) {
        const data = await rootResponse.json();
        results.root = { success: true, status: rootResponse.status, data };
        console.log('✅ Root endpoint accessible');
      } else {
        results.root = { success: false, status: rootResponse.status, error: 'HTTP Error' };
        console.log('❌ Root endpoint failed:', rootResponse.status);
      }
    } catch (error: any) {
      safeCatch('NetworkDebug.testDirectConnection.root')(error);
      results.root = { success: false, error: 'Request failed' };
    }
    
    // Test 2: Auth health endpoint
    try {
      const healthResponse = await fetch(`${API_BASE_URL}${API_PATHS.auth}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
      
      if (healthResponse.ok) {
        const data = await healthResponse.json();
        results.health = { success: true, status: healthResponse.status, data };
        console.log('✅ Auth health endpoint accessible');
      } else {
        results.health = { success: false, status: healthResponse.status, error: 'HTTP Error' };
        console.log('❌ Auth health endpoint failed:', healthResponse.status);
      }
    } catch (error: any) {
      safeCatch('NetworkDebug.testDirectConnection.health')(error);
      results.health = { success: false, error: 'Request failed' };
    }
    
    // Test 3: Auth register endpoint (without actually registering)
    try {
      const registerResponse = await fetch(`${API_BASE_URL}${API_PATHS.auth}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        }),
      });
      
      if (registerResponse.ok) {
        const data = await registerResponse.json();
        results.register = { success: true, status: registerResponse.status, data };
        console.log('✅ Auth register endpoint accessible');
      } else {
        await registerResponse.json().catch((parseError) => {
          safeCatch('NetworkDebug.testDirectConnection.register.parse')(parseError);
          return null;
        });
        results.register = { 
          success: false, 
          status: registerResponse.status, 
          error: 'HTTP Error'
        };
        console.log('❌ Auth register endpoint failed:', registerResponse.status);
      }
    } catch (error: any) {
      safeCatch('NetworkDebug.testDirectConnection.register')(error);
      results.register = { success: false, error: 'Request failed' };
    }
    
    const successCount = Object.values(results).filter((result: any) => result.success).length;
    const totalTests = Object.keys(results).length;
    
    return {
      success: successCount > 0,
      message: `Direct connection test completed: ${successCount}/${totalTests} endpoints accessible`,
      results
    };
    
  } catch (error: any) {
    safeCatch('NetworkDebug.testDirectConnection')(error);
    return {
      success: false,
      message: 'Direct connection test failed',
      results
    };
  }
};
