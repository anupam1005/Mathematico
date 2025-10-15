import { Platform } from 'react-native';

export const testInternetConnectivity = async (): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> => {
  try {
    console.log('🌐 Testing internet connectivity...');
    console.log('📱 Platform:', Platform.OS);
    
    // Test 1: Google DNS
    try {
      const googleResponse = await fetch('https://8.8.8.8', {
        method: 'GET',
        timeout: 5000
      });
      console.log('✅ Google DNS accessible');
    } catch (error) {
      console.log('❌ Google DNS not accessible:', error);
    }
    
    // Test 2: Cloudflare DNS
    try {
      const cloudflareResponse = await fetch('https://1.1.1.1', {
        method: 'GET',
        timeout: 5000
      });
      console.log('✅ Cloudflare DNS accessible');
    } catch (error) {
      console.log('❌ Cloudflare DNS not accessible:', error);
    }
    
    // Test 3: HTTPBin
    try {
      const httpbinResponse = await fetch('https://httpbin.org/get', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000
      });
      
      if (httpbinResponse.ok) {
        const data = await httpbinResponse.json();
        console.log('✅ HTTPBin accessible:', data);
        return {
          success: true,
          message: 'Internet connectivity test successful',
          details: {
            platform: Platform.OS,
            httpbin: data
          }
        };
      } else {
        console.log('❌ HTTPBin failed:', httpbinResponse.status);
      }
    } catch (error: any) {
      console.error('❌ HTTPBin error:', error);
    }
    
    // Test 4: JSONPlaceholder
    try {
      const jsonResponse = await fetch('https://jsonplaceholder.typicode.com/posts/1', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000
      });
      
      if (jsonResponse.ok) {
        const data = await jsonResponse.json();
        console.log('✅ JSONPlaceholder accessible:', data);
        return {
          success: true,
          message: 'Internet connectivity test successful (JSONPlaceholder)',
          details: {
            platform: Platform.OS,
            jsonplaceholder: data
          }
        };
      } else {
        console.log('❌ JSONPlaceholder failed:', jsonResponse.status);
      }
    } catch (error: any) {
      console.error('❌ JSONPlaceholder error:', error);
    }
    
    return {
      success: false,
      message: 'Internet connectivity test failed - no external services accessible',
      details: {
        platform: Platform.OS
      }
    };
    
  } catch (error: any) {
    console.error('❌ Internet connectivity test failed:', error);
    return {
      success: false,
      message: `Internet connectivity test failed: ${error.message}`,
      details: {
        platform: Platform.OS,
        error: error.message
      }
    };
  }
};
