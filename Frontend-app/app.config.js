const IS_DEV = process.env.APP_VARIANT === 'development';

export default {
  expo: {
    name: IS_DEV ? 'Mathematico (Dev)' : 'Mathematico - Learn Mathematics',
    slug: 'mathematico-app',
    version: '2.0.0',
    orientation: 'portrait',
    owner: 'testaccount0515',
    icon: './assets/icon.png',
    newArchEnabled: false,
    sdkVersion: '54.0.0',
    web: {
      favicon: './assets/favicon.png'
    },
    extra: {
      eas: {
        projectId: '6bc3167a-315b-4be1-9b1b-8398fdc59921'
      }
    },
    android: {
      package: 'com.anupam1505.mathematicoapp',
      versionCode: 5,
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff'
      },
      permissions: []
    },
    plugins: IS_DEV ? [
      'expo-secure-store',
      'expo-dev-client'
    ] : [
      'expo-secure-store'
    ],
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
