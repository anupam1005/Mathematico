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

  // Show instructions for production backend
  static showIPInstructions() {
    Alert.alert(
      'Production Backend Configuration',
      `
✅ Using production backend!

Your app is configured to use:
- Backend URL: https://mathematico-backend-new.vercel.app
- No local server required
- Works from anywhere with internet
      `,
      [
        { text: 'OK' },
        { text: 'Check Config', onPress: () => console.log('Check src/config.ts for configuration') }
      ]
    );
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
