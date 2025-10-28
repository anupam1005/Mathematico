const IS_DEV = process.env.APP_VARIANT === 'development';

export default {
  expo: {
    name: IS_DEV ? 'Mathematico (Dev)' : 'Mathematico - Learn Mathematics',
    slug: 'mathematico-app',
    version: '7.0.0',
    orientation: 'portrait',
    owner: 'dascompany',
    icon: './assets/icon.png',
    web: {
      favicon: './assets/favicon.png'
    },
    extra: {
      eas: {
        projectId: '255fef59-0801-4e61-b4e9-063cec864a6d'
      }
    },
    android: {
      package: 'com.anupam1505.mathematicoapp',
      versionCode: 7,
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
            targetSdkVersion: 35
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
            targetSdkVersion: 35
          }
        }
      ]
    ]
  }
};
