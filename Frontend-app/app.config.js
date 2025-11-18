const IS_DEV = process.env.APP_VARIANT === 'development';

export default {
  expo: {
    name: IS_DEV ? 'Mathematico (Dev)' : 'Mathematico',
    slug: 'mathematico-app',
    version: '8.1.0',
    orientation: 'portrait',
    owner: 'anupam_dev',
    icon: './assets/icon.png',
    web: {
      favicon: './assets/favicon.png'
    },
    extra: {
      eas: {
        projectId: 'dca54a1e-e6a7-4be5-897d-49e52257cd0e'
      }
    },
    android: {
      package: 'com.anupam1505.mathematicoapp',
      versionCode: 9,
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
            minSdkVersion: 24,
            packagingOptions: {
              jniLibs: {
                useLegacyPackaging: false
              }
            }
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
            minSdkVersion: 24,
            packagingOptions: {
              jniLibs: {
                useLegacyPackaging: false
              }
            }
          }
        }
      ]
    ]
  }
};
