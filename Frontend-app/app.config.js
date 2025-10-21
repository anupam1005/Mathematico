const IS_DEV = process.env.APP_VARIANT === 'development';

export default {
  expo: {
    name: IS_DEV ? 'Mathematico (Dev)' : 'Mathematico - Learn Mathematics',
    slug: 'mathematico-app',
    version: '2.0.0',
    orientation: 'portrait',
    owner: 'testaccount125',
    icon: './assets/icon.png',
    newArchEnabled: false,
    sdkVersion: '54.0.0',
    web: {
      favicon: './assets/favicon.png'
    },
    extra: {
      eas: {
        projectId: 'f4a7320d-9731-4ddb-9e3f-a8c056934cd9'
      }
    },
    android: {
      package: 'com.anupam1505.mathematicoapp',
      versionCode: 4,
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff'
      },
      permissions: []
    },
    plugins: [
      'expo-secure-store',
      'expo-dev-client'
    ],
    developmentClient: {
      silentLaunch: true
    },
    // Add platform-specific configurations
    platforms: ['ios', 'android', 'web'],
    // Ensure proper module resolution
    resolver: {
      alias: {
        'react-native/Libraries/Utilities/PlatformConstants': './src/utils/PlatformConstantsPolyfill.js'
      }
    }
  }
};
