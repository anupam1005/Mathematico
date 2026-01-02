// @ts-nocheck
import { Platform, Alert } from 'react-native';

// Network utilities for mobile API connection
export class NetworkUtils {
  
  // Get network information for debugging
  static getNetworkInfo() {
    return {
      platform: Platform.OS,
      isDev: __DEV__,
      userAgent: Platform.select({
        ios: 'iOS',
        android: 'Android',
        web: 'Web',
        default: 'Unknown'
      }),
    };
  }

  // Show instructions for serverless backend
  static showIPInstructions() {
    Alert.alert(
      'Serverless Backend Configuration',
      `
✅ No IP address needed!

Your app is configured to use serverless backend:
- Backend URL: https://mathematico-backend-new.vercel.app
- No local server required
- Works from anywhere with internet

If you need to use local backend:
1. Set REACT_NATIVE_USE_LOCAL_BACKEND=true
2. Set REACT_NATIVE_LOCAL_BACKEND=your-ip-address
      `,
      [
        { text: 'OK' },
        { text: 'Check Config', onPress: () => console.log('Check src/config.ts for configuration') }
      ]
    );
  }

<<<<<<< HEAD

=======
  // Test API connection
  static async testAPIConnection(apiUrl: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${apiUrl}/api/v1/mobile/test`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.warn('API connection test failed:', error);
      return false;
    }
  }
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686

  // Get common IP addresses to try
  static getCommonIPs(): string[] {
    return [
      '192.168.1.100',
      '192.168.1.101',
      '192.168.0.100',
      '192.168.0.101',
      '10.0.0.100',
      '172.16.0.100',
    ];
  }

  // Auto-detect working IP address (for local development only)
  static async findWorkingIP(baseIPs: string[] = this.getCommonIPs(), port: number = 5000): Promise<string | null> {
    // Skip IP detection for serverless backend
    console.log('⚠️ IP detection skipped - using serverless backend');
    return null;
  }

  // Show network troubleshooting
  static showNetworkTroubleshooting() {
    Alert.alert(
      'Network Troubleshooting',
      `
✅ Using serverless backend - no local server needed!

If you're having connection issues:
1. Check your internet connection
2. Verify the serverless backend is deployed
3. Check the API configuration in src/config.ts
4. Ensure the Vercel backend is running properly
      `,
      [
        { text: 'OK' },
        { text: 'Check Config', onPress: () => console.log('Check src/config.ts for API configuration') }
      ]
    );
  }
}

export default NetworkUtils;
