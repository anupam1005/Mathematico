const IS_DEV = process.env.APP_VARIANT === 'development';

export default {
  expo: {
    name: IS_DEV ? 'Mathematico (Dev)' : 'Mathematico',
    slug: 'mathematico-app',
    version: '8.0.0',
    orientation: 'portrait',
    owner: 'dipanjan9',
    icon: './assets/icon.png',
    web: {
      favicon: './assets/favicon.png'
    },
    extra: {
      eas: {
        projectId: 'fd395e4b-c9da-4952-ad39-c0c299c89290'
      }
    },
    android: {
      package: 'com.anupam1505.mathematicoapp',
      versionCode: 8,
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff'
      },
      permissions: []
    },
    plugins: IS_DEV ? [
      'expo-secure-store',
      'expo-dev-client',
      'expo-font',
      [
        'expo-build-properties',
        {
          android: {
            compileSdkVersion: 35,
            targetSdkVersion: 35,
            // Enable 16 KB native library alignment for Android 15+
            minSdkVersion: 24,
            // NDK r27b will be used automatically by Expo SDK 52
            // This ensures proper 16 KB page size support
          }
        }
      ]
    ] : [
      'expo-secure-store',
      'expo-font',
      [
        'expo-build-properties',
        {
          android: {
            compileSdkVersion: 35,
            targetSdkVersion: 35,
            // Enable 16 KB native library alignment for Android 15+
            minSdkVersion: 24,
            // NDK r27b will be used automatically by Expo SDK 52
            // This ensures proper 16 KB page size support
          }
        }
      ]
    ]
  }
};
