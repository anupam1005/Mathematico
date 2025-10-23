const IS_DEV = process.env.APP_VARIANT === 'development';

export default {
  expo: {
    name: IS_DEV ? 'Mathematico (Dev)' : 'Mathematico - Learn Mathematics',
    slug: 'mathematico-app',
    version: '5.0.0',
    orientation: 'portrait',
    owner: 'testaccount051',
    icon: './assets/icon.png',
    newArchEnabled: false,
    sdkVersion: '54.0.0',
    web: {
      favicon: './assets/favicon.png'
    },
    extra: {
      eas: {
        projectId: '165d655f-d0b9-4f0b-a8a9-3239c684e9ba'
      }
    },
    android: {
      package: 'com.anupam1505.mathematicoapp',
      versionCode: 5,
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
