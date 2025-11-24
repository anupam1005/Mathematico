const IS_DEV = process.env.APP_VARIANT === 'development';

export default {
  expo: {
    name: IS_DEV ? 'Mathematico (Dev)' : 'Mathematico',
    slug: 'mathematico-app',
    version: '8.1.1',
    orientation: 'portrait',
    owner: 'anupam-dev',
    icon: './assets/icon.png',
    web: {
      favicon: './assets/favicon.png'
    },
    extra: {
      eas: {
        projectId: 'f7a70815-47dc-4d9f-a832-8ee98ea1ab55'
      }
    },
    android: {
      package: 'com.anupam1505.mathematicoapp',
      versionCode: 11,
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
      './plugins/withRazorpay.js',
      [
        'expo-build-properties',
        {
          android: {
            compileSdkVersion: 35,
            targetSdkVersion: 35,
            minSdkVersion: 24,
            enable16KbPageSize: true,
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
      './plugins/withRazorpay.js',
      [
        'expo-build-properties',
        {
          android: {
            compileSdkVersion: 35,
            targetSdkVersion: 35,
            minSdkVersion: 24,
            enable16KbPageSize: true,
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
