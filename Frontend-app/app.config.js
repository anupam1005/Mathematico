const IS_DEV = process.env.APP_VARIANT === 'development';

export default {
  expo: {
    name: IS_DEV ? 'Mathematico (Dev)' : 'Mathematico - Learn Mathematics',
    slug: 'mathematico-app',
    version: '4.0.0',
    orientation: 'portrait',
    owner: 'anupam08',
    icon: './assets/icon.png',
    newArchEnabled: false,
    sdkVersion: '51.0.0',
    web: {
      favicon: './assets/favicon.png'
    },
    extra: {
      eas: {
        projectId: 'f9d69f7b-ca8f-41f3-85a7-1cec3c8cc3bb'
      }
    },
    android: {
      package: 'com.anupam1505.mathematicoapp',
      versionCode: 4,
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff'
      },
      permissions: [],
      gradleVersion: "8.2.1"
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
