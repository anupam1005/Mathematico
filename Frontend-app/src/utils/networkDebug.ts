import { Platform } from 'react-native';
import { API_CONFIG } from '../config';

export const debugNetworkConfiguration = () => {
  console.log('🔍 Network Configuration Debug:');
  console.log('📱 Platform:', Platform.OS);
  console.log('🌐 Auth URL:', API_CONFIG.auth);
  console.log('🌐 Base URL:', API_CONFIG.baseUrl);
  console.log('🌐 Is Dev:', API_CONFIG.isDev);
  console.log('🌐 Backend URL:', API_CONFIG.baseUrl.replace('/api/v1', ''));
  
  // Test different URL formats
  const testUrls = [
    API_CONFIG.auth,
    `${API_CONFIG.auth}/health`,
    `${API_CONFIG.auth}/register`,
    API_CONFIG.baseUrl,
    'https://mathematico-backend-new.vercel.app',
    'https://mathematico-backend-new.vercel.app/api/v1/auth',
    'https://mathematico-backend-new.vercel.app/api/v1/auth/health'
  ];
  
  console.log('🧪 Test URLs:');
  testUrls.forEach((url, index) => {
    console.log(`  ${index + 1}. ${url}`);
  });
  
  return {
    platform: Platform.OS,
    authUrl: API_CONFIG.auth,
    baseUrl: API_CONFIG.baseUrl,
    isDev: API_CONFIG.isDev,
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
      const rootResponse = await fetch('https://mathematico-backend-new.vercel.app/', {
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
      results.root = { success: false, error: error.message };
      console.log('❌ Root endpoint error:', error.message);
    }
    
    // Test 2: Auth health endpoint
    try {
      const healthResponse = await fetch('https://mathematico-backend-new.vercel.app/api/v1/auth/health', {
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
      results.health = { success: false, error: error.message };
      console.log('❌ Auth health endpoint error:', error.message);
    }
    
    // Test 3: Auth register endpoint (without actually registering)
    try {
      const registerResponse = await fetch('https://mathematico-backend-new.vercel.app/api/v1/auth/register', {
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
        const errorData = await registerResponse.json().catch(() => ({}));
        results.register = { 
          success: false, 
          status: registerResponse.status, 
          error: errorData.message || 'HTTP Error' 
        };
        console.log('❌ Auth register endpoint failed:', registerResponse.status, errorData.message);
      }
    } catch (error: any) {
      results.register = { success: false, error: error.message };
      console.log('❌ Auth register endpoint error:', error.message);
    }
    
    const successCount = Object.values(results).filter((result: any) => result.success).length;
    const totalTests = Object.keys(results).length;
    
    return {
      success: successCount > 0,
      message: `Direct connection test completed: ${successCount}/${totalTests} endpoints accessible`,
      results
    };
    
  } catch (error: any) {
    console.error('❌ Direct connection test failed:', error);
    return {
      success: false,
      message: `Direct connection test failed: ${error.message}`,
      results
    };
  }
};
